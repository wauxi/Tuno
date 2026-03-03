<?php
if (!defined('SECURE_ACCESS')) exit('Access denied');

require_once __DIR__ . '/../auth-functions.php';
require_once __DIR__ . '/../utils/Logger.php';

function removeFromListenLater($pdo, $data) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'User not authenticated.']);
        return;
    }

    if (!isAdmin($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Access denied. Only administrators can delete albums.'
        ]);
        return;
    }

    if (!isset($data['album_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Insufficient data']);
        return;
    }

    $albumId = (int)$data['album_id'];

    try {
        $pdo->beginTransaction();

        $checkStmt = $pdo->prepare("SELECT id, artist, album_name FROM albums WHERE id = ?");
        $checkStmt->execute([$albumId]);
        $album = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$album) {
            $pdo->rollback();
            echo json_encode(['success' => false, 'message' => 'Album not found']);
            return;
        }

        $pdo->prepare("DELETE FROM ratings WHERE album_id = ?")->execute([$albumId]);
        $pdo->prepare("DELETE FROM albums WHERE id = ?")->execute([$albumId]);
        $pdo->commit();

        Logger::info('Album deleted', [
            'album' => $album,
            'admin' => $_SESSION['username']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Album deleted successfully',
            'deleted_album' => $album
        ]);

    } catch (Exception $e) {
        $pdo->rollback();
        Logger::error('Delete error', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error during deletion']);
    }
}
