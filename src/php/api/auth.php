<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../validators/InputValidator.php';
require_once __DIR__ . '/../utils/Logger.php';

// Определить окружение из переменной среды
$isDev = getenv('APP_ENV') !== 'production';
Logger::setDevelopmentMode($isDev);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');

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
        
        Logger::auth("logout", $logoutUser);
        
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
            $query = "SELECT id, username, display_name, avatar_url, bio, password, role FROM users WHERE username = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$inputUsername]);
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($inputPassword, $user['password'])) {
                session_start();
                session_regenerate_id(true); 
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'] ?? 'user';
                
                Logger::auth("login", $user['username'], true);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Успешный вход',
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'display_name' => $user['display_name'],
                        'avatar_url' => $user['avatar_url'],
                        'bio' => $user['bio'],
                        'role' => $user['role'] ?? 'user',
                        'isAdmin' => ($user['role'] === 'admin')
                    ]
                ]);
            } else {
                Logger::auth("login", $inputUsername, false);
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
            
            $hashedPassword = password_hash($inputPassword, PASSWORD_ARGON2ID);

            $insertQuery = "INSERT INTO users (username, display_name, password, role) VALUES (?, ?, ?, ?)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$inputUsername, $inputUsername, $hashedPassword, 'user']);
            
            Logger::info("User registered", ['username' => $inputUsername]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Регистрация прошла успешно'
            ]);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Неизвестное действие: ' . $action]);
        }
        
    } catch(PDOException $e) {
        Logger::error("Database error in auth-api", ['error' => $e->getMessage()]);
        echo json_encode(['success' => false, 'message' => 'Ошибка сервера']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
}
?>
