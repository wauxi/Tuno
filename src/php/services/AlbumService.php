<?php
if (!defined('SECURE_ACCESS')) exit('Access denied');

require_once __DIR__ . '/../utils/Logger.php';
require_once __DIR__ . '/CoverService.php';

class AlbumService {
    private $pdo;
    private $coverService;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->coverService = new CoverService($pdo);
    }

    /**
     * Получить недавнюю активность пользователя
     * @param int $userId ID пользователя
     * @param int $limit Лимит записей
     * @return array Массив альбомов с рейтингами
     */
    public function getRecentActivity($userId, $limit = 4) {
        try {
            $query = "
                SELECT
                    a.album_name, a.artist, a.spotify_link, a.id as album_id,
                    r.rating, r.listened_date, r.id as rating_id,
                    r.favorite_song, r.least_favorite_song, r.must_listen, 
                    r.would_relisten, r.review
                FROM albums a
                INNER JOIN ratings r ON a.id = r.album_id
                INNER JOIN (
                    SELECT album_id, MAX(id) as max_rating_id
                    FROM ratings
                    WHERE rating IS NOT NULL AND user_id = ?
                    GROUP BY album_id
                ) latest ON r.id = latest.max_rating_id
                WHERE r.user_id = ?
                ORDER BY
                    COALESCE(r.listened_date, '1970-01-01') DESC, r.id DESC
                LIMIT ?
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$userId, $userId, $limit]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Logger::debug('Recent activity loaded', [
                'user_id' => $userId,
                'count' => count($results)
            ]);

            return $this->enrichWithCovers($results, 'album_id');

        } catch (PDOException $e) {
            Logger::error('Error loading recent activity', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Получить список альбомов для прослушивания позже
     * @param int $userId ID пользователя
     * @param int $limit Лимит записей
     * @return array Массив непрослушанных альбомов
     */
    public function getListenLater($userId, $limit = 8) {
        try {
            $query = "
                SELECT 
                    a.album_name, 
                    a.artist, 
                    a.spotify_link, 
                    a.id as album_id
                FROM albums a
                WHERE a.id NOT IN (
                    SELECT DISTINCT album_id 
                    FROM ratings 
                    WHERE user_id = ? AND rating IS NOT NULL
                )
                ORDER BY a.id DESC
                LIMIT ?
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$userId, $limit]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Logger::debug('Listen later loaded', [
                'user_id' => $userId,
                'count' => count($results)
            ]);

            return $this->enrichWithCovers($results, 'album_id', true);

        } catch (PDOException $e) {
            Logger::error('Error loading listen later', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Поиск альбомов по названию или исполнителю
     * @param string $query Поисковый запрос
     * @param int $limit Лимит результатов
     * @return array Массив найденных альбомов
     */
    public function searchAlbums($query, $limit = 20) {
        try {
            if (empty($query)) {
                return [];
            }

            $sql = "
                SELECT 
                    id, 
                    artist, 
                    album_name, 
                    genre, 
                    spotify_link
                FROM albums
                WHERE LOWER(album_name) LIKE LOWER(?) 
                   OR LOWER(artist) LIKE LOWER(?)
                ORDER BY
                    CASE
                        WHEN LOWER(album_name) LIKE LOWER(?) THEN 1
                        WHEN LOWER(artist) LIKE LOWER(?) THEN 2
                        ELSE 3
                    END,
                    artist, album_name
                LIMIT ?
            ";

            $searchTerm = "%{$query}%";
            $exactSearchTerm = "{$query}%";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $searchTerm, 
                $searchTerm, 
                $exactSearchTerm, 
                $exactSearchTerm, 
                $limit
            ]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Logger::info('Album search completed', [
                'query' => $query,
                'count' => count($results)
            ]);

            return $this->enrichWithCovers($results, 'id', true);

        } catch (PDOException $e) {
            Logger::error('Error searching albums', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Обогащение массива альбомов обложками (batch-загрузка)
     * @param array $albums Массив альбомов
     * @param string $idKey Ключ ID альбома в массиве
     * @param bool $simpleFormat Упрощенный формат (только основные поля)
     * @return array Обогащенный массив
     */
    private function enrichWithCovers($albums, $idKey = 'album_id', $simpleFormat = false) {
        if (empty($albums)) {
            return [];
        }

        // Batch-загрузка всех обложек одним запросом
        $albumIds = array_column($albums, $idKey);
        $coverUrls = $this->coverService->getBatchCoverUrls($albumIds);

        $enriched = [];
        foreach ($albums as $album) {
            $albumId = $album[$idKey];
            
            $coverUrl = $coverUrls[$albumId] ?? 
                $this->coverService->getCoverUrl($albumId, [
                    'spotify_link' => $album['spotify_link'] ?? null,
                    'artist' => $album['artist'],
                    'album_name' => $album['album_name']
                ]) ??
                'https://via.placeholder.com/150x150/1a1a1a/ffffff?text=' . 
                urlencode($album['album_name']);

            if ($simpleFormat) {
                // Упрощенный формат для Listen Later и Search
                $enriched[] = [
                    'album_name' => $album['album_name'],
                    'artist' => $album['artist'],
                    'coverUrl' => $coverUrl,
                    'album_id' => $albumId,
                    'genre' => $album['genre'] ?? null,
                    'spotify_link' => $album['spotify_link'] ?? null
                ];
            } else {
                // Полный формат для Recent Activity
                $enriched[] = [
                    'album_name' => $album['album_name'],
                    'artist' => $album['artist'],
                    'rating' => $album['rating'] ?? null,
                    'coverUrl' => $coverUrl,
                    'spotify_link' => $album['spotify_link'] ?? null,
                    'album_id' => $albumId,
                    'listened_date' => $album['listened_date'] ?? date('Y-m-d'),
                    'rating_id' => $album['rating_id'] ?? null,
                    'favorite_song' => $album['favorite_song'] ?? null,
                    'least_favorite_song' => $album['least_favorite_song'] ?? null,
                    'must_listen' => $album['must_listen'] ?? null,
                    'would_relisten' => $album['would_relisten'] ?? null,
                    'review' => $album['review'] ?? null
                ];
            }
        }

        return $enriched;
    }

    /**
     * Получить полную информацию об альбоме по ID
     * @param int $albumId ID альбома
     * @return array|null Данные альбома или null
     */
    public function getAlbumById($albumId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM albums WHERE id = ?
            ");
            $stmt->execute([$albumId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            Logger::error('Error loading album', [
                'album_id' => $albumId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
