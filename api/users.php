<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'profile') {
            handleGetProfile($db);
        } elseif ($action === 'profile-image') {
            handleServeProfileImage($db);
        } elseif ($action === 'notifications') {
            handleGetNotifications($db);
        } elseif ($action === 'stats') {
            handleGetStats($db);
        } else {
            error_response('Invalid users endpoint', 404);
        }
        break;
    case 'POST':
        if ($action === 'profile-image') {
            handleUploadProfileImage($db);
        } else {
            error_response('Invalid users endpoint', 404);
        }
        break;
    case 'PUT':
        if ($action === 'profile') {
            handleUpdateProfile($db);
        } elseif ($action === 'notifications') {
            $sub = $segments[1] ?? '';
            if ($sub === 'read-all') {
                handleMarkAllRead($db);
            } elseif (is_numeric($sub) && isset($segments[2]) && $segments[2] === 'read') {
                handleMarkRead($db, (int)$sub);
            } else {
                error_response('Invalid notifications endpoint', 404);
            }
        } else {
            error_response('Invalid users endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleServeProfileImage(PDO $db): void {
    $auth = get_auth_user();
    if (!$auth && !empty($_GET['token'])) {
        $auth = verify_token($_GET['token']);
    }
    if (!$auth) {
        header('HTTP/1.1 401 Unauthorized');
        exit;
    }
    $stmt = $db->prepare("SELECT profile_image FROM users WHERE id = ?");
    $stmt->execute([$auth['user_id']]);
    $img = $stmt->fetchColumn();
    if (!$img) {
        header('HTTP/1.1 404 Not Found');
        exit;
    }
    if (strpos($img, 'http') === 0) {
        header('Location: ' . $img);
        exit;
    }
    $file = dirname(__DIR__) . '/' . $img;
    if (!file_exists($file) || !is_readable($file)) {
        header('HTTP/1.1 404 Not Found');
        exit;
    }
    $mime = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $file) ?: 'image/jpeg';
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=86400');
    readfile($file);
    exit;
}

function handleGetProfile(PDO $db): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare(
            "SELECT id, name, email, phone, role, language, profile_image
             FROM users WHERE id = ?"
        );
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            error_response('User not found', 404);
        }

        if ($user['role'] === 'operator') {
            $p = $db->prepare(
                "SELECT id, company_name, description, logo, tax_id, bank_account, contact_phone, status
                 FROM operators WHERE user_id = ?"
            );
            $p->execute([$auth['user_id']]);
            $user['operator'] = $p->fetch() ?: null;
        }

        success_response($user);
    } catch (PDOException $e) {
        error_response('Failed to fetch profile: ' . $e->getMessage(), 500);
    }
}

function handleUpdateProfile(PDO $db): void {
    $auth = require_auth();
    $data = get_json_body();

    $fields = [];
    $values = [];

    if (isset($data['name'])) {
        $fields[] = 'name = ?';
        $values[] = sanitize($data['name']);
    }
    if (isset($data['phone'])) {
        $fields[] = 'phone = ?';
        $values[] = sanitize($data['phone']);
    }
    if (isset($data['language'])) {
        $fields[] = 'language = ?';
        $values[] = sanitize($data['language']);
    }
    if (isset($data['profile_image'])) {
        $fields[] = 'profile_image = ?';
        $values[] = sanitize($data['profile_image']);
    }

    if (empty($fields)) {
        error_response('No fields to update');
    }

    $values[] = $auth['user_id'];

    try {
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);

        $stmt = $db->prepare(
            "SELECT id, name, email, phone, role, language, profile_image
             FROM users WHERE id = ?"
        );
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        success_response($user, 'Profile updated');
    } catch (PDOException $e) {
        error_response('Failed to update profile: ' . $e->getMessage(), 500);
    }
}

function handleGetNotifications(PDO $db): void {
    $auth = require_auth();
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    try {
        $count_stmt = $db->prepare("SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?");
        $count_stmt->execute([$auth['user_id']]);
        $total = (int)$count_stmt->fetch()['total'];

        $unread_stmt = $db->prepare(
            "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0"
        );
        $unread_stmt->execute([$auth['user_id']]);
        $unread = (int)$unread_stmt->fetch()['unread'];

        $stmt = $db->prepare(
            "SELECT * FROM notifications WHERE user_id = ?
             ORDER BY created_at DESC LIMIT ? OFFSET ?"
        );
        $stmt->execute([$auth['user_id'], $limit, $offset]);
        $notifications = $stmt->fetchAll();

        success_response([
            'unread_count'  => $unread,
            'notifications' => $notifications,
            'pagination'    => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch notifications: ' . $e->getMessage(), 500);
    }
}

function handleMarkRead(PDO $db, int $id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $auth['user_id']]);

        success_response(null, 'Notification marked as read');
    } catch (PDOException $e) {
        error_response('Failed to mark notification: ' . $e->getMessage(), 500);
    }
}

function handleMarkAllRead(PDO $db): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$auth['user_id']]);

        success_response(null, 'All notifications marked as read');
    } catch (PDOException $e) {
        error_response('Failed to mark notifications: ' . $e->getMessage(), 500);
    }
}

function handleGetStats(PDO $db): void {
    $auth = require_auth();

    try {
        $bookings = $db->prepare("SELECT COUNT(*) AS c FROM bookings WHERE user_id = ?");
        $bookings->execute([$auth['user_id']]);

        $reviews = $db->prepare("SELECT COUNT(*) AS c FROM reviews WHERE user_id = ?");
        $reviews->execute([$auth['user_id']]);

        $favorites = $db->prepare("SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?");
        $favorites->execute([$auth['user_id']]);

        success_response([
            'total_bookings'  => (int)$bookings->fetch()['c'],
            'total_reviews'   => (int)$reviews->fetch()['c'],
            'total_favorites' => (int)$favorites->fetch()['c']
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch stats: ' . $e->getMessage(), 500);
    }
}

function handleUploadProfileImage(PDO $db): void {
    $auth = require_auth();

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        error_response('No image uploaded or upload error');
    }

    $file = $_FILES['image'];
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed)) {
        error_response('Invalid image type. Allowed: JPG, PNG, GIF, WEBP');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        error_response('Image too large. Maximum 5MB');
    }

    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        default      => 'jpg'
    };

    $uploadDir = dirname(__DIR__) . '/uploads/profiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Remove old profile image (only local files, not external URLs)
    $stmt = $db->prepare("SELECT profile_image FROM users WHERE id = ?");
    $stmt->execute([$auth['user_id']]);
    $old = $stmt->fetchColumn();
    if ($old && strpos($old, 'http') !== 0 && file_exists(dirname(__DIR__) . '/' . $old)) {
        @unlink(dirname(__DIR__) . '/' . $old);
    }

    $filename = 'user_' . $auth['user_id'] . '_' . time() . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        error_response('Failed to save image', 500);
    }

    $relativePath = 'uploads/profiles/' . $filename;

    try {
        $stmt = $db->prepare("UPDATE users SET profile_image = ? WHERE id = ?");
        $stmt->execute([$relativePath, $auth['user_id']]);

        success_response(['profile_image' => $relativePath], 'Profile image updated');
    } catch (PDOException $e) {
        error_response('Failed to update profile: ' . $e->getMessage(), 500);
    }
}
