<?php
define('SECURE_ACCESS', true);
require_once 'auth-functions.php';
require_once 'Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = Database::getInstance()->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Некорректные данные']);
        exit;
    }
    
    $action = $input['action'];
    
    if ($action === 'logout') {
        session_start();
        
        $logoutUser = $_SESSION['username'] ?? 'неизвестный';
        
        $_SESSION = array();
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
        
        error_log("🚪 Пользователь $logoutUser вышел из системы");
        
        echo json_encode([
            'success' => true,
            'message' => 'Выход выполнен успешно'
        ]);
        exit;
    }
    
    $inputUsername = trim($input['username'] ?? '');
    $inputPassword = $input['password'] ?? '';
    
    if ($action === 'login' || $action === 'register') {
        if (empty($inputUsername) || empty($inputPassword)) {
            echo json_encode(['success' => false, 'message' => 'Заполните все поля']);
            exit;
        }
        
        if (strlen($inputUsername) < 2) {
            echo json_encode(['success' => false, 'message' => 'Никнейм должен содержать минимум 2 символа']);
            exit;
        }
        
        if (strlen($inputPassword) < 3) {
            echo json_encode(['success' => false, 'message' => 'Пароль должен содержать минимум 3 символа']);
            exit;
        }
    }
    
    try {
        if ($action === 'login') {
            $query = "SELECT id, username, display_name, password, role FROM users WHERE username = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$inputUsername]);
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $user['password'] === $inputPassword) {
                session_start();
                session_regenerate_id(true); 
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'] ?? 'user';
                
                error_log("🔑 Пользователь {$user['username']} (роль: {$user['role']}) успешно авторизовался");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Успешный вход',
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'display_name' => $user['display_name'],
                        'role' => $user['role'] ?? 'user',
                        'isAdmin' => ($user['role'] === 'admin')
                    ]
                ]);
            } else {
                error_log("❌ Неудачная попытка входа для пользователя: $inputUsername");
                echo json_encode(['success' => false, 'message' => 'Неверный никнейм или пароль']);
            }
            
        } elseif ($action === 'register') {
            $checkQuery = "SELECT id FROM users WHERE username = ?";
            $checkStmt = $pdo->prepare($checkQuery);
            $checkStmt->execute([$inputUsername]);
            
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Пользователь с таким никнеймом уже существует']);
                exit;
            }
            
            $insertQuery = "INSERT INTO users (username, display_name, password, role) VALUES (?, ?, ?, ?)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$inputUsername, $inputUsername, $inputPassword, 'user']);
            
            error_log("👤 Зарегистрирован новый пользователь: $inputUsername");
            
            echo json_encode([
                'success' => true,
                'message' => 'Регистрация прошла успешно'
            ]);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Неизвестное действие: ' . $action]);
        }
        
    } catch(PDOException $e) {
        error_log("Ошибка базы данных в auth-api: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Ошибка сервера']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
}
?>