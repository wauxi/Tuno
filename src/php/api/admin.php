<?php
if (!defined('SECURE_ACCESS')) exit('Access denied');

require_once __DIR__ . '/../auth-functions.php';
require_once __DIR__ . '/../utils/Logger.php';

function removeFromListenLater($pdo) {
    session_start();

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Пользователь не авторизован.']);
        return;
    }

    if (!isAdmin($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Доступ запрещен. Только администратор может удалять альбомы.'
        ]);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['album_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Недостаточно данных']);
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
            echo json_encode(['success' => false, 'message' => 'Альбом не найден']);
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
            'message' => 'Альбом успешно удален',
            'deleted_album' => $album
        ]);

    } catch (Exception $e) {
        $pdo->rollback();
        Logger::error('Delete error', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Ошибка при удалении']);
    }
}
