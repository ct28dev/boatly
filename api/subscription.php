<?php
/**
 * Subscription API
 * POST /api/subscription/upgrade
 * GET /api/subscription/status
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'status' || $action === '' || $action === '/') {
            handleGetStatus($db);
        } else {
            error_response('Invalid subscription endpoint', 404);
        }
        break;
    case 'POST':
        if ($action === 'upgrade') {
            handleUpgrade($db);
        } else {
            error_response('Invalid subscription endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleGetStatus(PDO $db): void {
    $auth = require_auth();
    $op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
    $op->execute([$auth['user_id']]);
    $operator = $op->fetch();
    if (!$operator) {
        success_response(['plan' => 'free', 'status' => 'inactive', 'message' => 'Not a partner']);
        return;
    }
    $pid = (int)$operator['id'];
    $stmt = $db->prepare("SELECT plan, status, start_date, end_date FROM subscriptions WHERE partner_id = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$pid]);
    $row = $stmt->fetch();
    if (!$row) {
        success_response(['plan' => 'free', 'status' => 'active', 'start_date' => null, 'end_date' => null]);
        return;
    }
    success_response([
        'plan' => $row['plan'],
        'status' => $row['status'],
        'start_date' => $row['start_date'],
        'end_date' => $row['end_date']
    ]);
}

function handleUpgrade(PDO $db): void {
    $auth = require_auth();
    $op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
    $op->execute([$auth['user_id']]);
    $operator = $op->fetch();
    if (!$operator) error_response('Partner not found', 403);

    $data = get_json_body();
    $plan = sanitize($data['plan'] ?? 'pro');
    $allowed = ['free', 'pro', 'premium', 'enterprise'];
    if (!in_array($plan, $allowed)) $plan = 'pro';

    $pid = (int)$operator['id'];
    $start = date('Y-m-d');
    $end = date('Y-m-d', strtotime('+1 month'));

    try {
        $db->prepare("INSERT INTO subscriptions (partner_id, plan, status, start_date, end_date) VALUES (?, ?, 'active', ?, ?)")
            ->execute([$pid, $plan, $start, $end]);
        success_response(['plan' => $plan, 'status' => 'active', 'start_date' => $start, 'end_date' => $end], 'Upgraded');
    } catch (PDOException $e) {
        error_response('Failed to upgrade: ' . $e->getMessage(), 500);
    }
}
