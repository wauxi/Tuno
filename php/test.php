
<?php
echo "Сервер работает!<br>";
echo "PHP версия: " . phpversion() . "<br>";
echo "Текущее время: " . date('Y-m-d H:i:s') . "<br>";

$host = 'localhost';
$dbname = 'musicboard';
$username = 'root';
$password = ''; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Подключение к базе данных успешно!<br>";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Таблицы в базе: " . implode(', ', $tables) . "<br>";

    $count = $pdo->query("SELECT COUNT(*) FROM albums")->fetchColumn();
    echo "Количество альбомов в базе: " . $count . "<br>";
    
} catch(PDOException $e) {
    echo "❌ Ошибка подключения к базе данных: " . $e->getMessage() . "<br>";
}
?>