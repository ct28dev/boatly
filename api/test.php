<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$auth_header = '';
if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    foreach (apache_request_headers() as $k => $v) {
        if (strtolower($k) === 'authorization') {
            $auth_header = $v;
            break;
        }
    }
}

echo json_encode([
    'auth_header_received' => $auth_header,
    'method' => $_SERVER['REQUEST_METHOD'],
    'php_version' => PHP_VERSION,
    'server_vars' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    ]
], JSON_PRETTY_PRINT);
