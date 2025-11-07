<?php
define('SECURE_ACCESS', true);

require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/utils/Logger.php';
require_once __DIR__ . '/validators/InputValidator.php';
require_once __DIR__ . '/services/AlbumService.php';
require_once __DIR__ . '/services/AuthService.php';

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$pdo = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? ($_POST['action'] ?? null);

try {
    switch ($_SERVER['REQUEST_METHOD']) {

        case 'GET':
            if ($action === 'search') {
                require_once __DIR__ . '/api/albums.php';
                handleSearchAlbums($pdo);
                exit;
            }

            // Основная страница (RecentActivity + ListenLater)
            $userId = isset($_GET['user_id'])
                ? InputValidator::validateUserId($_GET['user_id'])
                : 1;

            Logger::debug('Loading data for user', ['user_id' => $userId]);

            require_once __DIR__ . '/api/albums.php';
            handleGetAlbumsOverview($pdo, $userId);
            exit;

        case 'POST':
            if (!$action) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Не указано действие']);
                exit;
            }

            if ($action === 'remove_from_listen_later') {
                require_once __DIR__ . '/api/admin.php';
                removeFromListenLater($pdo);
                exit;
            }

            echo json_encode([
                'success' => false,
                'message' => 'Неизвестное POST-действие: ' . $action
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Метод не поддерживается']);
    }

} catch (Exception $e) {
    Logger::error('API error', ['exception' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
