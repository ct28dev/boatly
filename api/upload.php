<?php

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

if ($method !== 'POST') {
    error_response('Method not allowed', 405);
}

if ($action === 'image') {
    handleImageUpload();
} elseif ($action === 'promotion') {
    handlePromotionImageUpload();
} else {
    error_response('Invalid upload endpoint', 404);
}

function handleImageUpload(): void {
    $auth = require_auth();

    if (empty($_FILES['image'])) {
        error_response('No image file provided');
    }

    $directory = sanitize($_POST['directory'] ?? 'general');
    $url = upload_file($_FILES['image'], $directory);

    if (!$url) {
        error_response('Failed to upload image. Check file type (jpg, png, gif, webp) and size (max 5MB).');
    }

    success_response([
        'url' => $url,
        'full_url' => (isset($_SERVER['HTTPS']) ? 'https' : 'http') .
            '://' . $_SERVER['HTTP_HOST'] . $url
    ], 'Image uploaded successfully', 201);
}

function handlePromotionImageUpload(): void {
    $db = Database::getInstance()->getConnection();
    require_admin_or_staff($db, 'promotions');

    $ct = (string) ($_SERVER['CONTENT_TYPE'] ?? '');
    $cl = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($cl > 0 && stripos($ct, 'multipart/form-data') !== false && empty($_FILES)) {
        $pm = ini_get('post_max_size');
        $pmb = ini_parse_bytes($pm);
        if ($pmb > 0 && $cl > $pmb) {
            error_response('ไฟล์ใหญ่เกิน post_max_size ของ PHP (' . $pm . ') — แก้ php.ini หรือไฟล์ api/.user.ini แล้วรีสตาร์ท Apache หรือย่อรูป');
        }
        error_response('ไม่พบไฟล์ที่อัปโหลด — ลองเลือกรูปใหม่หรือตรวจสอบการเชื่อมต่อ');
    }

    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        error_response('ไม่พบไฟล์ — ถ้าไฟล์ใหญ่มาก อาจเกิน post_max_size ของ PHP ลองย่อรูปหรือแก้ php.ini');
    }

    $f = $_FILES['image'];
    if (isset($f['error']) && (int)$f['error'] !== UPLOAD_ERR_OK) {
        error_response(upload_client_error_message((int)$f['error']));
    }

    $ext = strtolower(pathinfo($f['name'] ?? '', PATHINFO_EXTENSION));
    if (in_array($ext, ['heic', 'heif'], true)) {
        error_response('รูปแบบ HEIC/HEIF (จาก iPhone บางรุ่น) ยังไม่รองรับ — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
    }

    $realMime = '';
    if (!empty($f['tmp_name']) && is_readable($f['tmp_name']) && function_exists('finfo_open')) {
        $ffi = @finfo_open(FILEINFO_MIME_TYPE);
        if ($ffi) {
            $realMime = strtolower((string)finfo_file($ffi, $f['tmp_name']));
            finfo_close($ffi);
        }
    }
    if ($realMime !== '' && (strpos($realMime, 'heic') !== false || strpos($realMime, 'heif') !== false)) {
        error_response('รูปแบบ HEIC/HEIF ยังไม่รองรับ — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด (อย่าเปลี่ยนแค่นามสกุลไฟล์)');
    }
    if ($realMime !== '' && strpos($realMime, 'avif') !== false) {
        error_response('รูปแบบ AVIF ยังไม่รองรับ — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
    }

    if (!empty($f['tmp_name']) && is_readable($f['tmp_name'])) {
        $sniff = detect_image_mime_from_bytes($f['tmp_name']);
        if ($sniff === 'image/avif') {
            error_response('รูปแบบ AVIF ยังไม่รองรับ — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
        }
        if ($sniff === 'image/heic') {
            error_response('รูปแบบ HEIC/HEIF — แปลงเป็น JPG หรือ PNG ก่อนอัปโหลด');
        }
    }

    $result = upload_promotion_image_result($f);
    if (empty($result['ok']) || empty($result['url'])) {
        error_response($result['message'] ?? 'ไม่สามารถบันทึกรูปได้ — ใช้ไฟล์ .jpg .jpeg .png .gif หรือ .webp ขนาดไม่เกิน 5MB และตรวจสอบว่าไม่ใช่ไฟล์เสียหาย');
    }
    $url = $result['url'];

    success_response([
        'url' => $url,
        'width' => (int)PROMO_CARD_IMAGE_W,
        'height' => (int)PROMO_CARD_IMAGE_H,
        'full_url' => (isset($_SERVER['HTTPS']) ? 'https' : 'http') .
            '://' . $_SERVER['HTTP_HOST'] . $url,
    ], 'Image uploaded successfully', 201);
}
