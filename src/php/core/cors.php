<?php
/**
 * CORS Configuration
 * Centralized Cross-Origin Resource Sharing configuration
 */

// Allowed origins (whitelist)
$allowedOrigins = [
    'http://localhost:5173',        // Vite dev server
    'http://localhost:3000',        // Alternative dev port
    'http://127.0.0.1:5173',
    'http://ms2',                   // Docker alias
    'https://yourdomain.com'        // Production (replace with your actual domain)
];

// Get origin from request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if origin is in whitelist — whitelist only, no fallback
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

// Other CORS headers
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}
?>
