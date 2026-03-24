<?php

require_once __DIR__ . '/../../includes/base_path.php';

define('JWT_SECRET', 'boathub_secret_key_2026_!@#$%');
define('TOKEN_EXPIRY', 86400 * 7); // 7 days
define('PAYMENT_WEBHOOK_SECRET', getenv('PAYMENT_WEBHOOK_SECRET') ?: '');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', app_base_path() . '/api/uploads/');
define('DEFAULT_PAGE', 1);
define('DEFAULT_LIMIT', 20);

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function success_response($data = null, string $message = 'Success', int $status = 200): void {
    json_response([
        'success' => true,
        'data' => $data,
        'message' => $message
    ], $status);
}

function error_response(string $message, int $status = 400): void {
    json_response([
        'success' => false,
        'data' => null,
        'message' => $message
    ], $status);
}

function generate_token(int $user_id, string $role): string {
    $payload = json_encode([
        'user_id' => $user_id,
        'role' => $role,
        'exp' => time() + TOKEN_EXPIRY,
        'iat' => time()
    ]);
    $signature = hash_hmac('sha256', $payload, JWT_SECRET);
    return base64_encode($payload . '.' . $signature);
}

function verify_token(string $token): ?array {
    try {
        $decoded = base64_decode($token);
        if ($decoded === false) return null;

        $parts = explode('.', $decoded, 2);
        if (count($parts) !== 2) return null;

        [$payload, $signature] = $parts;
        $expected_signature = hash_hmac('sha256', $payload, JWT_SECRET);

        if (!hash_equals($expected_signature, $signature)) return null;

        $data = json_decode($payload, true);
        if (!$data) return null;

        if (isset($data['exp']) && $data['exp'] < time()) return null;

        return $data;
    } catch (\Exception $e) {
        return null;
    }
}

/** ดึง Authorization จากหลายรูปแบบ (Apache / CGI / reverse proxy) — รองรับ X-Authorization ถูกส่งแทนเมื่อ multipart ถูกตัด Bearer */
function get_authorization_header_value(): string {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return (string)$_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return (string)$_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['Authorization'])) {
        return (string)$_SERVER['Authorization'];
    }
    if (!empty($_SERVER['REDIRECT_REDIRECT_HTTP_AUTHORIZATION'])) {
        return (string)$_SERVER['REDIRECT_REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
        return (string)$_SERVER['HTTP_X_AUTHORIZATION'];
    }
    if (function_exists('apache_request_headers')) {
        $all = apache_request_headers();
        foreach ($all as $k => $v) {
            if (strtolower($k) === 'authorization') {
                return (string)$v;
            }
        }
        foreach ($all as $k => $v) {
            if (strtolower($k) === 'x-authorization') {
                return (string)$v;
            }
        }
    }
    return '';
}

function get_auth_user(): ?array {
    $header = get_authorization_header_value();
    if (!preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    return verify_token($matches[1]);
}

function require_auth(): array {
    $user = get_auth_user();
    if (!$user) {
        error_response('Unauthorized. Please login.', 401);
    }
    return $user;
}

function require_role(string $role): array {
    $user = require_auth();
    if ($user['role'] !== $role && $user['role'] !== 'admin') {
        error_response('Forbidden. Insufficient permissions.', 403);
    }
    return $user;
}

function require_admin_or_staff(PDO $db, ?string $module = null): array {
    $user = require_auth();
    if ($user['role'] === 'admin') return $user;
    if ($user['role'] !== 'staff') {
        error_response('Forbidden. Admin or staff role required.', 403);
    }
    if ($module !== null) {
        try {
            $stmt = $db->prepare("SELECT 1 FROM admin_permissions WHERE user_id = ? AND (module = ? OR module = '*')");
            $stmt->execute([$user['user_id'], $module]);
            if (!$stmt->fetch()) {
                error_response('Forbidden. No permission for this module.', 403);
            }
        } catch (PDOException $e) {
            error_response('Forbidden.', 403);
        }
    }
    return $user;
}

function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function get_json_body(): array {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    return is_array($data) ? $data : [];
}

function get_param(string $key, $default = null) {
    return $_GET[$key] ?? $default;
}

/** Check if tip system is enabled (from settings file or DB) */
function is_tip_system_enabled(): bool {
    $file = dirname(__DIR__) . '/uploads/settings/tip_settings.json';
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data) && !empty($data['enabled'])) return true;
            if (is_array($data) && isset($data['enabled']) && !$data['enabled']) return false;
        }
    }
    try {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'tip_system'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && $row['setting_value']) {
            $data = json_decode($row['setting_value'], true);
            return is_array($data) && !empty($data['enabled']);
        }
    } catch (PDOException $e) {}
    return false;
}

function get_page(): int {
    return max(1, (int)(get_param('page', DEFAULT_PAGE)));
}

function get_limit(): int {
    $limit = (int)(get_param('limit', DEFAULT_LIMIT));
    return min(max(1, $limit), 100);
}

function paginate_query(string $query, int $page, int $limit): string {
    $offset = ($page - 1) * $limit;
    return $query . " LIMIT {$limit} OFFSET {$offset}";
}

function get_total_count(PDO $db, string $table, string $where = '1=1', array $params = []): int {
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM {$table} WHERE {$where}");
    $stmt->execute($params);
    return (int)$stmt->fetch()['total'];
}

function pagination_meta(int $total, int $page, int $limit): array {
    return [
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => (int)ceil($total / $limit)
    ];
}

/**
 * แปลง MIME รูปแบบที่เจอบ่อยให้ตรงมาตรฐาน (เช่น image/jpg → image/jpeg)
 */
function normalize_image_mime(string $mime): string {
    $m = strtolower(trim($mime));
    if ($m === 'image/jpg' || $m === 'image/pjpeg' || $m === 'image/x-citrix-jpeg') {
        return 'image/jpeg';
    }
    if ($m === 'image/x-png') {
        return 'image/png';
    }
    return $m;
}

/** แปลงค่าเช่น 40M, 512K จาก php.ini เป็นจำนวนไบต์ */
function ini_parse_bytes(string $ini): int {
    $ini = trim($ini);
    if ($ini === '') {
        return 0;
    }
    if (preg_match('/^([0-9.]+)\s*([gmk]?)$/i', $ini, $m)) {
        $n = (float) $m[1];
        $u = strtolower($m[2] ?? '');
        if ($u === 'g') {
            return (int) round($n * 1024 * 1024 * 1024);
        }
        if ($u === 'm') {
            return (int) round($n * 1024 * 1024);
        }
        if ($u === 'k') {
            return (int) round($n * 1024);
        }
        return (int) round($n);
    }
    return (int) $ini;
}

/**
 * ตรวจ MIME จริงของไฟล์ที่อัปโหลด (แก้กรณีเบราว์เซอร์ส่ง type ผิดหรือ application/octet-stream)
 */
/** ข้อความภาษาไทยตามรหัส error ของ PHP upload */
function upload_client_error_message(int $code): string {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return 'ไฟล์ใหญ่เกินขีดจำกัด upload_max_filesize ของ PHP (มักเป็น 2MB ค่าเริ่มต้น) — ลองย่อรูป หรือแก้ php.ini ให้ upload_max_filesize และ post_max_size อย่างน้อย 8M';
        case UPLOAD_ERR_FORM_SIZE:
            return 'ไฟล์ใหญ่เกินที่ฟอร์มกำหนด';
        case UPLOAD_ERR_PARTIAL:
            return 'อัปโหลดไม่สมบูรณ์ ลองใหม่อีกครั้ง';
        case UPLOAD_ERR_NO_FILE:
            return 'ไม่ได้เลือกไฟล์';
        case UPLOAD_ERR_NO_TMP_DIR:
        case UPLOAD_ERR_CANT_WRITE:
        case UPLOAD_ERR_EXTENSION:
            return 'เซิร์ฟเวอร์ไม่สามารถบันทึกไฟล์ชั่วคราวได้';
        default:
            return 'อัปโหลดไม่สำเร็จ (รหัส ' . $code . ')';
    }
}

/**
 * ตรวจชนิดรูปจาก magic bytes (แก้กรณีไม่มีนามสกุล + finfo ได้ application/octet-stream)
 */
function detect_image_mime_from_bytes(string $path): ?string {
    $h = @file_get_contents($path, false, null, 0, 32);
    if ($h === false || strlen($h) < 2) {
        return null;
    }
    // JPEG: SOI คือ FF D8 เท่านั้น (ไม่บังคับไบต์ที่ 3 เป็น FF)
    if ($h[0] === "\xFF" && $h[1] === "\xD8") {
        return 'image/jpeg';
    }
    // PNG: 4 ไบต์แรกคงที่ (บางไฟล์ไม่ตรง 8 ไบต์ถัดไปจาก spec เต็ม)
    if (strlen($h) >= 4 && substr($h, 0, 4) === "\x89PNG") {
        return 'image/png';
    }
    if (strlen($h) >= 6 && (substr($h, 0, 6) === 'GIF87a' || substr($h, 0, 6) === 'GIF89a')) {
        return 'image/gif';
    }
    if (strlen($h) >= 12 && substr($h, 0, 4) === 'RIFF' && substr($h, 8, 4) === 'WEBP') {
        return 'image/webp';
    }
    // AVIF / HEIF (ISO BMFF): ใช้แยกข้อความ error ใน upload handler
    if (strlen($h) >= 12 && substr($h, 4, 4) === 'ftyp') {
        $brand = substr($h, 8, 4);
        if ($brand === 'avif' || $brand === 'avis') {
            return 'image/avif';
        }
        if (in_array($brand, ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'], true)) {
            return 'image/heic';
        }
    }
    return null;
}

function resolve_uploaded_image_mime(array $file): string {
    if (!empty($file['tmp_name']) && is_readable($file['tmp_name'])) {
        $fromBytes = detect_image_mime_from_bytes($file['tmp_name']);
        if ($fromBytes !== null) {
            return normalize_image_mime($fromBytes);
        }
    }

    $t = strtolower(trim($file['type'] ?? ''));
    if ($t !== '' && $t !== 'application/octet-stream') {
        return normalize_image_mime($t);
    }
    if (!empty($file['tmp_name']) && is_readable($file['tmp_name']) && function_exists('finfo_open')) {
        $f = @finfo_open(FILEINFO_MIME_TYPE);
        if ($f) {
            $m = finfo_file($f, $file['tmp_name']);
            finfo_close($f);
            if (is_string($m) && $m !== '') {
                $norm = normalize_image_mime($m);
                if ($norm === 'application/octet-stream' || $norm === 'inode/x-empty') {
                    $again = detect_image_mime_from_bytes($file['tmp_name']);
                    if ($again !== null) {
                        return normalize_image_mime($again);
                    }
                }
                return $norm;
            }
        }
    }
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $map = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp'];
    return normalize_image_mime($map[$ext] ?? $t);
}

function upload_file(array $file, string $directory = 'images'): ?string {
    $upload_path = UPLOAD_DIR . $directory . '/';
    if (!is_dir($upload_path)) {
        if (!@mkdir($upload_path, 0777, true) && !is_dir($upload_path)) {
            return null;
        }
    }
    @chmod($upload_path, 0777);

    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $mime = normalize_image_mime(resolve_uploaded_image_mime($file));
    if (!in_array($mime, $allowed, true)) {
        return null;
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        return null;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext === '') {
        $fromMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
        if (isset($fromMime[$mime])) {
            $ext = $fromMime[$mime];
        }
    }
    if ($ext === '') {
        return null;
    }
    $filename = uniqid('img_') . '_' . time() . '.' . $ext;
    $destination = $upload_path . $filename;

    $tmp = $file['tmp_name'];
    if (is_uploaded_file($tmp) && move_uploaded_file($tmp, $destination)) {
        return UPLOAD_URL . $directory . '/' . $filename;
    }
    // บางระบบ (เช่น Windows / สิทธิ์พาธ) move ล้มเหลว — ลอง copy แล้วลบ temp
    if (is_uploaded_file($tmp) && @copy($tmp, $destination)) {
        @unlink($tmp);
        return UPLOAD_URL . $directory . '/' . $filename;
    }

    return null;
}

/**
 * อัปโหลดและปรับขนาดรูปเรือให้เท่ากัน (1200x800) รองรับ jpg, png, gif, webp
 */
function upload_boat_image(array $file, int $boat_id): ?string {
    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext)) {
        return null;
    }
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB
        return null;
    }
    $baseDir = dirname(dirname(__DIR__));
    $uploadDir = $baseDir . '/uploads/boats/' . $boat_id . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $filename = 'boat_' . uniqid() . '_' . time() . '.jpg'; // บันทึกเป็น jpg หลัง resize
    $destPath = $uploadDir . $filename;

    $src = null;
    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $src = @imagecreatefromjpeg($file['tmp_name']);
            break;
        case 'png':
            $src = @imagecreatefrompng($file['tmp_name']);
            break;
        case 'gif':
            $src = @imagecreatefromgif($file['tmp_name']);
            break;
        case 'webp':
            $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file['tmp_name']) : null;
            break;
    }
    if (!$src) {
        return null;
    }

    $srcW = imagesx($src);
    $srcH = imagesy($src);
    $maxW = 1200;
    $maxH = 800;
    // Crop/resize เป็นขนาดเดียวกัน 1200x800 (cover - เติมเต็มแล้ว crop กลาง)
    $ratio = max($maxW / $srcW, $maxH / $srcH);
    $srcCropW = $maxW / $ratio;
    $srcCropH = $maxH / $ratio;
    $srcX = max(0, ($srcW - $srcCropW) / 2);
    $srcY = max(0, ($srcH - $srcCropH) / 2);

    $dst = imagecreatetruecolor($maxW, $maxH);
    if (!$dst) {
        imagedestroy($src);
        return null;
    }
    imagecopyresampled($dst, $src, 0, 0, (int)$srcX, (int)$srcY, $maxW, $maxH, (int)$srcCropW, (int)$srcCropH);
    imagedestroy($src);

    $ok = imagejpeg($dst, $destPath, 88);
    imagedestroy($dst);
    if (!$ok) {
        return null;
    }
    return 'uploads/boats/' . $boat_id . '/' . $filename;
}

/** ขนาดมาตรฐานการ์ดโปรโมชั่นหน้าแรก (อัตราส่วน 2:1 — แสดงใน UI แอดมิน) */
if (!defined('PROMO_CARD_IMAGE_W')) {
    define('PROMO_CARD_IMAGE_W', 560);
    define('PROMO_CARD_IMAGE_H', 280);
}

/**
 * อัปโหลดรูปโปรโมชั่น — ปรับเป็น 560×280 px (cover + crop กลาง) บันทึกเป็น JPG
 * คืนค่า ok/url หรือข้อความข้อผิดพลาดชัดเจน (สำหรับ toast / API)
 */
function upload_promotion_image_result(array $file): array {
    $fail = static function (string $msg): array {
        return ['ok' => false, 'message' => $msg];
    };
    $ok = static function (string $url): array {
        return ['ok' => true, 'url' => $url];
    };

    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $fromMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];

    if (!empty($file['tmp_name']) && is_readable($file['tmp_name'])) {
        $sniffMime = detect_image_mime_from_bytes($file['tmp_name']);
        if ($sniffMime === 'image/avif') {
            return $fail('รูปแบบ AVIF ยังไม่รองรับ — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
        }
        if ($sniffMime === 'image/heic') {
            return $fail('รูปแบบ HEIC/HEIF — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
        }
        if ($sniffMime !== null && isset($fromMime[$sniffMime])) {
            $ext = $fromMime[$sniffMime];
        }
    }
    if ($ext === '') {
        $mm = normalize_image_mime(resolve_uploaded_image_mime($file));
        if (isset($fromMime[$mm])) {
            $ext = $fromMime[$mm];
        }
    }
    if (!in_array($ext, $allowed_ext, true)) {
        return $fail('นามสกุลไฟล์ไม่รองรับ — ใช้ .jpg .jpeg .png .gif หรือ .webp');
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        return $fail('ไฟล์ใหญ่เกิน 5MB');
    }
    if (!function_exists('imagecreatetruecolor')) {
        $u = upload_file($file, 'promotions');
        if ($u === null) {
            return $fail('ไม่สามารถบันทึกไฟล์ได้ — ตรวจสอบสิทธิ์โฟลเดอร์ api/uploads/promotions/ และชนิดไฟล์ (JPG/PNG/GIF/WebP)');
        }

        return $ok($u);
    }

    $upload_path = UPLOAD_DIR . 'promotions/';
    if (!is_dir($upload_path)) {
        if (!@mkdir($upload_path, 0777, true) && !is_dir($upload_path)) {
            return $fail('สร้างโฟลเดอร์ api/uploads/promotions/ ไม่ได้ — ตรวจสอบสิทธิ์โฟลเดอร์ api/uploads/');
        }
    }
    @chmod($upload_path, 0777);

    $src = null;
    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $src = @imagecreatefromjpeg($file['tmp_name']);
            break;
        case 'png':
            $src = @imagecreatefrompng($file['tmp_name']);
            if ($src && function_exists('imagealphablending')) {
                imagealphablending($src, true);
            }
            break;
        case 'gif':
            $src = @imagecreatefromgif($file['tmp_name']);
            break;
        case 'webp':
            $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file['tmp_name']) : null;
            break;
    }
    if (!$src) {
        $u = upload_file($file, 'promotions');
        if ($u === null) {
            return $fail('อ่านรูปไม่ได้หรือบันทึกไม่สำเร็จ — ลอง JPG/PNG คุณภาพปกติ หรือตรวจสอบสิทธิ์ api/uploads/promotions/');
        }

        return $ok($u);
    }

    $maxW = (int) PROMO_CARD_IMAGE_W;
    $maxH = (int) PROMO_CARD_IMAGE_H;
    $srcW = imagesx($src);
    $srcH = imagesy($src);
    if ($srcW < 1 || $srcH < 1) {
        imagedestroy($src);
        $u = upload_file($file, 'promotions');
        if ($u === null) {
            return $fail('รูปไม่ถูกต้องหรือบันทึกไม่สำเร็จ');
        }

        return $ok($u);
    }

    $ratio = max($maxW / $srcW, $maxH / $srcH);
    $srcCropW = $maxW / $ratio;
    $srcCropH = $maxH / $ratio;
    $srcX = max(0, ($srcW - $srcCropW) / 2);
    $srcY = max(0, ($srcH - $srcCropH) / 2);

    $dst = imagecreatetruecolor($maxW, $maxH);
    if (!$dst) {
        imagedestroy($src);
        $u = upload_file($file, 'promotions');
        if ($u === null) {
            return $fail('ประมวลผลรูปไม่สำเร็จ');
        }

        return $ok($u);
    }
    $white = imagecolorallocate($dst, 255, 255, 255);
    imagefill($dst, 0, 0, $white);
    imagealphablending($dst, true);
    imagecopyresampled($dst, $src, 0, 0, (int) $srcX, (int) $srcY, $maxW, $maxH, (int) $srcCropW, (int) $srcCropH);
    imagedestroy($src);

    $filename = 'promo_' . uniqid('', true) . '_' . time() . '.jpg';
    $destPath = $upload_path . $filename;
    $okJ = imagejpeg($dst, $destPath, 88);
    imagedestroy($dst);
    if (!$okJ) {
        $u = upload_file($file, 'promotions');
        if ($u === null) {
            return $fail('บันทึกรูปหลังย่อไม่สำเร็จ — ตรวจสอบสิทธิ์โฟลเดอร์ api/uploads/promotions/');
        }

        return $ok($u);
    }

    return $ok(UPLOAD_URL . 'promotions/' . $filename);
}

function upload_promotion_image(array $file): ?string {
    $r = upload_promotion_image_result($file);
    return (!empty($r['ok']) && !empty($r['url'])) ? $r['url'] : null;
}

function extract_id_from_path(string $path, int $segment = 0): ?int {
    $parts = explode('/', trim($path, '/'));
    if (isset($parts[$segment]) && is_numeric($parts[$segment])) {
        return (int)$parts[$segment];
    }
    return null;
}

/**
 * โหลด config อีเมล (รองรับ email.local.php)
 */
function get_email_config(): array {
    $base = __DIR__ . '/email.php';
    $local = __DIR__ . '/email.local.php';
    $config = file_exists($base) ? require $base : [];
    if (file_exists($local)) {
        $config = array_merge($config, require $local);
    }
    return $config;
}

/**
 * ส่งอีเมล (ใช้ mail() ของ PHP)
 * คืนค่า true ถ้าส่งสำเร็จ, false ถ้าล้มเหลว
 */
function send_email(string $to, string $subject, string $body_html, array $options = []): bool {
    $config = get_email_config();
    if (empty($config['enabled'])) {
        return false;
    }
    $from_email = $options['from_email'] ?? $config['from_email'] ?? 'noreply@boatly.th';
    $from_name = $options['from_name'] ?? $config['from_name'] ?? 'BOATLY';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . ($from_name ? "{$from_name} <{$from_email}>" : $from_email),
    ];
    if (!empty($config['reply_to'])) {
        $headers[] = 'Reply-To: ' . $config['reply_to'];
    }
    $header_str = implode("\r\n", $headers);
    return @mail($to, $subject, $body_html, $header_str);
}

/**
 * ส่งอีเมลยืนยันการสมัครพาร์ทเนอร์
 */
function send_partner_registration_email(string $email, string $name, string $company): bool {
    $subject = 'ยืนยันการสมัครพาร์ทเนอร์ BOATLY สำเร็จ';
    $body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Inter,sans-serif;line-height:1.6;color:#1e293b;max-width:520px;margin:0 auto;padding:24px">';
    $body .= '<div style="background:linear-gradient(135deg,#023e8a,#0077b6);color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">';
    $body .= '<h1 style="margin:0;font-size:22px">BOATLY</h1>';
    $body .= '<p style="margin:8px 0 0;font-size:14px;opacity:.95">River &amp; Sea Thailand</p></div>';
    $body .= '<div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">';
    $body .= '<p style="margin:0 0 16px">สวัสดีครับ/ค่ะ <strong>' . htmlspecialchars($name) . '</strong></p>';
    $body .= '<p style="margin:0 0 16px">ขอบคุณที่สมัครเป็นพาร์ทเนอร์กับ BOATLY</p>';
    $body .= '<p style="margin:0 0 16px">การสมัครของ <strong>' . htmlspecialchars($company) . '</strong> ผ่านเรียบร้อยแล้ว</p>';
    $body .= '<div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;margin:20px 0;border-radius:0 8px 8px 0">';
    $body .= '<p style="margin:0;font-size:14px;color:#0c4a6e"><strong>ขั้นตอนถัดไป:</strong></p>';
    $body .= '<p style="margin:8px 0 0;font-size:14px;color:#0369a1">ทีมงานจะตรวจสอบข้อมูลและแจ้งผลการอนุมัติทางอีเมลนี้ เมื่อได้รับการอนุมัติ คุณสามารถเข้าสู่ระบบและจัดการเรือ/ทัวร์ได้ทันที</p></div>';
    $body .= '<p style="margin:0 0 8px;font-size:13px;color:#64748b">หากมีคำถาม ติดต่อเราได้ที่ support@boatly.th</p>';
    $body .= '<p style="margin:24px 0 0;font-size:12px;color:#94a3b8">— ทีมงาน BOATLY</p></div></body></html>';
    return send_email($email, $subject, $body);
}

/**
 * ส่งอีเมลแจ้งพาร์ทเนอร์เมื่อได้รับการอนุมัติ
 */
function send_partner_approved_email(string $email, string $name, string $company): bool {
    $subject = 'บัญชีพาร์ทเนอร์ BOATLY ของคุณได้รับการอนุมัติแล้ว';
    $body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Inter,sans-serif;line-height:1.6;color:#1e293b;max-width:520px;margin:0 auto;padding:24px">';
    $body .= '<div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">';
    $body .= '<h1 style="margin:0;font-size:22px">ยินดีด้วย!</h1>';
    $body .= '<p style="margin:8px 0 0;font-size:14px;opacity:.95">บัญชีได้รับการอนุมัติ</p></div>';
    $body .= '<div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">';
    $body .= '<p style="margin:0 0 16px">สวัสดีครับ/ค่ะ <strong>' . htmlspecialchars($name) . '</strong></p>';
    $body .= '<p style="margin:0 0 16px">บัญชีพาร์ทเนอร์ <strong>' . htmlspecialchars($company) . '</strong> ของคุณได้รับการอนุมัติจากทีมงาน BOATLY แล้ว</p>';
    $body .= '<p style="margin:0 0 16px">คุณสามารถเข้าสู่ระบบและเริ่มจัดการเรือ/ทัวร์ได้ทันที</p>';
    $body .= '<p style="margin:24px 0 0;font-size:13px;color:#64748b">— ทีมงาน BOATLY</p></div></body></html>';
    return send_email($email, $subject, $body);
}
