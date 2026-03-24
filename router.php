<?php
require_once __DIR__ . '/includes/base_path.php';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = app_base_path();
if (!str_starts_with($uri, $base)) {
    $base = '';
    $path = $uri;
} else {
    $path = substr($uri, strlen($base));
}
$path = '/' . trim($path, '/');

$segments = explode('/', trim($path, '/'));

require_once __DIR__ . '/includes/db.php';

switch (true) {
    case $path === '/' || $path === '':
        require __DIR__ . '/pages/home.php';
        break;

    case $path === '/destinations':
        require __DIR__ . '/pages/destinations.php';
        break;

    case preg_match('#^/destinations/([a-z0-9-]+)$#', $path, $m) === 1:
        $GLOBALS['slug'] = $m[1];
        require __DIR__ . '/pages/destination-detail.php';
        break;

    case $path === '/boats':
        require __DIR__ . '/pages/boats.php';
        break;

    case $path === '/planner':
        require __DIR__ . '/pages/planner.php';
        break;

    case preg_match('#^/boats/([a-z0-9-]+)$#', $path, $m) === 1:
        $GLOBALS['slug'] = $m[1];
        require __DIR__ . '/pages/boat-detail.php';
        break;

    case $path === '/booking':
        require __DIR__ . '/pages/booking.php';
        break;

    case $path === '/operator/register':
        require __DIR__ . '/pages/operator/register.php';
        break;
    case $path === '/operator':
    case str_starts_with($path, '/operator'):
        require __DIR__ . '/pages/operator/dashboard.php';
        break;

    case $path === '/admin':
    case str_starts_with($path, '/admin'):
        require __DIR__ . '/pages/admin/dashboard.php';
        break;

    default:
        http_response_code(404);
        require __DIR__ . '/pages/404.php';
        break;
}
