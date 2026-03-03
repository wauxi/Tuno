<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../auth-functions.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../services/CoverService.php';
require_once __DIR__ . '/../validators/InputValidator.php';
require_once __DIR__ . '/../utils/Logger.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getInstance()->getConnection();
$coverService = new CoverService($pdo);

// Admin only
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

if (!isAdmin($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? null;

        switch ($action) {
            case 'upload':
                handleUpload($coverService);
                break;

            case 'refresh_cache':
                handleRefreshCache($coverService);
                break;

            case 'get_lastfm':
                handleGetLastfm($coverService);
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Unknown action']);
        }
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        handleDelete($coverService);
    }
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    Logger::error("Covers API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}

function handleUpload($coverService) {
    try {
        $albumId = InputValidator::validateAlbumId($_POST['album_id'] ?? null);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        return;
    }

    if (!isset($_FILES['cover']) || $_FILES['cover']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No file provided']);
        return;
    }

    try {
        $result = $coverService->uploadCustomCover($albumId, $_FILES['cover']);
        echo json_encode($result);
    } catch (Exception $e) {
        Logger::error("Cover upload error: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Failed to upload cover']);
    }
}

function handleRefreshCache($coverService) {
    $albumId = $_POST['album_id'] ?? null;

    try {
        if ($albumId) {
            $albumId = InputValidator::validateAlbumId($albumId);
            $coverService->refreshCache($albumId);
            echo json_encode(['success' => true, 'message' => 'Cache refreshed for album ' . $albumId]);
        } else {
            $coverService->refreshCache();
            echo json_encode(['success' => true, 'message' => 'All cache refreshed']);
        }
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    } catch (Exception $e) {
        Logger::error("Cache refresh error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to refresh cache']);
    }
}

function handleGetLastfm($coverService) {
    try {
        $artist = InputValidator::validateArtistName($_POST['artist'] ?? '');
        $albumName = InputValidator::validateAlbumName($_POST['album'] ?? '');
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        return;
    }

    try {
        $coverUrl = $coverService->getLastfmCover($artist, $albumName);
        
        if ($coverUrl) {
            echo json_encode(['success' => true, 'cover_url' => $coverUrl]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Cover not found on Last.fm']);
        }
    } catch (Exception $e) {
        Logger::error("Last.fm API error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch cover from Last.fm']);
    }
}

function handleDelete($coverService) {
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $albumId = InputValidator::validateAlbumId($input['album_id'] ?? null);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        return;
    }

    try {
        $coverService->deleteCover($albumId);
        echo json_encode(['success' => true, 'message' => 'Cover deleted']);
    } catch (Exception $e) {
        Logger::error("Cover delete error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete cover']);
    }
}
?>
