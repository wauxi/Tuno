<?php
/**
 * CORS Configuration
 * Централизованная настройка Cross-Origin Resource Sharing
 */

// Разрешенные origins (whitelist)
$allowedOrigins = [
    'http://localhost:5173',        // Vite dev server
    'http://localhost:3000',        // Alternative dev port
    'http://127.0.0.1:5173',
    'http://ms2',                   // Docker alias
    'https://yourdomain.com'        // Production (замените на реальный домен)
];

// Получить origin из запроса
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Проверить если origin в whitelist
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // В development режиме - разрешить все (ТОЛЬКО для разработки!)
    $isDev = getenv('APP_ENV') !== 'production';
    if ($isDev && $origin) {
        header("Access-Control-Allow-Origin: $origin");
    }
}

// Остальные CORS headers
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
