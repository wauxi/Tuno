<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/RateLimiter.php';
require_once __DIR__ . '/../validators/InputValidator.php';
require_once __DIR__ . '/../utils/Logger.php';

// Determine environment from env variable
$isDev = getenv('APP_ENV') !== 'production';
Logger::setDevelopmentMode($isDev);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');

// Secure session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', 1);

$pdo = Database::getInstance()->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    $action = $input['action'];
    
    if ($action === 'logout') {
        session_start();
        
        $logoutUser = $_SESSION['username'] ?? 'unknown';
        
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
            'message' => 'Logout successful'
        ]);
        exit;
    }
    
    $inputUsername = trim($input['username'] ?? '');
    $inputPassword = $input['password'] ?? '';
    
    if ($action === 'login' || $action === 'register') {
        // Rate limiting: 10 login attempts / 15 min, 5 register attempts / 1 hour
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $rateLimitKey = "auth_{$action}_{$ip}";
        $maxAttempts = ($action === 'login') ? 10 : 5;
        $window = ($action === 'login') ? 900 : 3600;
        
        if (!RateLimiter::check($rateLimitKey, $maxAttempts, $window)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'message' => 'Too many attempts. Please try again later.']);
            exit;
        }
        
        RateLimiter::hit($rateLimitKey, $window);
        
        if (empty($inputUsername) || empty($inputPassword)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            exit;
        }
        
        try {
            $inputUsername = InputValidator::validateUsername($inputUsername);
            InputValidator::validatePassword($inputPassword);
        } catch (InvalidArgumentException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
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
                RateLimiter::reset($rateLimitKey);
                
                session_start();
                session_regenerate_id(true); 
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'] ?? 'user';
                
                Logger::auth("login", $user['username'], true);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
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
                echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
            }
            
        } elseif ($action === 'register') {
            $checkQuery = "SELECT id FROM users WHERE username = ?";
            $checkStmt = $pdo->prepare($checkQuery);
            $checkStmt->execute([$inputUsername]);
            
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                exit;
            }
            
            $hashedPassword = password_hash($inputPassword, PASSWORD_ARGON2ID);

            $insertQuery = "INSERT INTO users (username, display_name, password, role) VALUES (?, ?, ?, ?)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$inputUsername, $inputUsername, $hashedPassword, 'user']);
            
            Logger::info("User registered", ['username' => $inputUsername]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful'
            ]);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        }
        
    } catch(PDOException $e) {
        Logger::error("Database error in auth-api", ['error' => $e->getMessage()]);
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
