<?php
if (!defined('SECURE_ACCESS')) exit('Access denied');

require_once __DIR__ . '/../services/AlbumService.php';
require_once __DIR__ . '/../validators/InputValidator.php';
require_once __DIR__ . '/../utils/Logger.php';

function handleSearchAlbums($pdo) {
    try {
        $query = isset($_GET['q']) ? InputValidator::validateString($_GET['q'], 100) : '';

        if (empty($query)) {
            Logger::debug('Empty search query');
            echo json_encode(['success' => true, 'albums' => [], 'query' => '']);
            return;
        }

        $albumService = new AlbumService($pdo);
        $albums = $albumService->searchAlbums($query, 20);

        echo json_encode([
            'success' => true,
            'albums' => $albums,
            'query' => $query,
            'count' => count($albums)
        ]);

    } catch (Exception $e) {
        Logger::error('Search error', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка выполнения поиска']);
    }
}

function handleGetAlbumsOverview($pdo, $userId) {
    try {
        $albumService = new AlbumService($pdo);

        $recentActivity = $albumService->getRecentActivity($userId, 4);
        $listenLater = $albumService->getListenLater($userId, 8);

        echo json_encode([
            'success' => true,
            'recentActivity' => $recentActivity,
            'listenLater' => $listenLater
        ]);

    } catch (Exception $e) {
        Logger::error('Overview error', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['error' => 'Ошибка загрузки данных']);
    }
}
