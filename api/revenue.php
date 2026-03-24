<?php
/**
 * Revenue API
 * GET /api/revenue/summary
 * Types: commission, subscription, tip
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

if ($method !== 'GET' || ($action !== 'summary' && $action !== '' && $action !== '/')) {
    error_response('Invalid revenue endpoint', 404);
}

$auth = require_auth();
$is_admin = ($auth['role'] ?? '') === 'admin';
$op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
$op->execute([$auth['user_id']]);
$operator = $op->fetch();
if (!$operator && !$is_admin) {
    error_response('Partner or admin only', 403);
}

$op_id = $operator ? (int)$operator['id'] : null;

try {
    $where = $is_admin ? "" : "WHERE operator_id = ?";
    $params = $is_admin ? [] : [$op_id];
    $total = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM revenues {$where}");
    $total->execute($params);
    $sum = (float)$total->fetchColumn();

    $byType = $db->prepare("SELECT type, COALESCE(SUM(amount), 0) AS total FROM revenues {$where} GROUP BY type");
    $byType->execute($params);
    $breakdown = [];
    while ($r = $byType->fetch()) $breakdown[$r['type']] = (float)$r['total'];

    success_response([
        'total' => $sum,
        'by_type' => $breakdown,
        'currency' => 'THB'
    ]);
} catch (PDOException $e) {
    error_response('Failed to fetch revenue: ' . $e->getMessage(), 500);
}
