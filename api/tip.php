<?php
/**
 * Tip System API
 * - settings: GET/PUT tip_system_enabled (admin)
 * - enabled: GET check if tip system is enabled (public)
 * - qr: GET generate PromptPay QR payload for tip (booking_id, amount, operator promptpay)
 * - operator-qr: PUT partner set their tip PromptPay ID
 */

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'enabled' || $action === 'settings') {
            handleGetTipSettings($db);
        } elseif ($action === 'qr') {
            handleGetTipQr($db);
        } elseif ($action === 'operator-qr') {
            handleGetOperatorTipQr($db);
        } elseif ($action === 'report') {
            handleGetTipReport($db);
        } else {
            error_response('Invalid tip endpoint', 404);
        }
        break;
    case 'PUT':
        if ($action === 'settings') {
            handlePutTipSettings($db);
        } elseif ($action === 'operator-qr') {
            handlePutOperatorTipQr($db);
        } else {
            error_response('Invalid tip endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

define('TIP_SETTINGS_FILE', dirname(__DIR__) . '/uploads/settings/tip_settings.json');

function loadTipSettings(): array {
    if (file_exists(TIP_SETTINGS_FILE)) {
        $raw = @file_get_contents(TIP_SETTINGS_FILE);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
    }
    try {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'tip_system'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && $row['setting_value']) {
            $data = json_decode($row['setting_value'], true);
            return is_array($data) ? $data : ['enabled' => false];
        }
    } catch (PDOException $e) {}
    return ['enabled' => false];
}

function saveTipSettings(array $data): bool {
    $dir = dirname(TIP_SETTINGS_FILE);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $ok = file_put_contents(TIP_SETTINGS_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
    if ($ok) {
        try {
            $db = Database::getInstance()->getConnection();
            $json = json_encode($data, JSON_UNESCAPED_UNICODE);
            $check = $db->prepare("SELECT 1 FROM settings WHERE setting_key = 'tip_system'");
            $check->execute();
            if ($check->fetch()) {
                $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'tip_system'")->execute([$json]);
            } else {
                $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('tip_system', ?)")->execute([$json]);
            }
        } catch (PDOException $e) {}
    }
    return $ok;
}

function handleGetTipSettings(PDO $db): void {
    $settings = loadTipSettings();
    success_response([
        'enabled' => !empty($settings['enabled']),
        'show_after_review' => $settings['show_after_review'] ?? true,
        'min_rating_for_tip' => (int)($settings['min_rating_for_tip'] ?? 4)
    ]);
}

function handlePutTipSettings(PDO $db): void {
    require_admin_or_staff($db, 'settings');
    $data = get_json_body();
    $current = loadTipSettings();
    $current['enabled'] = isset($data['enabled']) ? (bool)$data['enabled'] : ($current['enabled'] ?? false);
    $current['show_after_review'] = isset($data['show_after_review']) ? (bool)$data['show_after_review'] : ($current['show_after_review'] ?? true);
    $current['min_rating_for_tip'] = isset($data['min_rating_for_tip']) ? max(1, min(5, (int)$data['min_rating_for_tip'])) : ($current['min_rating_for_tip'] ?? 4);
    if (saveTipSettings($current)) {
        success_response($current, 'Tip settings updated');
    } else {
        error_response('Failed to save tip settings', 500);
    }
}

function ensureOperatorTipPromptPay(PDO $db): void {
    try {
        $db->query("SELECT tip_promptpay_phone FROM operators LIMIT 1");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'tip_promptpay') !== false) {
            try {
                $db->exec("ALTER TABLE operators ADD COLUMN tip_promptpay_phone VARCHAR(20) NULL");
            } catch (PDOException $e2) {}
        }
    }
}

function handleGetOperatorTipQr(PDO $db): void {
    $auth = require_auth();
    ensureOperatorTipPromptPay($db);

    $op = $db->prepare("SELECT id, tip_promptpay_phone FROM operators WHERE user_id = ?");
    $op->execute([$auth['user_id']]);
    $operator = $op->fetch();
    if (!$operator) error_response('Operator not found', 403);

    $phone = $operator['tip_promptpay_phone'] ?? '';
    success_response(['promptpay_phone' => $phone]);
}

function handlePutOperatorTipQr(PDO $db): void {
    $auth = require_auth();
    ensureOperatorTipPromptPay($db);

    $op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
    $op->execute([$auth['user_id']]);
    $operator = $op->fetch();
    if (!$operator) error_response('Operator not found', 403);

    $data = get_json_body();
    $phone = preg_replace('/[^0-9]/', '', sanitize($data['promptpay_phone'] ?? $data['phone'] ?? ''));
    if (strlen($phone) < 10) {
        error_response('กรุณาระบุเบอร์ PromptPay ที่ถูกต้อง (10-13 หลัก)');
    }
    if (strlen($phone) === 10 && $phone[0] === '0') {
        $phone = '66' . substr($phone, 1);
    } elseif (strlen($phone) === 9) {
        $phone = '66' . $phone;
    }

    $db->prepare("UPDATE operators SET tip_promptpay_phone = ? WHERE id = ?")->execute([$phone, $operator['id']]);
    success_response(['promptpay_phone' => $phone], 'Tip QR setting saved');
}

function generatePromptPayPayload(string $ppId, float $amount): string {
    $tlv = function ($id, $val) {
        return $id . str_pad(strlen($val), 2, '0', STR_PAD_LEFT) . $val;
    };
    $payload = '';
    $payload .= $tlv('00', '01');
    $payload .= $tlv('01', '12');
    $merchant = $tlv('00', 'A000000677010111');
    if (strlen($ppId) >= 13) {
        $merchant .= $tlv('01', '00' . preg_replace('/[^0-9]/', '', $ppId));
    } else {
        $phone = preg_replace('/^0/', '66', preg_replace('/[^0-9]/', '', $ppId));
        $merchant .= $tlv('01', '00' . $phone);
    }
    $payload .= $tlv('29', $merchant);
    $payload .= $tlv('53', '764');
    if ($amount > 0) {
        $payload .= $tlv('54', number_format($amount, 2, '.', ''));
    }
    $payload .= $tlv('58', 'TH');
    $payload .= $tlv('62', $tlv('05', 'TIP'));
    $payload .= '6304';
    $payload .= crc16($payload);
    return $payload;
}

function crc16(string $str): string {
    $crc = 0xFFFF;
    $len = strlen($str);
    for ($i = 0; $i < $len; $i++) {
        $crc ^= ord($str[$i]) << 8;
        for ($j = 0; $j < 8; $j++) {
            if ($crc & 0x8000) {
                $crc = ($crc << 1) ^ 0x1021;
            } else {
                $crc <<= 1;
            }
            $crc &= 0xFFFF;
        }
    }
    return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
}

function handleGetTipQr(PDO $db): void {
    $auth = require_auth();
    $settings = loadTipSettings();
    if (empty($settings['enabled'])) {
        error_response('ระบบทิปปิดใช้งานอยู่', 403);
    }

    $booking_id = (int)(get_param('booking_id') ?? 0);
    $amount = (float)(get_param('amount') ?? 0);

    if (!$booking_id || $amount <= 0) {
        error_response('booking_id และ amount จำเป็น');
    }

    $stmt = $db->prepare(
        "SELECT bk.*, bt.operator_id, o.tip_promptpay_phone, o.company_name
         FROM bookings bk
         JOIN boats bt ON bk.boat_id = bt.id
         JOIN operators o ON bt.operator_id = o.id
         WHERE bk.id = ? AND bk.user_id = ?"
    );
    $stmt->execute([$booking_id, $auth['user_id']]);
    $b = $stmt->fetch();
    if (!$b) error_response('ไม่พบการจอง', 404);
    if (!in_array($b['status'], ['confirmed', 'completed'])) {
        error_response('สามารถให้ทิปได้หลังการจองเสร็จสิ้นเท่านั้น');
    }

    $ppPhone = trim($b['tip_promptpay_phone'] ?? '');
    if (empty($ppPhone)) {
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'payment_methods'");
        $stmt->execute();
        $row = $stmt->fetch();
        $pm = $row ? json_decode($row['setting_value'], true) : null;
        $ppPhone = $pm['qr']['promptpay_id'] ?? '';
    }
    if (empty($ppPhone)) {
        error_response('พาร์ทเนอร์ยังไม่ได้ตั้งค่าเบอร์ PromptPay สำหรับรับทิป กรุณาติดต่อผู้ให้บริการ');
    }

    $ppPhone = preg_replace('/[^0-9]/', '', $ppPhone);
    if (strlen($ppPhone) === 10 && $ppPhone[0] === '0') {
        $ppPhone = '66' . substr($ppPhone, 1);
    }

    $payload = generatePromptPayPayload($ppPhone, $amount);
    $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' . urlencode($payload);

    success_response([
        'payload' => $payload,
        'qr_url' => $qrUrl,
        'amount' => $amount,
        'account_name' => $b['company_name'] ?? 'BOATLY'
    ]);
}

function handleGetTipReport(PDO $db): void {
    $auth = require_auth();
    $op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
    $op->execute([$auth['user_id']]);
    $operator = $op->fetch();
    if (!$operator) error_response('Operator not found', 403);

    $op_id = (int)$operator['id'];

    $today = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM booking_tips WHERE operator_id = ? AND DATE(created_at) = CURDATE()");
    $today->execute([$op_id]);
    $today_total = (float)$today->fetchColumn();

    $topBoat = $db->prepare(
        "SELECT bt.id, bt.name, SUM(t.amount) AS total
         FROM booking_tips t
         JOIN boats bt ON t.boat_id = bt.id
         WHERE t.operator_id = ?
         GROUP BY t.boat_id
         ORDER BY total DESC
         LIMIT 1"
    );
    $topBoat->execute([$op_id]);
    $top = $topBoat->fetch();

    $chart = $db->prepare(
        "SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0) AS total
         FROM booking_tips
         WHERE operator_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC"
    );
    $chart->execute([$op_id]);
    $daily = $chart->fetchAll();

    success_response([
        'today_total' => $today_total,
        'top_boat' => $top ? ['id' => (int)$top['id'], 'name' => $top['name'], 'total' => (float)$top['total']] : null,
        'daily_chart' => array_map(function ($r) {
            return ['date' => $r['date'], 'total' => (float)$r['total']];
        }, $daily)
    ]);
}
