<?php
/**
 * Pricing API
 * GET /pricing/rules - active pricing rules (public)
 * GET /pricing/settings - pricing settings (admin)
 * PUT /pricing/settings - update settings (admin)
 */

require_once __DIR__ . '/config/pricing-helpers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/feature-flags.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'rules' || $action === '' || $action === '/') {
            handleGetActiveRules($db);
        } elseif ($action === 'settings') {
            handleGetSettings($db);
        } else {
            error_response('Invalid pricing endpoint', 404);
        }
        break;

    case 'PUT':
        if ($action === 'settings') {
            handlePutSettings($db);
        } else {
            error_response('Invalid pricing endpoint', 404);
        }
        break;

    default:
        error_response('Method not allowed', 405);
}

function handleGetActiveRules(PDO $db): void {
    try {
        $db->query("SELECT 1 FROM pricing_rules LIMIT 1");
    } catch (PDOException $e) {
        success_response([]);
        return;
    }
    $stmt = $db->prepare(
        "SELECT id, name, multiplier, start_date, end_date, is_active, created_at
         FROM pricing_rules
         WHERE is_active = 1
           AND (start_date IS NULL OR start_date <= CURDATE())
           AND (end_date IS NULL OR end_date >= CURDATE())
         ORDER BY created_at ASC"
    );
    $stmt->execute();
    success_response($stmt->fetchAll());
}

function loadPricingSettings(): array {
    if (file_exists(PRICING_SETTINGS_FILE)) {
        $raw = @file_get_contents(PRICING_SETTINGS_FILE);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data)) {
                return $data;
            }
        }
    }
    return ['dynamic_pricing_enabled' => false];
}

function savePricingSettings(array $data): bool {
    $dir = dirname(PRICING_SETTINGS_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return file_put_contents(PRICING_SETTINGS_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
}

function handleGetSettings(PDO $db): void {
    $settings = loadPricingSettings();
    try {
        if (is_feature_active($db, 'dynamic_pricing')) {
            $settings['dynamic_pricing_enabled'] = true;
        } else {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'dynamic_pricing_enabled'");
            $stmt->execute();
            $row = $stmt->fetch();
            if ($row && $row['setting_value']) {
                $dbVal = json_decode($row['setting_value'], true);
                if (is_array($dbVal) && isset($dbVal['enabled'])) {
                    $settings['dynamic_pricing_enabled'] = $dbVal['enabled'];
                }
            }
        }
    } catch (PDOException $e) {}
    success_response($settings);
}

function handlePutSettings(PDO $db): void {
    require_admin_or_staff($db, 'pricing');
    $data = get_json_body();
    if (empty($data)) {
        error_response('No data provided');
    }
    $current = loadPricingSettings();
    foreach (['dynamic_pricing_enabled', 'default_multiplier'] as $key) {
        if (array_key_exists($key, $data)) {
            $current[$key] = $key === 'dynamic_pricing_enabled' ? (bool)$data[$key] : (float)($data[$key] ?? 1.0);
        }
    }
    savePricingSettings($current);
    try {
        $json = json_encode(['enabled' => $current['dynamic_pricing_enabled'] ?? false]);
        $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('dynamic_pricing_enabled', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([$json]);
        $db->prepare("INSERT INTO feature_flags (`key`, is_active) VALUES ('dynamic_pricing', ?) ON DUPLICATE KEY UPDATE is_active = VALUES(is_active)")->execute([(int)($current['dynamic_pricing_enabled'] ?? false)]);
    } catch (PDOException $e) {}
    success_response($current, 'Settings updated');
}
