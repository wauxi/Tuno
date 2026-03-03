<?php
/**
 * Auth helper used by admin.php
 */

require_once __DIR__ . '/core/Database.php';

function isAdmin($userId, $pdo = null) {
    if (!$pdo) {
        $pdo = Database::getInstance()->getConnection();
    }
    
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user && $user['role'] === 'admin';
}
