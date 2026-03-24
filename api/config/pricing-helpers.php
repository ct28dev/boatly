<?php
/**
 * Pricing helper functions - used by bookings and pricing API
 * Feature Toggle: อ่านจาก feature_flags ก่อน (Production)
 */

define('PRICING_SETTINGS_FILE', dirname(__DIR__, 2) . '/uploads/settings/pricing_settings.json');

function loadPricingSettings(): array {
    if (file_exists(PRICING_SETTINGS_FILE)) {
        $raw = @file_get_contents(PRICING_SETTINGS_FILE);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
    }
    return ['dynamic_pricing_enabled' => false];
}

function getActiveMultiplierForDate(PDO $db, string $date): float {
    if (file_exists(__DIR__ . '/feature-flags.php')) {
        require_once __DIR__ . '/feature-flags.php';
        if (!is_feature_active($db, 'dynamic_pricing')) return 1.0;
    } else {
        $settings = loadPricingSettings();
        if (empty($settings['dynamic_pricing_enabled'])) return 1.0;
    }
    try {
        $db->query("SELECT 1 FROM pricing_rules LIMIT 1");
    } catch (PDOException $e) {
        return 1.0;
    }
    $stmt = $db->prepare(
        "SELECT multiplier FROM pricing_rules
         WHERE is_active = 1
           AND (start_date IS NULL OR start_date <= ?)
           AND (end_date IS NULL OR end_date >= ?)
         ORDER BY multiplier DESC LIMIT 1"
    );
    $stmt->execute([$date, $date]);
    $row = $stmt->fetch();
    return $row ? (float)$row['multiplier'] : 1.0;
}
