<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'musicboard');
define('DB_USER', 'root');
define('DB_PASS', ''); 

define('DEFAULT_USER_ID', 1); 
define('ITEMS_PER_PAGE', 20);
define('CACHE_LIFETIME', 3600);

// Last.fm API Key для получения обложек альбомов
putenv('LASTFM_API_KEY=3fdbf4b02503cce767f69bc52ad8b494');
?>