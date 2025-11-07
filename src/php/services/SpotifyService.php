<?php

function getSpotifyAlbumId($url) {
    if (!$url) return null;
    
    $pattern = '/album\/([a-zA-Z0-9]{22})/';
    if (preg_match($pattern, $url, $matches)) {
        return $matches[1];
    }
    return null;
}

function getSpotifyCoverUrl($albumId) {
    if (!$albumId) return null;
    
    try {
        $oembedUrl = "https://open.spotify.com/oembed?url=spotify:album:" . $albumId;
        
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'method' => 'GET',
                'header' => 'User-Agent: Musicboard/1.0'
            ]
        ]);
        
        $response = @file_get_contents($oembedUrl, false, $context);
        
        if ($response !== false) {
            $data = json_decode($response, true);
            if (isset($data['thumbnail_url'])) {
                return str_replace('cover', '640x640', $data['thumbnail_url']);
            }
        }
    } catch (Exception $e) {
        error_log("Ошибка получения обложки Spotify: " . $e->getMessage());
    }
    
    return null;
}

function getSpotifyCoverUrlWithCache($albumId, $pdo) {
    if (!$albumId) return null;
    
    try {
        $cacheQuery = "SELECT cover_url, updated_at FROM album_covers_cache WHERE album_id = ?";
        $cacheStmt = $pdo->prepare($cacheQuery);
        $cacheStmt->execute([$albumId]);
        $cached = $cacheStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($cached && (time() - strtotime($cached['updated_at'])) < 21600) {
            return $cached['cover_url'];
        }
        
        $coverUrl = getSpotifyCoverUrl($albumId);
        
        if ($coverUrl) {
            $insertQuery = "
                INSERT INTO album_covers_cache (album_id, cover_url, updated_at) 
                VALUES (?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE 
                cover_url = VALUES(cover_url), 
                updated_at = VALUES(updated_at)
            ";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$albumId, $coverUrl]);
        }
        
        return $coverUrl;
        
    } catch (Exception $e) {
        error_log("Ошибка кеширования обложки: " . $e->getMessage());
        return getSpotifyCoverUrl($albumId);
    }
}

function createCoverCacheTable($pdo) {
    $createTableQuery = "
        CREATE TABLE IF NOT EXISTS album_covers_cache (
            album_id VARCHAR(22) PRIMARY KEY,
            cover_url VARCHAR(500),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $pdo->exec($createTableQuery);
}
?>