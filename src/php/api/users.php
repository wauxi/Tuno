<?php
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../utils/Logger.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = Database::getInstance()->getConnection();
    
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 100;
    $offset = isset($_GET['offset']) ? max((int)$_GET['offset'], 0) : 0;
    
    $query = "SELECT id, username, display_name, avatar_url, bio FROM users ORDER BY id LIMIT ? OFFSET ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$limit, $offset]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as &$user) {
        $user['id'] = (int)$user['id'];
    }
    
    $response = [
        'success' => true,
        'users' => $users
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    Logger::error('Database error in users API', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error'], JSON_UNESCAPED_UNICODE);
}
?>