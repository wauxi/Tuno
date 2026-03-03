<?php
require_once __DIR__ . '/../core/cors.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/auth-middleware.php';
require_once __DIR__ . '/../validators/InputValidator.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getInstance()->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'POST':
        addRating($pdo, $input);
        break;
    case 'PUT':
        updateRating($pdo, $input);
        break;
    case 'DELETE':
        deleteRating($pdo, $input);
        break;
    case 'GET':
        getRating($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function addRating($pdo, $data) {
    if (!isset($data['album_id']) || !isset($data['user_id']) || !isset($data['rating'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Insufficient data']);
        return;
    }

    try {
        $albumId = InputValidator::validateAlbumId($data['album_id']);
        $userId = InputValidator::validateUserId($data['user_id']);
        $rating = InputValidator::validateRating($data['rating']);
        $favoriteSong = InputValidator::validateSongName($data['favorite_song'] ?? null);
        $leastFavoriteSong = InputValidator::validateSongName($data['least_favorite_song'] ?? null);
        $mustListen = !empty($data['must_listen']) ? 1 : 0;
        $wouldRelisten = !empty($data['would_relisten']) ? 1 : 0;
        $review = InputValidator::validateReview($data['review'] ?? null);
        $listenedDate = !empty($data['listened_date']) ? InputValidator::validateDate($data['listened_date']) : null;
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }

    requireAuth($userId);

    $pdo->beginTransaction();
    
    try {
        $checkQuery = "SELECT id FROM ratings WHERE album_id = ? AND user_id = ? FOR UPDATE";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$albumId, $userId]);
        
        if ($checkStmt->fetch()) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Rating already exists']);
            return;
        }

        $insertQuery = "INSERT INTO ratings (album_id, user_id, rating, favorite_song, least_favorite_song, must_listen, would_relisten, review, listened_date, sheet_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user_ratings')";
        $insertStmt = $pdo->prepare($insertQuery);
        $insertStmt->execute([$albumId, $userId, $rating, $favoriteSong, $leastFavoriteSong, $mustListen, $wouldRelisten, $review, $listenedDate]);

        $ratingId = $pdo->lastInsertId();
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Rating added', 'rating_id' => $ratingId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

function updateRating($pdo, $data) {
    if (!isset($data['rating_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Rating ID not specified']);
        return;
    }

    $sessionUserId = requireAuth();

    // Verify the rating belongs to the authenticated user
    $ownerCheck = $pdo->prepare("SELECT user_id FROM ratings WHERE id = ?");
    $ownerCheck->execute([(int)$data['rating_id']]);
    $rating = $ownerCheck->fetch(PDO::FETCH_ASSOC);
    if (!$rating || (int)$rating['user_id'] !== $sessionUserId) {
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            return;
        }
    }

    $ratingId = (int)$data['rating_id'];
    
    try {
        $rating = isset($data['rating']) ? InputValidator::validateRating($data['rating']) : null;
        $favoriteSong = InputValidator::validateSongName($data['favorite_song'] ?? null);
        $leastFavoriteSong = InputValidator::validateSongName($data['least_favorite_song'] ?? null);
        $mustListen = isset($data['must_listen']) ? (!empty($data['must_listen']) ? 1 : 0) : null;
        $wouldRelisten = isset($data['would_relisten']) ? (!empty($data['would_relisten']) ? 1 : 0) : null;
        $review = InputValidator::validateReview($data['review'] ?? null);
        $listenedDate = !empty($data['listened_date']) ? InputValidator::validateDate($data['listened_date']) : null;
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }

    $updateFields = [];
    $updateValues = [];

    if ($rating !== null) {
        $updateFields[] = "rating = ?";
        $updateValues[] = $rating;
    }
    if ($favoriteSong !== null) {
        $updateFields[] = "favorite_song = ?";
        $updateValues[] = $favoriteSong;
    }
    if ($leastFavoriteSong !== null) {
        $updateFields[] = "least_favorite_song = ?";
        $updateValues[] = $leastFavoriteSong;
    }
    if ($mustListen !== null) {
        $updateFields[] = "must_listen = ?";
        $updateValues[] = $mustListen;
    }
    if ($wouldRelisten !== null) {
        $updateFields[] = "would_relisten = ?";
        $updateValues[] = $wouldRelisten;
    }
    if ($review !== null) {
        $updateFields[] = "review = ?";
        $updateValues[] = $review;
    }
    if ($listenedDate !== null) {
        $updateFields[] = "listened_date = ?";
        $updateValues[] = $listenedDate;
    }

    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No data to update']);
        return;
    }

    $updateValues[] = $ratingId;
    $updateQuery = "UPDATE ratings SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->execute($updateValues);

    if ($updateStmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Rating updated']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Rating not found']);
    }
}

function deleteRating($pdo, $data) {
    if (!isset($data['rating_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Rating ID not specified']);
        return;
    }

    try {
        $ratingId = InputValidator::validateRatingId($data['rating_id']);
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }

    $sessionUserId = requireAuth();

    // Verify the rating belongs to the authenticated user
    $ownerCheck = $pdo->prepare("SELECT user_id FROM ratings WHERE id = ?");
    $ownerCheck->execute([$ratingId]);
    $rating = $ownerCheck->fetch(PDO::FETCH_ASSOC);
    if (!$rating || (int)$rating['user_id'] !== $sessionUserId) {
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            return;
        }
    }

    $deleteQuery = "DELETE FROM ratings WHERE id = ?";
    $deleteStmt = $pdo->prepare($deleteQuery);
    $deleteStmt->execute([$ratingId]);

    if ($deleteStmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Rating deleted']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Rating not found']);
    }
}

function getRating($pdo) {
    try {
        $albumId = isset($_GET['album_id']) ? InputValidator::validateAlbumId($_GET['album_id']) : null;
        $userId = isset($_GET['user_id']) ? InputValidator::validateUserId($_GET['user_id']) : null;
    } catch (InvalidArgumentException $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        return;
    }

    if (!$albumId || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'album_id and user_id are required']);
        return;
    }

    $query = "SELECT * FROM ratings WHERE album_id = ? AND user_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$albumId, $userId]);
    $rating = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($rating) {
        echo json_encode(['success' => true, 'rating' => $rating]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Rating not found']);
    }
}
?>