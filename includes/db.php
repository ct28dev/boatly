<?php
require_once __DIR__ . '/base_path.php';

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=localhost;dbname=boatly;charset=utf8mb4', 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function baseUrl(string $path = ''): string {
    return app_base_path() . $path;
}

function asset(string $path): string {
    return app_base_path() . '/assets/' . ltrim($path, '/');
}

function imgUrl(string $url): string {
    if (str_starts_with($url, 'http')) return $url;
    return app_base_path() . '/' . ltrim($url, '/');
}

function e(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function formatThaiDate(string $date): string {
    $d = new DateTime($date);
    $thMonths = ['', 'ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return $d->format('j') . ' ' . $thMonths[(int)$d->format('n')] . ' ' . ($d->format('Y') + 543);
}
