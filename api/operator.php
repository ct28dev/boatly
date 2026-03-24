<?php
/**
 * Operator API - สำหรับพาร์ทเนอร์จัดการเรือ ทัวร์ ฯลฯ
 * ใช้ Bearer token
 */
require_once __DIR__ . '/../includes/base_path.php';
$db = Database::getInstance()->getConnection();
try {
    $db->query("SELECT default_time_slots FROM boats LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'default_time_slots') !== false || strpos($e->getMessage(), "doesn't exist") !== false) {
        try { $db->exec("ALTER TABLE boats ADD COLUMN default_time_slots TEXT NULL"); } catch (PDOException $e2) {}
    }
}
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

$auth = require_auth();
if ($auth['role'] !== 'operator' && $auth['role'] !== 'admin') {
    error_response('Operator access required', 403);
}
$user_id = $auth['user_id'];

$op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
$op->execute([$user_id]);
$row = $op->fetch();
$op_id = $row ? (int)$row['id'] : 0;
if ($op_id <= 0) {
    error_response('Operator not found', 403);
}

switch ($action) {
    case 'boats':
        handleOperatorBoats($db, $method, $segments, $op_id);
        break;
    case 'destinations':
        handleOperatorDestinations($db);
        break;
    case 'notifications':
        handleOperatorNotifications($db, $method, $segments, $op_id);
        break;
    case 'documents':
        handleOperatorDocuments($db, $method, $segments, $op_id);
        break;
    case 'addon-templates':
        handleOperatorAddonTemplates($db, $method, $segments, $op_id);
        break;
    case 'addons':
        handleOperatorAddons($db, $method, $segments, $op_id);
        break;
    default:
        error_response('Invalid operator endpoint', 404);
}

function handleOperatorAddonTemplates(PDO $db, string $method, array $segments, int $op_id): void {
    $tid = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : 0;
    if ($method === 'GET' && $tid === 0) {
        try {
            $stmt = $db->prepare("SELECT * FROM addon_templates WHERE operator_id = ? ORDER BY sort_order ASC, name_th ASC");
            $stmt->execute([$op_id]);
            success_response($stmt->fetchAll());
        } catch (PDOException $e) {
            success_response([]);
        }
        return;
    }
    if ($method === 'POST') {
        $data = get_json_body();
        $name = trim($data['name_th'] ?? $data['name'] ?? '');
        if (empty($name)) error_response('ชื่อ Add-on จำเป็น');
        $price = (float)($data['price'] ?? 0);
        try {
            $stmt = $db->prepare("INSERT INTO addon_templates (operator_id, name_th, name_en, price, is_active, sort_order) VALUES (?, ?, ?, ?, 1, 0)");
            $stmt->execute([$op_id, $name, trim($data['name_en'] ?? $name), $price]);
            success_response(['id' => (int)$db->lastInsertId()], 'เพิ่ม Add-on สำเร็จ', 201);
        } catch (PDOException $e) {
            error_response('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
        }
        return;
    }
    if (($method === 'PUT' || $method === 'PATCH') && $tid > 0) {
        $chk = $db->prepare("SELECT id FROM addon_templates WHERE id = ? AND operator_id = ?");
        $chk->execute([$tid, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบ Add-on', 404);
        $data = get_json_body();
        $updates = []; $params = [];
        foreach (['name_th', 'name_en', 'price', 'is_active'] as $f) {
            if (array_key_exists($f, $data)) {
                $updates[] = "{$f} = ?";
                $params[] = $f === 'price' ? (float)$data[$f] : ($f === 'is_active' ? (int)$data[$f] : sanitize($data[$f]));
            }
        }
        if (empty($updates)) error_response('ไม่มีข้อมูลที่จะอัปเดต');
        $params[] = $tid;
        $db->prepare("UPDATE addon_templates SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
        try {
            $db->prepare("UPDATE addons a JOIN addon_templates t ON a.addon_template_id = t.id SET a.name_th = t.name_th, a.name_en = t.name_en, a.price = t.price WHERE t.id = ?")->execute([$tid]);
        } catch (PDOException $e) {}
        success_response(['id' => $tid], 'อัปเดตสำเร็จ');
        return;
    }
    if ($method === 'DELETE' && $tid > 0) {
        $chk = $db->prepare("SELECT id FROM addon_templates WHERE id = ? AND operator_id = ?");
        $chk->execute([$tid, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบ Add-on', 404);
        try {
            $db->prepare("DELETE FROM addons WHERE addon_template_id = ?")->execute([$tid]);
            $db->prepare("DELETE FROM addon_templates WHERE id = ?")->execute([$tid]);
        } catch (PDOException $e) {}
        success_response(null, 'ลบ Add-on แล้ว');
        return;
    }
    error_response('Invalid addon-templates endpoint', 404);
}

function handleOperatorAddons(PDO $db, string $method, array $segments, int $op_id): void {
    $addon_id = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : 0;

    if ($method === 'GET' && $addon_id === 0) {
        $stmt = $db->prepare("SELECT a.*, b.name as boat_name FROM addons a JOIN boats b ON a.boat_id = b.id WHERE b.operator_id = ? ORDER BY b.name, a.sort_order, a.id");
        $stmt->execute([$op_id]);
        success_response($stmt->fetchAll());
        return;
    }
    if ($method === 'POST') {
        $data = get_json_body();
        $boat_id = (int)($data['boat_id'] ?? 0);
        $name = trim($data['name_th'] ?? $data['name'] ?? '');
        $price = (float)($data['price'] ?? 0);
        if ($boat_id <= 0 || empty($name)) error_response('boat_id และชื่อ Add-on จำเป็น');
        $chk = $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?");
        $chk->execute([$boat_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);
        $note = trim($data['note_th'] ?? $data['description_th'] ?? '');
        $stmt = $db->prepare("INSERT INTO addons (boat_id, name_th, name_en, description_th, description_en, price, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
        $stmt->execute([$boat_id, $name, $data['name_en'] ?? $name, $note, $data['note_en'] ?? $note, $price, sanitize($data['icon'] ?? 'fa-plus-circle'), (int)($data['sort_order'] ?? 0)]);
        success_response(['id' => (int)$db->lastInsertId()], 'เพิ่ม Add-on สำเร็จ', 201);
        return;
    }
    if (($method === 'PUT' || $method === 'PATCH') && $addon_id > 0) {
        $chk = $db->prepare("SELECT a.id FROM addons a JOIN boats b ON a.boat_id = b.id WHERE a.id = ? AND b.operator_id = ?");
        $chk->execute([$addon_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบ Add-on', 404);
        $data = get_json_body();
        $updates = []; $params = [];
        foreach (['name_th', 'name_en', 'description_th', 'description_en', 'price', 'icon', 'sort_order', 'is_active'] as $f) {
            if (array_key_exists($f, $data)) {
                $updates[] = "{$f} = ?";
                $params[] = $f === 'price' ? (float)$data[$f] : ($f === 'sort_order' || $f === 'is_active' ? (int)$data[$f] : sanitize($data[$f]));
            }
        }
        if (empty($updates)) error_response('ไม่มีข้อมูลที่จะอัปเดต');
        $params[] = $addon_id;
        $db->prepare("UPDATE addons SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
        success_response(['id' => $addon_id], 'อัปเดตสำเร็จ');
        return;
    }
    if ($method === 'DELETE' && $addon_id > 0) {
        $chk = $db->prepare("SELECT a.id FROM addons a JOIN boats b ON a.boat_id = b.id WHERE a.id = ? AND b.operator_id = ?");
        $chk->execute([$addon_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบ Add-on', 404);
        $db->prepare("DELETE FROM addons WHERE id = ?")->execute([$addon_id]);
        success_response(null, 'ลบ Add-on แล้ว');
        return;
    }
    error_response('Invalid addons endpoint', 404);
}

function handleOperatorBoats(PDO $db, string $method, array $segments, int $op_id): void {
    $boat_id = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : 0;
    $sub = $segments[2] ?? '';

    if ($sub === 'images' && $boat_id > 0) {
        $chk = $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?");
        $chk->execute([$boat_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);

        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT id, image_url, alt_text, is_primary, sort_order FROM boat_images WHERE boat_id = ? ORDER BY is_primary DESC, sort_order ASC");
            $stmt->execute([$boat_id]);
            success_response($stmt->fetchAll());
            return;
        }
        if ($method === 'POST' && !empty($_FILES['image'])) {
            $count = $db->prepare("SELECT COUNT(*) FROM boat_images WHERE boat_id = ?");
            $count->execute([$boat_id]);
            $n = (int)$count->fetchColumn();
            if ($n >= 8) error_response('สูงสุด 8 รูปต่อเรือ', 400);
            $path = upload_boat_image($_FILES['image'], $boat_id);
            if (!$path) error_response('อัปโหลดไม่สำเร็จ รองรับ jpg, png, gif, webp (สูงสุด 10MB)', 400);
            $isPrimary = $n === 0 ? 1 : 0;
            $image_url = app_base_path() . '/' . ltrim($path, '/');
            $stmt = $db->prepare("INSERT INTO boat_images (boat_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->execute([$boat_id, $image_url, $isPrimary, $n + 1]);
            success_response(['id' => (int)$db->lastInsertId(), 'image_url' => $image_url], 'อัปโหลดรูปสำเร็จ', 201);
            return;
        }
        if ($method === 'DELETE' && isset($segments[3]) && is_numeric($segments[3])) {
            $img_id = (int)$segments[3];
            $stmt = $db->prepare("SELECT image_url FROM boat_images WHERE id = ? AND boat_id = ?");
            $stmt->execute([$img_id, $boat_id]);
            $row = $stmt->fetch();
            if (!$row) error_response('ไม่พบรูป', 404);
            $db->prepare("DELETE FROM boat_images WHERE id = ?")->execute([$img_id]);
            $rel = preg_replace('#^/(boatly|boathub)/?#', '', $row['image_url']);
            $filePath = dirname(__DIR__) . '/' . $rel;
            if (file_exists($filePath)) @unlink($filePath);
            success_response(null, 'ลบรูปแล้ว');
            return;
        }
        if ($method === 'PUT' && isset($segments[3]) && is_numeric($segments[3])) {
            $img_id = (int)$segments[3];
            $data = get_json_body();
            if (isset($data['is_primary']) && $data['is_primary']) {
                $db->prepare("UPDATE boat_images SET is_primary = 0 WHERE boat_id = ?")->execute([$boat_id]);
                $db->prepare("UPDATE boat_images SET is_primary = 1 WHERE id = ? AND boat_id = ?")->execute([$img_id, $boat_id]);
            }
            success_response(null, 'อัปเดตแล้ว');
            return;
        }
        error_response('Invalid images endpoint', 404);
        return;
    }

    if ($sub === 'addons' && $boat_id > 0) {
        $chk = $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?");
        $chk->execute([$boat_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);
        if ($method === 'POST') {
            $data = get_json_body();
            $template_id = (int)($data['addon_template_id'] ?? 0);
            if ($template_id <= 0) error_response('addon_template_id จำเป็น');
            $t = $db->prepare("SELECT id, name_th, name_en, price FROM addon_templates WHERE id = ? AND operator_id = ?");
            $t->execute([$template_id, $op_id]);
            $tpl = $t->fetch();
            if (!$tpl) error_response('ไม่พบ Add-on template', 404);
            $exists = $db->prepare("SELECT id FROM addons WHERE boat_id = ? AND addon_template_id = ?");
            $exists->execute([$boat_id, $template_id]);
            if ($exists->fetch()) error_response('Add-on นี้มีในเรือแล้ว');
            try {
                $db->prepare("INSERT INTO addons (boat_id, addon_template_id, name_th, name_en, price, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, 0)")->execute([$boat_id, $template_id, $tpl['name_th'], $tpl['name_en'], $tpl['price']]);
                success_response(['id' => (int)$db->lastInsertId()], 'เพิ่ม Add-on แล้ว', 201);
            } catch (PDOException $e) {
                error_response('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
            }
            return;
        }
        error_response('Invalid boat addons endpoint', 404);
        return;
    }

    if ($method === 'GET') {
        $stmt = $db->prepare(
            "SELECT b.*, d.name AS destination_name, d.province AS province, COALESCE(d.name_th, d.province) AS province_name_th,
                    COALESCE(bt.name_th, b.boat_type) AS boat_type_name,
                    (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) AS image,
                    (SELECT AVG(rating) FROM reviews WHERE boat_id = b.id AND status = 'approved') AS avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE boat_id = b.id AND status = 'approved') AS review_count
             FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN boat_types bt ON bt.slug = b.boat_type AND bt.is_active = 1
             WHERE b.operator_id = ?
             ORDER BY b.id DESC"
        );
        $stmt->execute([$op_id]);
        success_response($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $price = (float)($data['price'] ?? 0);
        if (empty($name)) error_response('ชื่อเรือ/ทัวร์จำเป็น');
        if ($price <= 0) error_response('ราคาต้องมากกว่า 0');

        $destination_id = (int)($data['destination_id'] ?? 0);
        $province = trim($data['province'] ?? '');
        if ($destination_id <= 0 && !empty($province)) {
            $destination_id = getOrCreateDestinationByProvince($db, $province);
        }
        if ($destination_id <= 0) {
            $first = $db->query("SELECT id FROM destinations WHERE status = 'active' ORDER BY sort_order ASC LIMIT 1")->fetch();
            $destination_id = $first ? (int)$first['id'] : 0;
        }
        if ($destination_id <= 0) error_response('กรุณาเลือกพื้นที่ให้บริการ (จังหวัด)');

        $duration = (int)($data['duration'] ?? 120);
        if ($duration <= 0) $duration = 120;
        $capacity = (int)($data['capacity'] ?? 20);
        if ($capacity <= 0) $capacity = 20;

        $slug = strtolower(preg_replace('/[^a-zA-Z0-9ก-๙]+/u', '-', $name));
        $slug = trim($slug, '-') ?: 'boat';
        $slug .= '-' . substr(uniqid(), -4);

        $time_slots_json = null;
        if (!empty($data['default_time_slots']) && is_array($data['default_time_slots'])) {
            $slots = array_values(array_filter(array_map(function ($s) {
                $s = trim((string)$s);
                return preg_match('/^\d{1,2}:\d{2}$/', $s) ? $s : null;
            }, $data['default_time_slots'])));
            if (!empty($slots)) $time_slots_json = json_encode($slots, JSON_UNESCAPED_UNICODE);
        }

        $stmt = $db->prepare(
            "INSERT INTO boats (operator_id, destination_id, name, slug, boat_type, capacity, price, duration,
             description, description_th, route, route_th, highlights, river, status, featured, default_time_slots)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)"
        );
        try {
            $stmt->execute([
                $op_id, $destination_id, sanitize($name), $slug,
                sanitize($data['boat_type'] ?? 'longtail'), $capacity, $price, $duration,
                $data['description'] ?? '', $data['description_th'] ?? '',
                $data['route'] ?? '', $data['route_th'] ?? '',
                $data['highlights'] ?? null, sanitize($data['river'] ?? ''),
                $time_slots_json
            ]);
            $id = (int)$db->lastInsertId();
            if ($id <= 0) error_response('บันทึกไม่สำเร็จ', 500);
            success_response(['id' => $id], 'เพิ่มเรือ/ทัวร์สำเร็จ', 201);
        } catch (PDOException $e) {
            error_response('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
        }
    } elseif (($method === 'PUT' || $method === 'PATCH') && isset($segments[1]) && is_numeric($segments[1])) {
        $boat_id = (int)$segments[1];
        $chk = $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?");
        $chk->execute([$boat_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);

        $data = get_json_body();
        $dest_id = (int)($data['destination_id'] ?? 0);
        $province = trim($data['province'] ?? '');
        if ($dest_id <= 0 && !empty($province)) {
            $dest_id = getOrCreateDestinationByProvince($db, $province);
            if ($dest_id > 0) $data['destination_id'] = $dest_id;
        }
        $updates = []; $params = [];
        $allowed = ['name', 'destination_id', 'boat_type', 'capacity', 'price', 'duration', 'description', 'description_th', 'route', 'route_th', 'highlights', 'river', 'status', 'default_time_slots'];
        if (!empty($data['default_time_slots']) && is_array($data['default_time_slots'])) {
            $slots = array_values(array_filter(array_map(function ($s) {
                $s = trim((string)$s);
                return preg_match('/^\d{1,2}:\d{2}$/', $s) ? $s : null;
            }, $data['default_time_slots'])));
            $data['default_time_slots'] = !empty($slots) ? json_encode($slots, JSON_UNESCAPED_UNICODE) : null;
        }
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                if ($f === 'price' || $f === 'capacity' || $f === 'duration' || $f === 'destination_id') {
                    $updates[] = "{$f} = ?";
                    $params[] = $f === 'price' ? (float)$data[$f] : (int)$data[$f];
                } elseif ($f === 'default_time_slots') {
                    $updates[] = "{$f} = ?";
                    $params[] = $data[$f];
                } else {
                    $updates[] = "{$f} = ?";
                    $params[] = sanitize($data[$f]);
                }
            }
        }
        if (empty($updates)) error_response('ไม่มีข้อมูลที่จะอัปเดต');
        $params[] = $boat_id;
        try {
            $db->prepare("UPDATE boats SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
            success_response(['id' => $boat_id], 'อัปเดตสำเร็จ');
        } catch (PDOException $e) {
            error_response('อัปเดตไม่สำเร็จ: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $boat_id = (int)$segments[1];
        $chk = $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?");
        $chk->execute([$boat_id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);
        $permanent = !empty($_GET['permanent']);
        if ($permanent) {
            try {
                $db->prepare("DELETE FROM boat_images WHERE boat_id = ?")->execute([$boat_id]);
                $db->prepare("DELETE FROM addons WHERE boat_id = ?")->execute([$boat_id]);
                $db->prepare("DELETE FROM boats WHERE id = ? AND operator_id = ?")->execute([$boat_id, $op_id]);
                success_response(null, 'ลบเรือถาวรแล้ว');
            } catch (PDOException $e) {
                error_response('ลบไม่สำเร็จ: ' . $e->getMessage(), 500);
            }
        } else {
            $stmt = $db->prepare("UPDATE boats SET status = 'inactive' WHERE id = ? AND operator_id = ?");
            $stmt->execute([$boat_id, $op_id]);
            success_response(null, 'ปิดการขายเรือแล้ว');
        }
    } else {
        error_response('Invalid boats endpoint', 404);
    }
}

function handleOperatorDestinations(PDO $db): void {
    $stmt = $db->prepare("SELECT id, name, name_th, slug, province FROM destinations WHERE status = 'active' ORDER BY sort_order ASC, name ASC");
    $stmt->execute();
    success_response($stmt->fetchAll());
}

function getOrCreateDestinationByProvince(PDO $db, string $province): int {
    if (empty(trim($province))) return 0;
    $province = trim($province);
    $stmt = $db->prepare("SELECT id FROM destinations WHERE province = ? OR name_th = ? OR name = ? LIMIT 1");
    $stmt->execute([$province, $province, $province]);
    $row = $stmt->fetch();
    if ($row) return (int)$row['id'];
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9ก-๙]+/u', '-', $province));
    $slug = trim($slug, '-') ?: 'province';
    $slug .= '-' . substr(uniqid(), -4);
    $stmt = $db->prepare("INSERT INTO destinations (name, name_th, slug, province, status, sort_order) VALUES (?, ?, ?, ?, 'active', 999)");
    $stmt->execute([$province, $province, $slug, $province]);
    return (int)$db->lastInsertId();
}

function handleOperatorNotifications(PDO $db, string $method, array $segments, int $op_id): void {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT * FROM operator_notifications WHERE operator_id = ? ORDER BY is_pinned DESC, created_at DESC LIMIT 100");
        $stmt->execute([$op_id]);
        success_response($stmt->fetchAll());
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $data = get_json_body();
        $chk = $db->prepare("SELECT id FROM operator_notifications WHERE id = ? AND operator_id = ?");
        $chk->execute([$id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบการแจ้งเตือน', 404);
        $updates = []; $params = [];
        if (isset($data['is_read'])) { $updates[] = 'is_read = ?'; $params[] = (int)$data['is_read']; }
        if (isset($data['is_pinned'])) { $updates[] = 'is_pinned = ?'; $params[] = (int)$data['is_pinned']; }
        if (isset($data['status'])) { $updates[] = 'status = ?'; $params[] = sanitize($data['status']); }
        if (!empty($updates)) {
            $params[] = $id;
            $db->prepare("UPDATE operator_notifications SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
        }
        success_response(null, 'อัปเดตแล้ว');
    } else {
        error_response('Invalid notifications endpoint', 404);
    }
}

function handleOperatorDocuments(PDO $db, string $method, array $segments, int $op_id): void {
    if ($method === 'POST' && ($segments[1] ?? '') === 'upload') {
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            error_response('กรุณาเลือกไฟล์หรืออัปโหลดไม่สำเร็จ');
        }
        $file = $_FILES['file'];
        $allowed_ext = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed_ext)) {
            error_response('รองรับเฉพาะ PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (สูงสุด 10MB)');
        }
        if ($file['size'] > 10 * 1024 * 1024) {
            error_response('ไฟล์ใหญ่เกิน 10MB');
        }
        $filename = 'doc_' . uniqid() . '_' . time() . '.' . $ext;
        $uploadDir = dirname(__DIR__) . '/uploads/documents/' . $op_id . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $path = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            error_response('บันทึกไฟล์ไม่สำเร็จ');
        }
        $relativePath = 'uploads/documents/' . $op_id . '/' . $filename;
        success_response(['path' => $relativePath, 'url' => app_base_path() . '/' . $relativePath], 'อัปโหลดสำเร็จ', 201);
        return;
    }
    if ($method === 'GET') {
        $stmt = $db->prepare(
            "SELECT d.*, b.name AS boat_name FROM operator_documents d
             LEFT JOIN boats b ON d.boat_id = b.id WHERE d.operator_id = ? ORDER BY d.expiry_date ASC"
        );
        $stmt->execute([$op_id]);
        $docs = $stmt->fetchAll();
        foreach ($docs as &$d) {
            $d['days_to_expiry'] = null;
            if (!empty($d['expiry_date'])) {
                $exp = new DateTime($d['expiry_date']);
                $now = new DateTime();
                $d['days_to_expiry'] = (int)$now->diff($exp)->format('%r%a');
            }
        }
        success_response($docs);
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $doc_type = sanitize($data['doc_type'] ?? '');
        $file_path = sanitize($data['file_path'] ?? '');
        $doc_name = sanitize($data['doc_name'] ?? '');
        $expiry_date = !empty($data['expiry_date']) ? $data['expiry_date'] : null;
        $boat_id = isset($data['boat_id']) ? (int)$data['boat_id'] : null;
        if (empty($doc_type) || empty($file_path)) error_response('doc_type และ file_path จำเป็น');
        $chk = $boat_id ? $db->prepare("SELECT id FROM boats WHERE id = ? AND operator_id = ?") : null;
        if ($boat_id && $chk) {
            $chk->execute([$boat_id, $op_id]);
            if (!$chk->fetch()) error_response('ไม่พบเรือ', 404);
        }
        $stmt = $db->prepare("INSERT INTO operator_documents (operator_id, boat_id, doc_type, file_path, doc_name, expiry_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$op_id, $boat_id ?: null, $doc_type, $file_path, $doc_name ?: null, $expiry_date]);
        success_response(['id' => (int)$db->lastInsertId()], 'บันทึกเอกสารแล้ว', 201);
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $data = get_json_body();
        $chk = $db->prepare("SELECT id FROM operator_documents WHERE id = ? AND operator_id = ?");
        $chk->execute([$id, $op_id]);
        if (!$chk->fetch()) error_response('ไม่พบเอกสาร', 404);
        $updates = []; $params = [];
        if (isset($data['doc_name'])) { $updates[] = 'doc_name = ?'; $params[] = sanitize($data['doc_name']); }
        if (isset($data['expiry_date'])) { $updates[] = 'expiry_date = ?'; $params[] = $data['expiry_date'] ?: null; }
        if (isset($data['file_path']) && trim($data['file_path']) !== '') { $updates[] = 'file_path = ?'; $params[] = sanitize($data['file_path']); }
        if (!empty($updates)) {
            $params[] = $id;
            $db->prepare("UPDATE operator_documents SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
        }
        success_response(null, 'อัปเดตแล้ว');
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $stmt = $db->prepare("DELETE FROM operator_documents WHERE id = ? AND operator_id = ?");
        $stmt->execute([$id, $op_id]);
        if ($stmt->rowCount() === 0) error_response('ไม่พบเอกสาร', 404);
        success_response(null, 'ลบแล้ว');
    } else {
        error_response('Invalid documents endpoint', 404);
    }
}
