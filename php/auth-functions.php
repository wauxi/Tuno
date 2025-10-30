<?php
if (!defined('SECURE_ACCESS')) {
    die('Direct access not allowed');
}

require_once 'config.php';

function isAdmin($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $user && $user['role'] === 'admin';
    } catch (PDOException $e) {
        error_log("Ошибка проверки прав администратора: " . $e->getMessage());
        return false;
    }
}

function getUserByUsername($username) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Ошибка получения пользователя: " . $e->getMessage());
        return false;
    }
}

function requireAdmin() {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    if (!isAdmin($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ запрещен. Требуются права администратора'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    return $_SESSION['user_id'];
}
?>