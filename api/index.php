<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization, X-Requested-With, X-HTTP-Method-Override');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
require_once __DIR__ . '/migrations/production_tables.php';

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = '/' . trim($path, '/');
if (($pos = strpos($path, '/api/')) !== false) {
    $path = substr($path, $pos + 5);
} elseif (preg_match('#^/(boatly|boathub)/api(.*)$#', $path, $m)) {
    $path = $m[2] ?: '/';
}
$path = '/' . trim($path, '/');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && !empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $override = strtoupper(trim($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']));
    if (in_array($override, ['PUT', 'DELETE', 'PATCH'])) $method = $override;
}

$route_segments = explode('/', trim($path, '/'));
$handler = $route_segments[0] ?? '';

$sub_path = '/' . implode('/', array_slice($route_segments, 1));
if ($sub_path === '/') $sub_path = '';

$GLOBALS['sub_path'] = $sub_path;
$GLOBALS['method'] = $method;
$GLOBALS['route_segments'] = array_slice($route_segments, 1);

$handlers = [
    'auth'       => 'auth.php',
    'tours'      => 'tours.php',
    'destinations'=> 'destinations.php',
    'bookings'   => 'bookings.php',
    'payments'   => 'payments.php',
    'reviews'    => 'reviews.php',
    'users'      => 'users.php',
    'admin'      => 'admin.php',
    'promotions' => 'promotions.php',
    'addons'     => 'addons.php',
    'operator'   => 'operator.php',
    'settings'   => 'settings.php',
    'piers'      => 'piers.php',
    'favorites'  => 'favorites.php',
    'itineraries'=> 'itineraries.php',
    'cms'        => 'cms.php',
    'geocode'    => 'geocode.php',
    'upload'     => 'upload.php',
    'test'       => 'test.php',
    'tip'        => 'tip.php',
    'pricing'    => 'pricing.php',
    'ai'         => 'ai.php',
    'match'      => 'match.php',
    'subscription'=> 'subscription.php',
    'revenue'    => 'revenue.php',
    'feature-flags' => 'feature-flags.php',
];

if (isset($handlers[$handler])) {
    $handler_file = __DIR__ . '/' . $handlers[$handler];
    if (file_exists($handler_file)) {
        require_once $handler_file;
    } else {
        error_response('Handler not found', 500);
    }
} else {
    json_response([
        'success' => true,
        'message' => 'BOATLY API v1.0',
        'endpoints' => array_keys($handlers)
    ]);
}
