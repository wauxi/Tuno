<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/auth-middleware.php';
require_once __DIR__ . '/../utils/Logger.php';
require_once __DIR__ . '/../validators/InputValidator.php';

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getInstance()->getConnection();

// GET - get user settings
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit;
    }
    
    try {
        $userId = InputValidator::validateUserId($userId);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
    
    try {
        // Get user data
        $stmt = $pdo->prepare("SELECT id, username, display_name, avatar_url, bio FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Get favorite albums
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

// POST - update settings
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
    
    // Verify the authenticated user matches the requested user_id
    requireAuth($userId);
    
    try {
        $userId = InputValidator::validateUserId($userId);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
    
    try {
        // Check user existence
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }
        
        // Update profile
        if ($action === 'update_profile') {
            try {
                $username = InputValidator::validateUsername($input['username'] ?? '');
                $displayName = InputValidator::validateDisplayName($input['display_name'] ?? $username);
                $bio = trim($input['bio'] ?? '');
                if (mb_strlen($bio, 'UTF-8') > 500) {
                    echo json_encode(['success' => false, 'message' => 'Bio must be less than 500 characters']);
                    exit;
                }
            } catch (InvalidArgumentException $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                exit;
            }
            
            // Check username uniqueness
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $userId]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Username already taken']);
                exit;
            }
            
            // Update data
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
        
        // Update favorite albums
        if ($action === 'update_favorites') {
            $favorites = $input['favorites'] ?? [];
            
            // Validation: maximum 4 albums
            if (count($favorites) > 4) {
                echo json_encode(['success' => false, 'message' => 'Maximum 4 favorite albums allowed']);
                exit;
            }
            
            $pdo->beginTransaction();
            
            try {
                // Delete old favorites
                $stmt = $pdo->prepare("DELETE FROM user_favorite_albums WHERE user_id = ?");
                $stmt->execute([$userId]);
                
                // Add new ones
                $stmt = $pdo->prepare("
                    INSERT INTO user_favorite_albums (user_id, album_id, slot_number)
                    VALUES (?, ?, ?)
                ");
                
                foreach ($favorites as $favorite) {
                    $albumId = $favorite['album_id'] ?? null;
                    $slotNumber = $favorite['slot_number'] ?? null;
                    
                    try {
                        $albumId = InputValidator::validateAlbumId($albumId);
                        $slotNumber = InputValidator::validateInteger($slotNumber, 1, 4);
                    } catch (InvalidArgumentException $e) {
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
        
        // Unknown action
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
        
    } catch (PDOException $e) {
        Logger::error("Error updating user settings: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
    
    exit;
}

// Method not allowed
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
