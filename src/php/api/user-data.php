<?php
require_once __DIR__ . '/../core/Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = Database::getInstance()->getConnection();
    
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id is required']);
        exit;
    }
    
    // Get favorite albums
    $favoriteAlbums = [];
    $stmt = $pdo->prepare("
        SELECT album_id, slot_number 
        FROM user_favorite_albums 
        WHERE user_id = ? 
        ORDER BY slot_number
    ");
    $stmt->execute([$userId]);
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($favorites as $fav) {
        $favoriteAlbums[] = [
            'album_id' => (int)$fav['album_id'],
            'slot_number' => (int)$fav['slot_number']
        ];
    }
    
    // Get recent activity (recent ratings)
    $stmt = $pdo->prepare("
        SELECT r.album_id, r.rating, r.created_at
        FROM ratings r
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 20
    ");
    $stmt->execute([$userId]);
    $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($recentActivity as &$activity) {
        $activity['album_id'] = (int)$activity['album_id'];
        $activity['rating'] = (float)$activity['rating'];
    }
    
    // Get listen later list
    $listenLater = [];
    // TODO: Implement when listen_later table is created
    
    // Get albums data
    $albums = [];
    // TODO: Load album details if needed
    
    $response = [
        'success' => true,
        'favoriteAlbums' => $favoriteAlbums,
        'recentActivity' => $recentActivity,
        'listenLater' => $listenLater,
        'albums' => $albums
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
