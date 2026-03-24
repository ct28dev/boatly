<?php

/** Payment settings file - persists across database resets (in uploads/settings/ - same as QR images) */
define('PAYMENT_SETTINGS_FILE', dirname(__DIR__) . '/uploads/settings/payment_settings.json');

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'payment-methods') {
            handleGetPaymentMethods($db);
        } elseif ($action === 'ai-interests') {
            handleGetAiInterests($db);
        } elseif ($action === '' || $action === '/') {
            handleGetSettings($db);
        } else {
            error_response('Invalid settings endpoint', 404);
        }
        break;
    case 'PUT':
        if ($action === 'payment-methods') {
            handleUpdatePaymentMethods($db);
        } elseif ($action === 'ai-interests') {
            handleUpdateAiInterests($db);
        } else {
            error_response('Invalid settings endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

/** ค่าเริ่มต้นหัวข้อความสนใจ (ฟอร์ม AI แนะนำทริป) */
function getDefaultAiInterestTopics(): array {
    return ['วัด', 'ชิล', 'ดำน้ำ', 'อาหาร', 'ธรรมชาติ'];
}

function loadAiInterestTopics(PDO $db): array {
    try {
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'ai_interest_topics'");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['setting_value'] !== '' && $row['setting_value'] !== null) {
            $arr = json_decode($row['setting_value'], true);
            if (is_array($arr)) {
                $out = [];
                foreach ($arr as $t) {
                    if (!is_string($t)) {
                        continue;
                    }
                    $s = trim($t);
                    if ($s === '') {
                        continue;
                    }
                    if (function_exists('mb_substr')) {
                        $s = mb_substr($s, 0, 40);
                    } else {
                        $s = substr($s, 0, 40);
                    }
                    $out[] = $s;
                }
                $out = array_values(array_unique($out));
                if (count($out) > 0) {
                    return $out;
                }
            }
        }
    } catch (PDOException $e) {
        // fall through
    }
    return getDefaultAiInterestTopics();
}

function saveAiInterestTopicsToDb(PDO $db, array $topics): void {
    $json = json_encode(array_values($topics), JSON_UNESCAPED_UNICODE);
    $check = $db->prepare("SELECT 1 FROM settings WHERE setting_key = 'ai_interest_topics'");
    $check->execute();
    if ($check->fetch()) {
        $u = $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'ai_interest_topics'");
        $u->execute([$json]);
    } else {
        $i = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('ai_interest_topics', ?)");
        $i->execute([$json]);
    }
}

/** GET — เปิดเผยสาธารณะ (ลูกค้าโหลดฟอร์ม AI) */
function handleGetAiInterests(PDO $db): void {
    $topics = loadAiInterestTopics($db);
    success_response(['topics' => $topics]);
}

/** PUT — แอดมิน/สตาฟที่มีสิทธิ์ settings */
function handleUpdateAiInterests(PDO $db): void {
    require_admin_or_staff($db, 'settings');
    $data = get_json_body();
    $topics = $data['topics'] ?? null;
    if (!is_array($topics)) {
        error_response('ต้องส่ง topics เป็น array');
    }
    $normalized = [];
    foreach ($topics as $t) {
        if (!is_string($t)) {
            continue;
        }
        $s = trim($t);
        if ($s === '') {
            continue;
        }
        if (function_exists('mb_strlen') && mb_strlen($s) > 40) {
            $s = mb_substr($s, 0, 40);
        } elseif (strlen($s) > 40) {
            $s = substr($s, 0, 40);
        }
        $normalized[] = $s;
    }
    $normalized = array_values(array_unique($normalized));
    if (count($normalized) > 40) {
        $normalized = array_slice($normalized, 0, 40);
    }
    if (count($normalized) < 1) {
        error_response('ต้องมีอย่างน้อย 1 หัวข้อ');
    }
    saveAiInterestTopicsToDb($db, $normalized);
    success_response(['topics' => $normalized], 'บันทึกหัวข้อความสนใจแล้ว');
}

function getDefaultPaymentMethods(): array {
    return [
        'qr' => ['enabled' => true, 'label_th' => 'QR Payment / PromptPay', 'label_en' => 'QR Payment / PromptPay', 'promptpay_id' => ''],
        'cod' => ['enabled' => false, 'label_th' => 'จ่ายที่ท่าเรือ', 'label_en' => 'Pay at Pier'],
        'card' => ['enabled' => false, 'label_th' => 'บัตรเครดิต/เดบิต', 'label_en' => 'Credit/Debit Card'],
    ];
}

function loadPaymentMethodsFromFile(): ?array {
    if (!file_exists(PAYMENT_SETTINGS_FILE)) return null;
    $raw = @file_get_contents(PAYMENT_SETTINGS_FILE);
    if ($raw === false || $raw === '') return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function savePaymentMethodsToFile(array $methods): bool {
    $dir = dirname(PAYMENT_SETTINGS_FILE);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return file_put_contents(PAYMENT_SETTINGS_FILE, json_encode($methods, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
}

function handleGetPaymentMethods(PDO $db): void {
    $methods = loadPaymentMethodsFromFile();
    if ($methods === null) {
        try {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'payment_methods'");
            $stmt->execute();
            $row = $stmt->fetch();
            $methods = $row ? json_decode($row['setting_value'], true) : null;
        } catch (PDOException $e) {
            $methods = null;
        }
    }
    if (!$methods || !is_array($methods)) {
        $methods = getDefaultPaymentMethods();
    }
    success_response($methods);
}

function handleUpdatePaymentMethods(PDO $db): void {
    require_admin_or_staff($db, 'settings');
    $data = get_json_body();

    if (empty($data)) {
        error_response('No data provided');
    }

    $current = loadPaymentMethodsFromFile();
    if ($current === null) {
        try {
            $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'payment_methods'");
            $stmt->execute();
            $row = $stmt->fetch();
            $current = $row ? json_decode($row['setting_value'], true) : [];
        } catch (PDOException $e) {
            $current = [];
        }
    }

    // If QR has a base64 custom_qr_url, save as file instead of storing in DB
    if (isset($data['qr']['custom_qr_url']) && strpos($data['qr']['custom_qr_url'], 'data:image') === 0) {
        $base64 = $data['qr']['custom_qr_url'];
        $filePath = saveBase64Image($base64, 'qr_custom');
        if ($filePath) {
            $data['qr']['custom_qr_url'] = $filePath;
        }
    }

    foreach ($data as $key => $val) {
        if (isset($current[$key]) && is_array($val)) {
            $current[$key] = array_merge($current[$key], $val);
        } else {
            $current[$key] = $val;
        }
    }

    // Save to file first - persists across database resets
    savePaymentMethodsToFile($current);

    $json = json_encode($current, JSON_UNESCAPED_UNICODE);

    try {
        $check = $db->prepare("SELECT 1 FROM settings WHERE setting_key = 'payment_methods'");
        $check->execute();
        $exists = $check->fetch();
        if ($exists) {
            $upd = $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'payment_methods'");
            $upd->execute([$json]);
        } else {
            $ins = $db->prepare("INSERT INTO settings (setting_value, setting_key) VALUES (?, 'payment_methods')");
            $ins->execute([$json]);
        }
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), '1406') !== false || strpos($e->getMessage(), 'Data too long') !== false) {
            try {
                $db->exec("ALTER TABLE settings MODIFY COLUMN setting_value LONGTEXT");
                $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('payment_methods', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
                if ($stmt) $stmt->execute([$json]);
            } catch (PDOException $e2) {
                // Ignore - file already saved, persists across DB reset
            }
        }
    }

    success_response($current, 'Payment methods updated');
}

function saveBase64Image(string $base64, string $prefix): ?string {
    if (!preg_match('/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/i', $base64, $m)) {
        return null;
    }
    $ext = strtolower($m[1]) === 'jpeg' ? 'jpg' : strtolower($m[1]);
    $decoded = base64_decode($m[2]);
    if ($decoded === false) return null;

    $uploadDir = dirname(__DIR__) . '/uploads/settings/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = $prefix . '_' . time() . '.' . $ext;
    $fullPath = $uploadDir . $filename;

    if (file_put_contents($fullPath, $decoded) === false) {
        return null;
    }

    return 'uploads/settings/' . $filename;
}

function handleGetSettings(PDO $db): void {
    try {
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll();
        $result = [];
        foreach ($rows as $row) {
            $val = json_decode($row['setting_value'], true);
            $result[$row['setting_key']] = $val !== null ? $val : $row['setting_value'];
        }
        success_response($result);
    } catch (PDOException $e) {
        success_response([]);
    }
}
