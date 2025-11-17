<?php
$env = static function (string $key, $default = null) {
    $value = getenv($key);
    return $value === false ? $default : $value;
};

define('DB_HOST', $env('DB_HOST', 'localhost'));
define('DB_NAME', $env('DB_NAME', 'musicboard'));
define('DB_USER', $env('DB_USER', 'root'));
define('DB_PASS', $env('DB_PASS', ''));
define('DB_PORT', (int)$env('DB_PORT', 3306));

define('DEFAULT_USER_ID', 1);
define('ITEMS_PER_PAGE', 20);
define('CACHE_LIFETIME', 3600);

// Last.fm API Key для получения обложек альбомов
putenv('LASTFM_API_KEY=3fdbf4b02503cce767f69bc52ad8b494');
?>