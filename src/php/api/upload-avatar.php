<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../utils/Logger.php';

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$pdo = Database::getInstance()->getConnection();

// Параметры загрузки
$userId = $_POST['user_id'] ?? null;
$uploadDir = __DIR__ . '/../../../public/uploads/avatars/';
$maxFileSize = 2 * 1024 * 1024; // 2MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Этап 1: Проверка user_id
if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

// Этап 2: Проверка файла
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['avatar'];

// Проверить тип файла
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and WEBP are allowed']);
    exit;
}

// Проверить размер
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 2MB limit']);
    exit;
}

try {
    // Этап 3: Получить старый аватар пользователя
    $stmt = $pdo->prepare("SELECT avatar_url FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $oldAvatarUrl = $user['avatar_url'];
    
    // Создать директорию если не существует
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Генерировать уникальное имя файла
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'user_' . $userId . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Этап 4: Сохранить новый файл
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save uploaded file');
    }
    
    Logger::info("Avatar file saved: $filename");
    
    // Этап 5: Обновить БД
    $avatarUrl = 'uploads/avatars/' . $filename;
    $stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
    $updateSuccess = $stmt->execute([$avatarUrl, $userId]);
    
    if ($updateSuccess) {
        Logger::info("User $userId updated avatar in DB: $avatarUrl");
        
        // Этап 6: Удалить старый файл (если был)
        if ($oldAvatarUrl) {
            $oldFile = __DIR__ . '/../../../public/' . $oldAvatarUrl;
            if (file_exists($oldFile)) {
                unlink($oldFile);
                Logger::info("Old avatar deleted: $oldAvatarUrl");
            }
        }
        
        // Этап 7: Успешный ответ
        echo json_encode([
            'success' => true,
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => $avatarUrl
        ]);
    } else {
        // Откат: удалить новый файл
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        throw new Exception('Failed to update database');
    }
    
} catch (Exception $e) {
    Logger::error("Error uploading avatar: " . $e->getMessage());
    
    // Откат: удалить новый файл если был создан
    if (isset($filepath) && file_exists($filepath)) {
        unlink($filepath);
    }
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to upload avatar']);
}
