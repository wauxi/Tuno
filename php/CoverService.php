<?php
require_once __DIR__ . '/config.php';

class CoverService {
    private $pdo;
    private $cacheLifetime = 2592000; // 30 дней вместо 6 часов
    
    const SOURCE_MANUAL = 'manual';
    const SOURCE_SPOTIFY = 'spotify';
    const SOURCE_LASTFM = 'lastfm';

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Получить обложку альбома с гибридным подходом
     * Приоритет: manual > spotify > lastfm
     */
    public function getCoverUrl($albumId, $albumData = null) {
        if (!$albumId) return null;

        try {
            // 1. Проверить кэш
            $cached = $this->getCachedCover($albumId);
            if ($cached) {
                return $cached['cover_url'];
            }

            // 2. Попробовать Spotify
            if (!empty($albumData['spotify_link'])) {
                $spotifyId = $this->extractSpotifyId($albumData['spotify_link']);
                if ($spotifyId) {
                    $spotifyCover = $this->getSpotifyCover($spotifyId);
                    if ($spotifyCover) {
                        $this->cacheCover($albumId, $spotifyId, $spotifyCover, self::SOURCE_SPOTIFY);
                        return $spotifyCover;
                    }
                }
            }

            // 3. Попробовать Last.fm
            if ($albumData && !empty($albumData['artist']) && !empty($albumData['album_name'])) {
                $lastfmCover = $this->getLastfmCover($albumData['artist'], $albumData['album_name']);
                if ($lastfmCover) {
                    $this->cacheCover($albumId, null, $lastfmCover, self::SOURCE_LASTFM);
                    return $lastfmCover;
                }
            }

            return null;

        } catch (Exception $e) {
            error_log("CoverService error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Загрузить собственную обложку (админ)
     */
    public function uploadCustomCover($albumId, $file) {
        if (!isset($file['tmp_name']) || !isset($file['name'])) {
            throw new Exception("Некорректный формат файла");
        }

        // Валидация
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        $mime = mime_content_type($file['tmp_name']);
        if (!in_array($mime, $allowedMimes)) {
            throw new Exception("Формат не поддерживается. Используйте JPG, PNG или WebP");
        }

        if ($file['size'] > $maxSize) {
            throw new Exception("Файл слишком большой. Максимум 5MB");
        }

        // Создать директорию
        $uploadsDir = dirname(__DIR__) . '/uploads/covers';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Сохранить файл
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = "album_{$albumId}_" . time() . "." . $ext;
        $filepath = $uploadsDir . '/' . $filename;
        $relativePath = 'uploads/covers/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception("Ошибка сохранения файла");
        }

        // Сохранить в БД
        $query = "
            INSERT INTO album_covers_cache (album_id, spotify_id, cover_url, source, updated_at)
            VALUES (?, NULL, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                cover_url = VALUES(cover_url),
                source = VALUES(source),
                updated_at = NOW()
        ";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$albumId, $relativePath, self::SOURCE_MANUAL]);

        return [
            'success' => true,
            'cover_url' => $relativePath,
            'message' => 'Обложка загружена'
        ];
    }

    /**
     * Batch-загрузка обложек для нескольких альбомов (решение N+1)
     * @param array $albumIds - массив ID альбомов
     * @return array - ассоциативный массив [album_id => cover_url]
     */
    public function getBatchCoverUrls($albumIds) {
        if (empty($albumIds)) return [];
        
        $placeholders = str_repeat('?,', count($albumIds) - 1) . '?';
        $query = "
            SELECT album_id, cover_url, source, updated_at
            FROM album_covers_cache
            WHERE album_id IN ($placeholders)
        ";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($albumIds);
        $cached = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $results = [];
        $now = time();
        
        // Обработать закэшированные обложки
        foreach ($cached as $row) {
            // Manual uploads всегда валидны
            if ($row['source'] === self::SOURCE_MANUAL) {
                $results[$row['album_id']] = $row['cover_url'];
                continue;
            }
            
            // Проверить TTL для Spotify/Last.fm
            $updatedTime = strtotime($row['updated_at']);
            if (($now - $updatedTime) < $this->cacheLifetime) {
                $results[$row['album_id']] = $row['cover_url'];
            }
        }
        
        return $results;
    }

    /**
     * Получить из кэша
     */
    private function getCachedCover($albumId) {
        $query = "
            SELECT album_id, spotify_id, cover_url, source, updated_at
            FROM album_covers_cache
            WHERE album_id = ?
        ";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$albumId]);
        $cached = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$cached) return null;

        // Manual uploads не имеют TTL
        if ($cached['source'] === self::SOURCE_MANUAL) {
            return $cached;
        }

        // Проверить TTL для Spotify/Last.fm
        $updatedTime = strtotime($cached['updated_at']);
        $now = time();
        
        if (($now - $updatedTime) < $this->cacheLifetime) {
            return $cached;
        }

        return null;
    }

    /**
     * Сохранить в кэш
     */
    private function cacheCover($albumId, $spotifyId, $coverUrl, $source) {
        // Сначала проверить, есть ли уже запись
        $checkQuery = "SELECT id FROM album_covers_cache WHERE album_id = ?";
        $checkStmt = $this->pdo->prepare($checkQuery);
        $checkStmt->execute([$albumId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Обновить существующую запись
            $updateQuery = "
                UPDATE album_covers_cache 
                SET spotify_id = ?, cover_url = ?, source = ?, updated_at = NOW()
                WHERE album_id = ?
            ";
            $stmt = $this->pdo->prepare($updateQuery);
            return $stmt->execute([$spotifyId, $coverUrl, $source, $albumId]);
        } else {
            // Вставить новую запись
            $insertQuery = "
                INSERT INTO album_covers_cache (album_id, spotify_id, cover_url, source, updated_at)
                VALUES (?, ?, ?, ?, NOW())
            ";
            $stmt = $this->pdo->prepare($insertQuery);
            return $stmt->execute([$albumId, $spotifyId, $coverUrl, $source]);
        }
    }

    /**
     * Получить из Spotify
     */
    private function getSpotifyCover($spotifyId) {
        if (!$spotifyId) return null;

        try {
            $oembedUrl = "https://open.spotify.com/oembed?url=spotify:album:" . $spotifyId;
            
            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'method' => 'GET',
                    'header' => 'User-Agent: Musicboard/2.0'
                ]
            ]);

            $response = @file_get_contents($oembedUrl, false, $context);
            
            if ($response === false) return null;

            $data = json_decode($response, true);
            
            if (isset($data['thumbnail_url'])) {
                return str_replace('cover', '640x640', $data['thumbnail_url']);
            }

            return null;

        } catch (Exception $e) {
            error_log("Spotify cover error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Получить из Last.fm
     */
    public function getLastfmCover($artist, $albumName) {
        if (!$artist || !$albumName) return null;

        try {
            $apiKey = getenv('LASTFM_API_KEY');
            if (!$apiKey) {
                error_log("Last.fm API key not configured");
                return null;
            }

            $url = sprintf(
                "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=%s&album=%s&api_key=%s&format=json",
                urlencode($artist),
                urlencode($albumName),
                $apiKey
            );

            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'method' => 'GET',
                    'header' => 'User-Agent: Musicboard/2.0'
                ]
            ]);

            $response = @file_get_contents($url, false, $context);
            
            if ($response === false) return null;

            $data = json_decode($response, true);

            if (isset($data['album']['image']) && is_array($data['album']['image'])) {
                // Найти самое большое изображение
                $images = $data['album']['image'];
                foreach (array_reverse($images) as $image) {
                    if (isset($image['#text']) && !empty($image['#text'])) {
                        return $image['#text'];
                    }
                }
            }

            return null;

        } catch (Exception $e) {
            error_log("Last.fm cover error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Извлечь Spotify ID
     */
    private function extractSpotifyId($url) {
        if (!$url) return null;
        
        $pattern = '/album\/([a-zA-Z0-9]{22})/';
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Удалить обложку
     */
    public function deleteCover($albumId) {
        $query = "SELECT cover_url, source FROM album_covers_cache WHERE album_id = ?";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$albumId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && $row['source'] === self::SOURCE_MANUAL && strpos($row['cover_url'], 'uploads/') === 0) {
            $filepath = dirname(__DIR__) . '/' . $row['cover_url'];
            if (file_exists($filepath)) {
                unlink($filepath);
            }
        }

        $deleteQuery = "DELETE FROM album_covers_cache WHERE album_id = ?";
        $deleteStmt = $this->pdo->prepare($deleteQuery);
        return $deleteStmt->execute([$albumId]);
    }

    /**
     * Очистить кэш (кроме manual)
     */
    public function refreshCache($albumId = null) {
        if ($albumId) {
            $query = "DELETE FROM album_covers_cache WHERE album_id = ? AND source != ?";
            $stmt = $this->pdo->prepare($query);
            return $stmt->execute([$albumId, self::SOURCE_MANUAL]);
        }

        $query = "DELETE FROM album_covers_cache WHERE source != ?";
        $stmt = $this->pdo->prepare($query);
        return $stmt->execute([self::SOURCE_MANUAL]);
    }
}
?>
