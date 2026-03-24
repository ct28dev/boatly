<?php
/**
 * Itinerary Plans API - CRUD สำหรับลูกค้าวางแผนทริป (ส่วนตัวหรือแชร์)
 */
$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];

// Auto-migrate: itinerary_plans
try {
    $db->query("SELECT 1 FROM itinerary_plans LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        $db->exec("CREATE TABLE itinerary_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            trip_date_start DATE NULL,
            trip_date_end DATE NULL,
            location VARCHAR(200) NULL,
            is_public TINYINT DEFAULT 0,
            share_token VARCHAR(64) UNIQUE,
            items_json JSON,
            time_slots_json JSON,
            locations_json JSON,
            activity_content TEXT,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
    }
}
// Migrate: add new columns if not exist
foreach (['time_slots_json', 'locations_json', 'activity_content', 'trip_date_start', 'trip_date_end', 'location'] as $col) {
    try {
        $db->query("SELECT $col FROM itinerary_plans LIMIT 1");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "Unknown column") !== false) {
            $type = ($col === 'activity_content' ? 'TEXT' : ($col === 'location' ? 'VARCHAR(200)' : ($col === 'trip_date_start' || $col === 'trip_date_end' ? 'DATE' : 'JSON')));
            $db->exec("ALTER TABLE itinerary_plans ADD COLUMN $col $type NULL");
        }
    }
}

$action = $segments[0] ?? '';
$id = (isset($segments[0]) && is_numeric($segments[0])) ? (int)$segments[0] : ((isset($segments[1]) && is_numeric($segments[1])) ? (int)$segments[1] : 0);

// Public view by share_token (no auth)
if ($method === 'GET' && $action === 'shared' && !empty($segments[1])) {
    $token = $segments[1];
    $stmt = $db->prepare("SELECT id, title, description, items_json, time_slots_json, locations_json, activity_content, created_at FROM itinerary_plans WHERE share_token = ? AND is_public = 1");
    $stmt->execute([$token]);
    $plan = $stmt->fetch();
    if (!$plan) error_response('แผนไม่พบหรือไม่ได้แชร์', 404);
    $plan['items'] = json_decode($plan['items_json'] ?? '[]', true) ?: [];
    $plan['time_slots'] = json_decode($plan['time_slots_json'] ?? '[]', true) ?: [];
    $plan['locations'] = json_decode($plan['locations_json'] ?? '[]', true) ?: [];
    unset($plan['items_json'], $plan['time_slots_json'], $plan['locations_json']);
    success_response($plan);
    exit;
}

$auth = require_auth();
$user_id = (int)$auth['user_id'];

switch ($method) {
    case 'GET':
        if ($id > 0) {
            $stmt = $db->prepare("SELECT * FROM itinerary_plans WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            $plan = $stmt->fetch();
            if (!$plan) error_response('ไม่พบแผน', 404);
            $plan['items'] = json_decode($plan['items_json'] ?? '[]', true) ?: [];
            $plan['time_slots'] = json_decode($plan['time_slots_json'] ?? '[]', true) ?: [];
            $plan['locations'] = json_decode($plan['locations_json'] ?? '[]', true) ?: [];
            unset($plan['items_json'], $plan['time_slots_json'], $plan['locations_json']);
            success_response($plan);
        } else {
            $stmt = $db->prepare("SELECT id, title, description, is_public, share_token, created_at FROM itinerary_plans WHERE user_id = ? ORDER BY updated_at DESC");
            $stmt->execute([$user_id]);
            success_response($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = get_json_body();
        $title = trim($data['title'] ?? '');
        if (empty($title)) error_response('กรุณากรอกชื่อแผน');
        $description = trim($data['description'] ?? '');
        $trip_date_start = !empty($data['trip_date_start']) ? sanitize($data['trip_date_start']) : null;
        $trip_date_end = !empty($data['trip_date_end']) ? sanitize($data['trip_date_end']) : null;
        $location = !empty($data['location']) ? sanitize($data['location']) : null;
        $is_public = isset($data['is_public']) ? (int)$data['is_public'] : 0;
        $items = $data['items'] ?? [];
        if (!is_array($items)) $items = [];
        $time_slots = $data['time_slots'] ?? [];
        if (!is_array($time_slots)) $time_slots = [];
        $locations = $data['locations'] ?? [];
        if (!is_array($locations)) $locations = [];
        $activity_content = trim($data['activity_content'] ?? '');
        $share_token = $is_public ? bin2hex(random_bytes(16)) : null;
        $items_json = json_encode($items, JSON_UNESCAPED_UNICODE);
        $time_slots_json = json_encode($time_slots, JSON_UNESCAPED_UNICODE);
        $locations_json = json_encode($locations, JSON_UNESCAPED_UNICODE);
        $stmt = $db->prepare("INSERT INTO itinerary_plans (user_id, title, description, trip_date_start, trip_date_end, location, is_public, share_token, items_json, time_slots_json, locations_json, activity_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, sanitize($title), sanitize($description), $trip_date_start, $trip_date_end, $location, $is_public, $share_token, $items_json, $time_slots_json, $locations_json, sanitize($activity_content)]);
        $newId = (int)$db->lastInsertId();
        success_response(['id' => $newId, 'share_token' => $share_token], 'สร้างแผนแล้ว', 201);
        break;

    case 'PUT':
    case 'PATCH':
        if ($id <= 0) error_response('Invalid ID');
        $stmt = $db->prepare("SELECT id FROM itinerary_plans WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        if (!$stmt->fetch()) error_response('ไม่พบแผน', 404);
        $data = get_json_body();
        $updates = []; $params = [];
        if (isset($data['title'])) { $updates[] = 'title = ?'; $params[] = sanitize(trim($data['title'])); }
        if (array_key_exists('description', $data)) { $updates[] = 'description = ?'; $params[] = sanitize(trim($data['description'] ?? '')); }
        if (array_key_exists('trip_date_start', $data)) { $updates[] = 'trip_date_start = ?'; $params[] = !empty($data['trip_date_start']) ? sanitize($data['trip_date_start']) : null; }
        if (array_key_exists('trip_date_end', $data)) { $updates[] = 'trip_date_end = ?'; $params[] = !empty($data['trip_date_end']) ? sanitize($data['trip_date_end']) : null; }
        if (array_key_exists('location', $data)) { $updates[] = 'location = ?'; $params[] = !empty($data['location']) ? sanitize($data['location']) : null; }
        if (isset($data['is_public'])) {
            $is_public = (int)$data['is_public'];
            $updates[] = 'is_public = ?'; $params[] = $is_public;
            $newToken = null;
            if ($is_public) {
                $t = $db->prepare("SELECT share_token FROM itinerary_plans WHERE id = ?");
                $t->execute([$id]);
                $row = $t->fetch();
                $newToken = !empty($row['share_token']) ? $row['share_token'] : bin2hex(random_bytes(16));
            }
            $updates[] = 'share_token = ?'; $params[] = $newToken;
        }
        if (isset($data['items']) && is_array($data['items'])) {
            $updates[] = 'items_json = ?'; $params[] = json_encode($data['items'], JSON_UNESCAPED_UNICODE);
        }
        if (isset($data['time_slots']) && is_array($data['time_slots'])) {
            $updates[] = 'time_slots_json = ?'; $params[] = json_encode($data['time_slots'], JSON_UNESCAPED_UNICODE);
        }
        if (isset($data['locations']) && is_array($data['locations'])) {
            $updates[] = 'locations_json = ?'; $params[] = json_encode($data['locations'], JSON_UNESCAPED_UNICODE);
        }
        if (array_key_exists('activity_content', $data)) {
            $updates[] = 'activity_content = ?'; $params[] = sanitize(trim($data['activity_content'] ?? ''));
        }
        if (empty($updates)) error_response('ไม่มีข้อมูลที่จะอัปเดต');
        $params[] = $id;
        $db->prepare("UPDATE itinerary_plans SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
        success_response(['id' => $id], 'อัปเดตแล้ว');
        break;

    case 'DELETE':
        if ($id <= 0) error_response('Invalid ID');
        $stmt = $db->prepare("DELETE FROM itinerary_plans WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        if ($stmt->rowCount() === 0) error_response('ไม่พบแผน', 404);
        success_response(null, 'ลบแล้ว');
        break;

    default:
        error_response('Method not allowed', 405);
}
