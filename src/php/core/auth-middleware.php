<?php
/**
 * Authentication middleware.
 * Call requireAuth() in any endpoint that modifies data.
 * Returns the authenticated user_id from the session.
 */

function requireAuth($requestedUserId = null) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $sessionUserId = (int)$_SESSION['user_id'];

    // If a specific user_id was requested, verify it matches the session
    if ($requestedUserId !== null && (int)$requestedUserId !== $sessionUserId) {
        // Allow admins to act on behalf of other users
        if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
            return $sessionUserId;
        }
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied: you can only modify your own data'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $sessionUserId;
}
