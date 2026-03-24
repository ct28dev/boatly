<?php
/**
 * Feature Flags API (Admin)
 * GET /api/feature-flags - list all
 * PUT /api/feature-flags - update (admin only)
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';
require_once __DIR__ . '/config/feature-flags.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        $flags = get_all_feature_flags($db);
        success_response($flags);
        break;
    case 'PUT':
        require_admin_or_staff($db, 'feature_flags');
        $data = get_json_body();
        $key = sanitize($data['key'] ?? '');
        $active = isset($data['is_active']) ? (bool)$data['is_active'] : null;
        if (empty($key)) error_response('key is required');
        try {
            $db->prepare("INSERT INTO feature_flags (`key`, is_active) VALUES (?, ?) ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)")
                ->execute([$key, $active !== null ? (int)$active : 0]);
            $flags = get_all_feature_flags($db);
            success_response($flags, 'Updated');
        } catch (PDOException $e) {
            error_response('Failed: ' . $e->getMessage(), 500);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}
