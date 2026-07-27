<?php
declare(strict_types=1);

function env_value(string $key, ?string $default = null): ?string {
    static $values;
    if ($values === null) {
        $values = [];
        $path = dirname(__DIR__) . '/.env';
        if (is_file($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
                [$name, $value] = array_map('trim', explode('=', $line, 2));
                $values[$name] = trim($value, "\"'");
            }
        }
    }
    return $_ENV[$key] ?? getenv($key) ?: $values[$key] ?? $default;
}

ini_set('display_errors', env_value('APP_ENV', 'production') === 'local' ? '1' : '0');
session_name('monimala_admin');
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'httponly' => true,
    'secure' => env_value('SESSION_SECURE', 'true') === 'true', 'samesite' => 'Strict'
]);
session_start();

function db(): PDO {
    static $pdo;
    if (!$pdo) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', env_value('DB_HOST'), env_value('DB_PORT', '3306'), env_value('DB_DATABASE'));
        $pdo = new PDO($dsn, env_value('DB_USERNAME'), env_value('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    }
    return $pdo;
}

function e(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function csrf_token(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(32)); }
function verify_csrf(): void { if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['_token'] ?? '')) { http_response_code(419); exit('Session expired.'); } }
function admin(): ?array { return $_SESSION['admin'] ?? null; }
function base_path(): string { return rtrim(env_value('APP_BASE_PATH', '') ?: '', '/'); }
function url(string $path = '/'): string { return base_path() . ($path === '/' ? '/dashboard' : '/' . ltrim($path, '/')); }
function require_admin(): void { if (!admin()) { header('Location: ' . url('/login')); exit; } }
function redirect(string $path): never { header('Location: ' . url($path)); exit; }

if (base_path()) {
    ob_start(fn(string $html): string => str_replace(
        ['href="/', 'action="/'],
        ['href="' . base_path() . '/', 'action="' . base_path() . '/'],
        $html
    ));
}
