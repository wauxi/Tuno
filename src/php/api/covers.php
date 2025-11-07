<?php
define('SECURE_ACCESS', true);
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../services/CoverService.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$pdo = Database::getInstance()->getConnection();
$coverService = new CoverService($pdo);

// Только админ
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isAdmin($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required'], JSON_UNESCAPED_UNICODE);
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
                echo json_encode(['success' => false, 'error' => 'Unknown action'], JSON_UNESCAPED_UNICODE);
        }
    } 
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        handleDelete($coverService);
    }
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

function handleUpload($coverService) {
    $albumId = $_POST['album_id'] ?? null;
    
    if (!$albumId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'album_id is required'], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!isset($_FILES['cover']) || $_FILES['cover']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No file provided'], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $result = $coverService->uploadCustomCover((int)$albumId, $_FILES['cover']);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

function handleRefreshCache($coverService) {
    $albumId = $_POST['album_id'] ?? null;

    try {
        if ($albumId) {
            $coverService->refreshCache((int)$albumId);
            echo json_encode(['success' => true, 'message' => 'Cache refreshed for album ' . $albumId], JSON_UNESCAPED_UNICODE);
        } else {
            $coverService->refreshCache();
            echo json_encode(['success' => true, 'message' => 'All cache refreshed'], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

function handleGetLastfm($coverService) {
    $artist = $_POST['artist'] ?? null;
    $albumName = $_POST['album'] ?? null;

    if (!$artist || !$albumName) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'artist and album are required'], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $coverUrl = $coverService->getLastfmCover($artist, $albumName);
        
        if ($coverUrl) {
            echo json_encode(['success' => true, 'cover_url' => $coverUrl], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Cover not found on Last.fm'], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

function handleDelete($coverService) {
    $input = json_decode(file_get_contents('php://input'), true);
    $albumId = $input['album_id'] ?? null;

    if (!$albumId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'album_id is required'], JSON_UNESCAPED_UNICODE);
        return;
    }

    try {
        $coverService->deleteCover((int)$albumId);
        echo json_encode(['success' => true, 'message' => 'Cover deleted'], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
?>
