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
     * Get recent user activity
     * @param int $userId User ID
     * @param int $limit Record limit
     * @return array Array of albums with ratings
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
     * Get listen later album list
     * @param int $userId User ID
     * @param int $limit Record limit
     * @return array Array of unlistened albums
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
     * Search albums by name or artist
     * @param string $query Search query
     * @param int $limit Result limit
     * @return array Array of found albums
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
                        WHEN LOWER(album_name) = LOWER(?) THEN 0
                        WHEN LOWER(album_name) LIKE LOWER(?) THEN 1
                        WHEN LOWER(album_name) LIKE LOWER(?) THEN 2
                        WHEN LOWER(artist) = LOWER(?) THEN 3
                        WHEN LOWER(artist) LIKE LOWER(?) THEN 4
                        ELSE 5
                    END,
                    artist, album_name
                LIMIT ?
            ";

            $searchTerm = "%{$query}%";
            $prefixTerm = "{$query}%";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $searchTerm, 
                $searchTerm, 
                $query,
                $prefixTerm, 
                $searchTerm,
                $query,
                $prefixTerm, 
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
     * Enrich album array with covers (batch loading)
     * @param array $albums Array of albums
     * @param string $idKey Album ID key in array
     * @param bool $simpleFormat Simplified format (main fields only)
     * @return array Enriched array
     */
    private function enrichWithCovers($albums, $idKey = 'album_id', $simpleFormat = false) {
        if (empty($albums)) {
            return [];
        }

        // Batch load all covers in a single query
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
                // Simplified format for Listen Later and Search
                $enriched[] = [
                    'album_name' => $album['album_name'],
                    'artist' => $album['artist'],
                    'coverUrl' => $coverUrl,
                    'album_id' => $albumId,
                    'genre' => $album['genre'] ?? null,
                    'spotify_link' => $album['spotify_link'] ?? null
                ];
            } else {
                // Full format for Recent Activity
                $enriched[] = [
                    'album_name' => $album['album_name'],
                    'artist' => $album['artist'],
                    'coverUrl' => $coverUrl,
                    'album_id' => $albumId,
                    'spotify_link' => $album['spotify_link'] ?? null,
                    'rating' => $album['rating'] ?? null,
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
     * Get user's favorite albums
     * @param int $userId User ID
     * @return array Array of favorite albums with covers
     */
    public function getFavoriteAlbums($userId) {
        try {
            $query = "
                SELECT
                    a.id as album_id,
                    a.artist,
                    a.album_name,
                    a.spotify_link,
                    ufa.slot_number
                FROM user_favorite_albums ufa
                JOIN albums a ON ufa.album_id = a.id
                WHERE ufa.user_id = ?
                ORDER BY ufa.slot_number
            ";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($results)) {
                return [];
            }

            // Save slot_number before enrichment (enrichWithCovers doesn't preserve it)
            $slotMap = [];
            foreach ($results as $r) {
                $slotMap[(int)$r['album_id']] = (int)$r['slot_number'];
            }

            $enriched = $this->enrichWithCovers($results, 'album_id', true);

            foreach ($enriched as &$album) {
                $album['slot_number'] = $slotMap[(int)$album['album_id']] ?? null;
            }

            return $enriched;

        } catch (PDOException $e) {
            Logger::error('Error loading favorite albums', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get full album information by ID
     * @param int $albumId Album ID
     * @return array|null Album data or null
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
