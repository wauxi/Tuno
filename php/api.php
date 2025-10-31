<?php
define('SECURE_ACCESS', true);
require_once 'auth-functions.php';
require_once 'Database.php';
require_once 'spotify-helper.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = Database::getInstance()->getConnection();
createCoverCacheTable($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'search') {
    error_log("=== ПОИСК АЛЬБОМОВ ===");
    error_log("GET параметры: " . json_encode($_GET));
    handleSearchAlbums();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1;
        error_log("API запрос для пользователя: " . $userId);
        
        $recentQuery = "
            SELECT 
                a.album_name,
                a.artist,
                a.spotify_link,
                a.id as album_id,
                r.rating,
                r.listened_date,
                r.id as rating_id,
                r.favorite_song,
                r.least_favorite_song,
                r.must_listen,
                r.would_relisten,
                r.review
            FROM albums a 
            INNER JOIN ratings r ON a.id = r.album_id 
            INNER JOIN (
                SELECT 
                    album_id,
                    MAX(id) as max_rating_id
                FROM ratings 
                WHERE rating IS NOT NULL 
                    AND user_id = ?
                GROUP BY album_id
            ) latest ON r.id = latest.max_rating_id
            WHERE r.user_id = ?
            ORDER BY 
                CASE 
                    WHEN r.listened_date IS NOT NULL THEN r.listened_date
                    ELSE '1970-01-01'
                END DESC,
                r.id DESC
            LIMIT 4
        ";
        
        $recentStmt = $pdo->prepare($recentQuery);
        $recentStmt->execute([$userId, $userId]);
        $recentResults = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Recent Activity найдено записей: " . count($recentResults));
        
        $recentActivity = [];
        foreach ($recentResults as $row) {
            $albumId = getSpotifyAlbumId($row['spotify_link']);
            $coverUrl = $albumId ? getSpotifyCoverUrlWithCache($albumId, $pdo) : null;
            
            $recentActivity[] = [
                'album_name' => $row['album_name'],
                'artist' => $row['artist'],
                'rating' => $row['rating'],
                'coverUrl' => $coverUrl ?: 'https://via.placeholder.com/150x150/1a1a1a/ffffff?text=' . urlencode($row['album_name']),
                'spotify_link' => $row['spotify_link'],
                'album_id' => $row['album_id'],
                'listened_date' => $row['listened_date'] ?: date('Y-m-d'),
                'rating_id' => $row['rating_id'],
                'favorite_song' => $row['favorite_song'],
                'least_favorite_song' => $row['least_favorite_song'],
                'must_listen' => $row['must_listen'],
                'would_relisten' => $row['would_relisten'],
                'review' => $row['review']
            ];
        }
        
        $listenLaterQuery = "
            SELECT 
                a.album_name,
                a.artist,
                a.spotify_link,
                a.id as album_id
            FROM albums a 
            WHERE a.id NOT IN (
                SELECT DISTINCT album_id 
                FROM ratings 
                WHERE user_id = ? 
                    AND rating IS NOT NULL
            )
            ORDER BY a.id DESC
            LIMIT 8
        ";
        
        $listenLaterStmt = $pdo->prepare($listenLaterQuery);
        $listenLaterStmt->execute([$userId]);
        $listenLaterResults = $listenLaterStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Listen Later найдено записей: " . count($listenLaterResults));
        
        $listenLater = [];
        foreach ($listenLaterResults as $row) {
            $albumId = getSpotifyAlbumId($row['spotify_link']);
            $coverUrl = $albumId ? getSpotifyCoverUrlWithCache($albumId, $pdo) : null;
            
            $listenLater[] = [
                'album_name' => $row['album_name'],
                'artist' => $row['artist'],
                'coverUrl' => $coverUrl ?: 'https://via.placeholder.com/150x150/1a1a1a/ffffff?text=' . urlencode($row['album_name']),
                'album_id' => $row['album_id']
            ];
        }
        
        $albumsQuery = "SELECT * FROM albums ORDER BY artist, album_name LIMIT 50";
        $albumsStmt = $pdo->prepare($albumsQuery);
        $albumsStmt->execute();
        $albums = $albumsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response = [
            'success' => true,
            'recentActivity' => $recentActivity,
            'listenLater' => $listenLater,
            'albums' => $albums,
            'debug' => [
                'userId' => $userId,
                'recentCount' => count($recentActivity),
                'listenLaterCount' => count($listenLater),
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } catch(PDOException $e) {
        error_log("Ошибка SQL: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Ошибка выполнения запроса: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Не указано действие'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    switch ($input['action']) {
        case 'remove_from_listen_later':
            session_start();
            
            if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
                error_log("❌ ОТКАЗАНО: Попытка удаления альбома без авторизации");
                http_response_code(401);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Пользователь не авторизован. Войдите в систему для выполнения этого действия.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            if (!isAdmin($_SESSION['user_id'])) {
                error_log("❌ ОТКАЗАНО: Пользователь {$_SESSION['username']} (ID: {$_SESSION['user_id']}) попытался удалить альбом без прав администратора");
                http_response_code(403);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Доступ запрещен. Только администратор может удалять альбомы из базы данных.',
                    'current_user' => $_SESSION['username'],
                    'current_role' => $_SESSION['role'] ?? 'user',
                    'required_role' => 'admin'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            error_log("✅ РАЗРЕШЕНО: Администратор {$_SESSION['username']} (ID: {$_SESSION['user_id']}) авторизован для удаления альбомов");
            removeFromListenLater($pdo, $input);
            break;
        default:
            echo json_encode([
                'success' => true,
                'message' => 'POST действие не реализовано: ' . $input['action']
            ], JSON_UNESCAPED_UNICODE);
    }
}

function handleSearchAlbums() {
    global $pdo;
    
    try {
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        
        error_log("🔍 Поиск по запросу: '$query'");
        
        if (empty($query)) {
            error_log("⚠️ Пустой запрос поиска");
            echo json_encode(['success' => true, 'albums' => [], 'query' => ''], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $searchQuery = "
            SELECT 
                id,
                artist,
                album_name,
                genre,
                spotify_link
            FROM albums 
            WHERE 
                LOWER(album_name) LIKE LOWER(?) 
                OR LOWER(artist) LIKE LOWER(?)
            ORDER BY 
                CASE 
                    WHEN LOWER(album_name) LIKE LOWER(?) THEN 1
                    WHEN LOWER(artist) LIKE LOWER(?) THEN 2
                    ELSE 3
                END,
                artist, album_name
            LIMIT 20
        ";
        
        $searchTerm = "%{$query}%";
        $exactSearchTerm = "{$query}%";
        
        error_log("📝 SQL запрос: " . str_replace('?', "'$searchTerm'", $searchQuery));
        
        $stmt = $pdo->prepare($searchQuery);
        $stmt->execute([
            $searchTerm, 
            $searchTerm, 
            $exactSearchTerm, 
            $exactSearchTerm
        ]);
        
        $albums = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("📊 Найдено альбомов: " . count($albums));
        
        foreach ($albums as &$album) {
            error_log("🎵 Обрабатываем альбом: {$album['album_name']} - {$album['artist']}");
            error_log("🔗 Spotify ссылка: {$album['spotify_link']}");
            
            $albumId = getSpotifyAlbumId($album['spotify_link']);
            error_log("🆔 Spotify ID: " . ($albumId ?: 'НЕ НАЙДЕН'));
            
            if ($albumId) {
                $album['coverUrl'] = getSpotifyCoverUrlWithCache($albumId, $pdo);
                error_log("🖼️ URL обложки: " . ($album['coverUrl'] ?: 'НЕ ПОЛУЧЕН'));
            } else {
                $album['coverUrl'] = null;
            }
            
            if (!$album['coverUrl']) {
                $album['coverUrl'] = 'https://via.placeholder.com/150x150/1a1a1a/ffffff?text=' . 
                                   urlencode($album['album_name']);
                error_log("🖼️ Используем placeholder: {$album['coverUrl']}");
            }
        }
        
        $response = [
            'success' => true, 
            'albums' => $albums,
            'query' => $query,
            'count' => count($albums),
            'debug' => [
                'searchTerm' => $searchTerm,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];
        
        error_log("✅ Ответ готов: " . json_encode($response, JSON_UNESCAPED_UNICODE));
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } catch(PDOException $e) {
        error_log("❌ Ошибка поиска: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Ошибка выполнения поиска: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    } catch(Exception $e) {
        error_log("❌ Общая ошибка поиска: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'error' => 'Общая ошибка: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

function removeFromListenLater($pdo, $data) {
    error_log("=== НАЧАЛО removeFromListenLater ===");
    error_log("Входные данные: " . json_encode($data));
    
    if (!isset($data['album_id'])) {
        error_log("ОШИБКА: недостаточно данных");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Недостаточно данных'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $albumId = (int)$data['album_id'];
    
    error_log("Обработанные данные: albumId=$albumId");
    
    if (!$albumId) {
        error_log("ОШИБКА: некорректные данные после преобразования");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Некорректные данные'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        error_log("Транзакция начата");
        
        $checkQuery = "SELECT id, artist, album_name FROM albums WHERE id = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$albumId]);
        $album = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("Альбом найден: " . json_encode($album));
        
        if (!$album) {
            $pdo->rollback();
            error_log("Альбом для удаления не найден");
            echo json_encode([
                'success' => false, 
                'message' => 'Альбом не найден в базе данных'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $deleteRatingsQuery = "DELETE FROM ratings WHERE album_id = ?";
        $deleteRatingsStmt = $pdo->prepare($deleteRatingsQuery);
        $deleteRatingsStmt->execute([$albumId]);
        $deletedRatings = $deleteRatingsStmt->rowCount();
        
        error_log("Удалено записей из ratings: $deletedRatings");
        
        $deleteAlbumQuery = "DELETE FROM albums WHERE id = ?";
        $deleteAlbumStmt = $pdo->prepare($deleteAlbumQuery);
        $result = $deleteAlbumStmt->execute([$albumId]);
        
        error_log("Результат execute(): " . ($result ? 'true' : 'false'));
        
        $deletedRows = $deleteAlbumStmt->rowCount();
        error_log("Количество удаленных альбомов: $deletedRows");
        
        $checkStmt->execute([$albumId]);
        $albumAfter = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("Альбом после удаления: " . json_encode($albumAfter));
        
        $pdo->commit();
        error_log("Транзакция зафиксирована");
        
        if (!$albumAfter) {
            $adminInfo = $_SESSION['username'] ?? 'unknown';
            error_log("✅ УСПЕХ: Альбом '{$album['album_name']}' - '{$album['artist']}' (ID: $albumId) успешно удален администратором $adminInfo");
            
            echo json_encode([
                'success' => true, 
                'message' => 'Альбом успешно удален из базы данных администратором',
                'deleted_album' => $album,
                'deleted_ratings' => $deletedRatings,
                'admin' => $adminInfo
            ], JSON_UNESCAPED_UNICODE);
        } else {
            error_log("❌ ОШИБКА: Альбом остался после удаления!");
            echo json_encode([
                'success' => false, 
                'message' => 'Ошибка: альбом не был удален'
            ], JSON_UNESCAPED_UNICODE);
        }
        
    } catch (Exception $e) {
        $pdo->rollback();
        error_log("ИСКЛЮЧЕНИЕ в removeFromListenLater: " . $e->getMessage());
        error_log("Стек вызовов: " . $e->getTraceAsString());
        
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка при удалении: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
    
    error_log("=== КОНЕЦ removeFromListenLater ===");
}

?>