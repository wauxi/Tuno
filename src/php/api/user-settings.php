<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../utils/Logger.php';

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = Database::getInstance()->getConnection();

// GET - получить настройки пользователя
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Получить данные пользователя
        $stmt = $pdo->prepare("SELECT id, username, display_name, avatar_url, bio FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Получить избранные альбомы
        $stmt = $pdo->prepare("
            SELECT 
                ufa.slot_number,
                a.id as album_id,
                a.artist,
                a.album_name,
                acc.cover_url
            FROM user_favorite_albums ufa
            JOIN albums a ON ufa.album_id = a.id
            LEFT JOIN album_covers_cache acc ON a.id = acc.album_id
            WHERE ufa.user_id = ?
            ORDER BY ufa.slot_number
        ");
        $stmt->execute([$userId]);
        $favoriteAlbums = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'favoriteAlbums' => $favoriteAlbums
        ]);
        
    } catch (PDOException $e) {
        Logger::error("Error fetching user settings: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    
    exit;
}

// POST - обновить настройки
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }
    
    $action = $input['action'];
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Проверить существование пользователя
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Обновить профиль
        if ($action === 'update_profile') {
            $username = trim($input['username'] ?? '');
            $displayName = trim($input['display_name'] ?? '');
            $bio = trim($input['bio'] ?? '');
            
            // Если displayName пустой, использовать username
            if (empty($displayName)) {
                $displayName = $username;
            }
            
            // Валидация
            if (empty($username)) {
                echo json_encode(['success' => false, 'message' => 'Username is required']);
                exit;
            }
            
            if (strlen($username) < 2) {
                echo json_encode(['success' => false, 'message' => 'Username must be at least 2 characters']);
                exit;
            }
            
            if (strlen($bio) > 500) {
                echo json_encode(['success' => false, 'message' => 'Bio must be less than 500 characters']);
                exit;
            }
            
            // Проверить уникальность username
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $userId]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Username already taken']);
                exit;
            }
            
            // Обновить данные
            $stmt = $pdo->prepare("
                UPDATE users 
                SET username = ?, display_name = ?, bio = ?
                WHERE id = ?
            ");
            $stmt->execute([$username, $displayName, $bio, $userId]);
            
            Logger::info("User $userId updated profile");
            
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
            exit;
        }
        
        // Обновить избранные альбомы
        if ($action === 'update_favorites') {
            $favorites = $input['favorites'] ?? [];
            
            // Валидация: максимум 4 альбома
            if (count($favorites) > 4) {
                echo json_encode(['success' => false, 'message' => 'Maximum 4 favorite albums allowed']);
                exit;
            }
            
            $pdo->beginTransaction();
            
            try {
                // Удалить старые избранные
                $stmt = $pdo->prepare("DELETE FROM user_favorite_albums WHERE user_id = ?");
                $stmt->execute([$userId]);
                
                // Добавить новые
                $stmt = $pdo->prepare("
                    INSERT INTO user_favorite_albums (user_id, album_id, slot_number)
                    VALUES (?, ?, ?)
                ");
                
                foreach ($favorites as $favorite) {
                    $albumId = $favorite['album_id'] ?? null;
                    $slotNumber = $favorite['slot_number'] ?? null;
                    
                    if (!$albumId || !$slotNumber || $slotNumber < 1 || $slotNumber > 4) {
                        $pdo->rollBack();
                        echo json_encode(['success' => false, 'message' => 'Invalid favorite album data']);
                        exit;
                    }
                    
                    $stmt->execute([$userId, $albumId, $slotNumber]);
                }
                
                $pdo->commit();
                
                Logger::info("User $userId updated favorite albums");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Favorite albums updated successfully'
                ]);
                
            } catch (PDOException $e) {
                $pdo->rollBack();
                throw $e;
            }
            
            exit;
        }
        
        // Неизвестное действие
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        
    } catch (PDOException $e) {
        Logger::error("Error updating user settings: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    
    exit;
}

// Метод не поддерживается
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
