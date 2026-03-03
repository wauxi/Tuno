<?php
define('SECURE_ACCESS', true);

require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../utils/Logger.php';
require_once __DIR__ . '/../validators/InputValidator.php';
require_once __DIR__ . '/../services/AlbumService.php';

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? ($_POST['action'] ?? null);

try {
    switch ($_SERVER['REQUEST_METHOD']) {

        case 'GET':
            if ($action === 'search') {
                require_once __DIR__ . '/albums.php';
                handleSearchAlbums($pdo);
                exit;
            }

            // Main page (RecentActivity + ListenLater)
            $userId = isset($_GET['user_id'])
                ? InputValidator::validateUserId($_GET['user_id'])
                : 1;

            Logger::debug('Loading data for user', ['user_id' => $userId]);

            require_once __DIR__ . '/albums.php';
            handleGetAlbumsOverview($pdo, $userId);
            exit;

        case 'POST':
            // PHP doesn't parse JSON body into $_POST — doing it manually
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            if (!$action) {
                $action = $body['action'] ?? null;
            }

            if (!$action) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No action specified']);
                exit;
            }

            if ($action === 'remove_from_listen_later') {
                require_once __DIR__ . '/admin.php';
                removeFromListenLater($pdo, $body);
                exit;
            }

            echo json_encode([
                'success' => false,
                'message' => 'Unknown POST action: ' . $action
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    Logger::error('API error', ['exception' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
