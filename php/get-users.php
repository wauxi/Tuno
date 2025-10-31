<?php
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = Database::getInstance()->getConnection();
    
    $query = "SELECT id, username, display_name FROM users ORDER BY id";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
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
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка базы данных: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>