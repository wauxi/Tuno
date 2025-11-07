<?php
require_once __DIR__ . '/../core/Database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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
        echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
}

function addRating($pdo, $data) {
    if (!isset($data['album_id']) || !isset($data['user_id']) || !isset($data['rating'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Недостаточно данных']);
        return;
    }

    $albumId = (int)$data['album_id'];
    $userId = (int)$data['user_id'];
    $rating = (int)$data['rating'];
    $favoriteSong = $data['favorite_song'] ?? null;
    $leastFavoriteSong = $data['least_favorite_song'] ?? null;
    $mustListen = isset($data['must_listen']) ? (int)$data['must_listen'] : 0;
    $wouldRelisten = isset($data['would_relisten']) ? (int)$data['would_relisten'] : 0;
    $review = $data['review'] ?? null;
    $listenedDate = $data['listened_date'] ?? null;

    $checkQuery = "SELECT id FROM ratings WHERE album_id = ? AND user_id = ?";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$albumId, $userId]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Оценка уже существует']);
        return;
    }

    $insertQuery = "INSERT INTO ratings (album_id, user_id, rating, favorite_song, least_favorite_song, must_listen, would_relisten, review, listened_date, sheet_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user_ratings')";
    $insertStmt = $pdo->prepare($insertQuery);
    $insertStmt->execute([$albumId, $userId, $rating, $favoriteSong, $leastFavoriteSong, $mustListen, $wouldRelisten, $review, $listenedDate]);

    echo json_encode(['success' => true, 'message' => 'Оценка добавлена', 'rating_id' => $pdo->lastInsertId()]);
}

function updateRating($pdo, $data) {
    if (!isset($data['rating_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Не указан ID оценки']);
        return;
    }

    $ratingId = (int)$data['rating_id'];
    $rating = isset($data['rating']) ? (int)$data['rating'] : null;
    $favoriteSong = $data['favorite_song'] ?? null;
    $leastFavoriteSong = $data['least_favorite_song'] ?? null;
    $mustListen = isset($data['must_listen']) ? (int)$data['must_listen'] : null;
    $wouldRelisten = isset($data['would_relisten']) ? (int)$data['would_relisten'] : null;
    $review = $data['review'] ?? null;
    $listenedDate = $data['listened_date'] ?? null;

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
        echo json_encode(['success' => false, 'message' => 'Нет данных для обновления']);
        return;
    }

    $updateValues[] = $ratingId;
    $updateQuery = "UPDATE ratings SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->execute($updateValues);

    if ($updateStmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Оценка обновлена']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Оценка не найдена']);
    }
}

function deleteRating($pdo, $data) {
    if (!isset($data['rating_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Не указан ID оценки']);
        return;
    }

    $ratingId = (int)$data['rating_id'];

    $deleteQuery = "DELETE FROM ratings WHERE id = ?";
    $deleteStmt = $pdo->prepare($deleteQuery);
    $deleteStmt->execute([$ratingId]);

    if ($deleteStmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Оценка удалена']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Оценка не найдена']);
    }
}

function getRating($pdo) {
    $albumId = isset($_GET['album_id']) ? (int)$_GET['album_id'] : null;
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

    if (!$albumId || !$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Требуются album_id и user_id']);
        return;
    }

    $query = "SELECT * FROM ratings WHERE album_id = ? AND user_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$albumId, $userId]);
    $rating = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($rating) {
        echo json_encode(['success' => true, 'rating' => $rating]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Оценка не найдена']);
    }
}
?>