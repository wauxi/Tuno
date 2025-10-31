<?php
// php/migrate_passwords.php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Logger.php';

// This script is intended to be run from CLI (php migrate_passwords.php).
// If you need a web-based migration use the generate_password_update_sql.php helper instead.
if (PHP_SAPI !== 'cli') {
    echo "This script should be run from CLI only. Use php/generate_password_update_sql.php for browser output.\n";
    exit(1);
}

Logger::setDevelopmentMode(true);
Logger::setLevel(Logger::LEVEL_INFO);

$pdo = Database::getInstance()->getConnection();

try {
    // Сделать бэкап/проверку вручную до запуска!
    $select = $pdo->query("SELECT id, password FROM users");
    $users = $select->fetchAll(PDO::FETCH_ASSOC);

    $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");

    // Choose hashing algorithm: prefer Argon2id when available, otherwise fallback to PASSWORD_DEFAULT
    $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;

    $errors = [];

    $count = 0;
    foreach ($users as $u) {
        $id = $u['id'];
        $pwd = $u['password'];

        // Если поле пустое — пропустить / залогировать
        if ($pwd === null || $pwd === '') {
            Logger::warn("User $id has empty password — skipping");
            continue;
        }

        // Если пароль уже выглядит как хеш — пропускаем.
        // Проверяем префиксы, часто используемые алгоритмами:
        // bcrypt: $2y$..., $2a$..., argon2id: $argon2id$...
        if (preg_match('/^\$2y\$|^\$2a\$|^\$argon2id\$/', $pwd)) {
            // Уже хеширован
            continue;
        }

        // Иначе — хешируем и обновляем (используем выбранный алгоритм)
        $hashed = password_hash($pwd, $algo);
        if ($hashed === false || $hashed === null) {
            $errors[] = "Failed to hash password for user $id";
            Logger::error("Failed to hash password for user $id");
            continue;
        }

        try {
            $updateStmt->execute([$hashed, $id]);
            $count++;
        } catch (PDOException $e) {
            $errors[] = "Failed to update user $id: " . $e->getMessage();
            Logger::error('Failed to update user password', ['id' => $id, 'error' => $e->getMessage()]);
            continue;
        }
    }

    echo "Migration complete. Updated $count passwords.\n";
    if (!empty($errors)) {
        echo "Warnings/errors:\n" . implode("\n", $errors) . "\n";
    }
    Logger::info("Password migration completed", ['updated' => $count, 'errors' => $errors]);

} catch (PDOException $e) {
    Logger::error('Migration DB error', ['error' => $e->getMessage()]);
    echo 'DB error: ' . $e->getMessage() . PHP_EOL;
    exit(1);
}