<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

if ($method === 'PUT' && is_numeric($action)) {
    $boat_id = (int)$action;
    $sub = $segments[1] ?? '';
    if ($sub === 'schedules') {
        handleUpdateBoatSchedules($db, $boat_id);
    } elseif ($sub === 'pier') {
        handleUpdateBoatPier($db, $boat_id);
    } else {
        error_response('Invalid endpoint', 404);
    }
} elseif ($method === 'GET') {
    if ($action === 'recommended') {
        handleRecommended($db);
    } elseif ($action === 'search') {
        handleSearch($db);
    } elseif ($action === 'map') {
        handleMapBoats($db);
    } elseif (is_numeric($action)) {
        $boat_id = (int)$action;
        $sub = $segments[1] ?? '';
        if ($sub === 'reviews') {
            handleBoatReviews($db, $boat_id);
        } elseif ($sub === 'schedules') {
            handleBoatSchedules($db, $boat_id);
        } else {
            handleBoatDetail($db, $boat_id);
        }
    } elseif ($action === '' || $action === '/') {
        handleListBoats($db);
    } else {
        error_response('Invalid tours endpoint', 404);
    }
} else {
    error_response('Method not allowed', 405);
}

function getExtraColumns(PDO $db): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $boat_cols = [];
    $dest_cols = [];
    try {
        $stmt = $db->query("SHOW COLUMNS FROM boats");
        foreach ($stmt->fetchAll() as $row) $boat_cols[$row['Field']] = true;
        $stmt = $db->query("SHOW COLUMNS FROM destinations");
        foreach ($stmt->fetchAll() as $row) $dest_cols[$row['Field']] = true;
    } catch (Exception $e) {}
    $extra_b = '';
    $extra_d = '';
    $try_b = ['name_en','name_zh','name_ko','name_fr','description_zh','description_ko','description_fr','route_zh','route_ko','route_fr','latitude','longitude','pier_name','pier_name_th','pier_latitude','pier_longitude','default_time_slots'];
    foreach ($try_b as $c) {
        if (isset($boat_cols[$c])) $extra_b .= ', b.' . $c;
    }
    $try_d = ['name_en','name_zh','name_ko','name_fr'];
    foreach ($try_d as $c) {
        if (isset($dest_cols[$c])) $extra_d .= ', d.' . $c . ' AS destination_' . $c;
    }
    $cache = ['boat' => $extra_b, 'dest' => $extra_d, 'boat_cols' => $boat_cols, 'dest_cols' => $dest_cols];
    return $cache;
}

function buildBoatBaseQuery(PDO $db = null): string {
    $extra_b = '';
    $extra_d = '';
    if ($db) {
        $ex = getExtraColumns($db);
        $extra_b = $ex['boat'];
        $extra_d = $ex['dest'];
    }
    return "SELECT b.id, b.name, b.slug, b.boat_type, b.capacity, b.price, b.duration,
                   b.description, b.description_th,
                   b.route, b.route_th,
                   b.highlights, b.river, b.status, b.featured,
                   b.operator_id, b.destination_id
                   {$extra_b},
                   d.name AS destination_name, d.name_th AS destination_name_th
                   {$extra_d},
                   d.slug AS destination_slug, d.province, d.country, d.latitude AS destination_lat, d.longitude AS destination_lng,
                   o.company_name AS operator_name,
                   COALESCE(rev.avg_rating, 0) AS avg_rating,
                   COALESCE(rev.review_count, 0) AS review_count,
                   bi.image_url AS primary_image
            FROM boats b
            LEFT JOIN destinations d ON b.destination_id = d.id
            LEFT JOIN operators o ON b.operator_id = o.id
            LEFT JOIN (
                SELECT boat_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
                FROM reviews WHERE status = 'approved' GROUP BY boat_id
            ) rev ON b.id = rev.boat_id
            LEFT JOIN (
                SELECT boat_id, image_url
                FROM boat_images WHERE is_primary = 1
            ) bi ON b.id = bi.boat_id";
}

function enrichBoatWithImages(PDO $db, array &$boat): void {
    $stmt = $db->prepare(
        "SELECT id, image_url, alt_text, sort_order, is_primary
         FROM boat_images WHERE boat_id = ? ORDER BY sort_order"
    );
    $stmt->execute([$boat['id']]);
    $boat['images'] = $stmt->fetchAll();
}

function handleListBoats(PDO $db): void {
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    $where = ["b.status = 'active'", "(o.status = 'approved' OR o.status IS NULL)"];
    $params = [];

    if ($search = get_param('search')) {
        $where[] = "(b.name LIKE ? OR b.description LIKE ? OR b.description_th LIKE ? OR d.name LIKE ? OR d.name_th LIKE ? OR d.province LIKE ?)";
        $s = "%{$search}%";
        $params = array_merge($params, [$s, $s, $s, $s, $s, $s]);
    }
    if ($destination_id = get_param('destination_id')) {
        $where[] = "b.destination_id = ?";
        $params[] = (int)$destination_id;
    }
    if ($boat_type = get_param('boat_type')) {
        $where[] = "b.boat_type = ?";
        $params[] = $boat_type;
    }
    if ($min_price = get_param('min_price')) {
        $where[] = "b.price >= ?";
        $params[] = (float)$min_price;
    }
    if ($max_price = get_param('max_price')) {
        $where[] = "b.price <= ?";
        $params[] = (float)$max_price;
    }
    if ($duration = get_param('duration')) {
        $where[] = "b.duration <= ?";
        $params[] = (int)$duration;
    }
    if ($river = get_param('river')) {
        $where[] = "b.river = ?";
        $params[] = $river;
    }
    if ($province = get_param('province')) {
        $where[] = "(d.province LIKE ? OR d.name LIKE ? OR d.name_th LIKE ?)";
        $p = "%{$province}%";
        $params = array_merge($params, [$p, $p, $p]);
    }

    $where_sql = implode(' AND ', $where);

    $sort_map = [
        'price_asc'  => 'b.price ASC',
        'price_desc' => 'b.price DESC',
        'rating'     => 'avg_rating DESC',
        'newest'     => 'b.id DESC',
        'popular'    => 'review_count DESC',
    ];
    $sort = $sort_map[get_param('sort_by', 'newest')] ?? 'b.id DESC';

    try {
        $count_stmt = $db->prepare(
            "SELECT COUNT(DISTINCT b.id) AS total
             FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN operators o ON b.operator_id = o.id
             WHERE {$where_sql}"
        );
        $count_stmt->execute($params);
        $total = (int)$count_stmt->fetch()['total'];

        $sql = buildBoatBaseQuery($db) . " WHERE {$where_sql} ORDER BY {$sort} LIMIT ? OFFSET ?";
        $q_params = array_merge($params, [$limit, $offset]);

        $stmt = $db->prepare($sql);
        $stmt->execute($q_params);
        $boats = $stmt->fetchAll();

        foreach ($boats as &$boat) {
            enrichBoatWithImages($db, $boat);
        }

        success_response([
            'tours' => $boats,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch tours: ' . $e->getMessage(), 500);
    }
}

function handleBoatDetail(PDO $db, int $id): void {
    try {
        $sql = buildBoatBaseQuery($db) . " WHERE b.id = ? AND b.status = 'active' AND (o.status = 'approved' OR o.status IS NULL)";
        $stmt = $db->prepare($sql);
        $stmt->execute([$id]);
        $boat = $stmt->fetch();

        if (!$boat) {
            error_response('Tour not found', 404);
        }

        enrichBoatWithImages($db, $boat);

        $stmt = $db->prepare(
            "SELECT id, date, time_slot, max_seats, booked_seats, is_available, price_override
             FROM availability
             WHERE boat_id = ? AND is_available = 1 AND date >= CURDATE()
             ORDER BY date, time_slot LIMIT 30"
        );
        $stmt->execute([$id]);
        $boat['schedules'] = $stmt->fetchAll();

        $stmt = $db->prepare(
            "SELECT r.id, r.rating, r.comment, r.created_at,
                    u.name AS user_name, u.profile_image AS user_image
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.boat_id = ? AND r.status = 'approved'
             ORDER BY r.created_at DESC LIMIT 5"
        );
        $stmt->execute([$id]);
        $boat['recent_reviews'] = $stmt->fetchAll();

        $stmt = $db->prepare(
            "SELECT o.id, o.company_name, o.description, o.logo, o.contact_phone
             FROM operators o WHERE o.id = ?"
        );
        $stmt->execute([$boat['operator_id']]);
        $boat['operator'] = $stmt->fetch() ?: null;

        try {
            $stmt = $db->prepare(
                "SELECT id, name_th, name_en, name_zh, name_ko, name_fr,
                        description_th, description_en, price, icon, sort_order
                 FROM addons
                 WHERE boat_id = ? AND is_active = 1
                 ORDER BY sort_order ASC"
            );
            $stmt->execute([$id]);
            $boat['addons'] = $stmt->fetchAll();
        } catch (Exception $e) {
            $boat['addons'] = [];
        }

        $auth = get_auth_user();
        $boat['is_favorited'] = false;
        if ($auth) {
            $stmt = $db->prepare("SELECT id FROM favorites WHERE user_id = ? AND boat_id = ?");
            $stmt->execute([$auth['user_id'], $id]);
            $boat['is_favorited'] = (bool)$stmt->fetch();
        }

        success_response($boat);
    } catch (PDOException $e) {
        error_response('Failed to fetch tour: ' . $e->getMessage(), 500);
    }
}

function handleBoatReviews(PDO $db, int $boat_id): void {
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    try {
        $count_stmt = $db->prepare(
            "SELECT COUNT(*) AS total FROM reviews WHERE boat_id = ? AND status = 'approved'"
        );
        $count_stmt->execute([$boat_id]);
        $total = (int)$count_stmt->fetch()['total'];

        $stmt = $db->prepare(
            "SELECT r.id, r.rating, r.comment, r.created_at,
                    u.name AS user_name, u.profile_image AS user_image
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.boat_id = ? AND r.status = 'approved'
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$boat_id, $limit, $offset]);
        $reviews = $stmt->fetchAll();

        success_response([
            'reviews' => $reviews,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch reviews: ' . $e->getMessage(), 500);
    }
}

function handleBoatSchedules(PDO $db, int $boat_id): void {
    $date = get_param('date', date('Y-m-d'));

    try {
        $stmt = $db->prepare(
            "SELECT id, time_slot, max_seats, booked_seats,
                    (max_seats - booked_seats) AS remaining_seats,
                    is_available, price_override
             FROM availability
             WHERE boat_id = ? AND date = ? AND is_available = 1
             ORDER BY time_slot"
        );
        $stmt->execute([$boat_id, $date]);
        $schedules = $stmt->fetchAll();

        if (empty($schedules)) {
            $boat_stmt = $db->prepare("SELECT capacity, default_time_slots FROM boats WHERE id = ?");
            $boat_stmt->execute([$boat_id]);
            $boat_row = $boat_stmt->fetch();
            $cap = $boat_row ? (int)($boat_row['capacity'] ?? 20) : 20;

            $default_slots = ['09:00', '13:00', '16:00'];
            if (!empty($boat_row['default_time_slots'])) {
                $parsed = json_decode($boat_row['default_time_slots'], true);
                if (is_array($parsed) && count($parsed) > 0) {
                    $default_slots = $parsed;
                }
            }

            foreach ($default_slots as $slot) {
                $ins = $db->prepare(
                    "INSERT INTO availability (boat_id, date, time_slot, max_seats, booked_seats, is_available)
                     VALUES (?, ?, ?, ?, 0, 1)"
                );
                $ins->execute([$boat_id, $date, $slot, $cap]);
            }

            $stmt->execute([$boat_id, $date]);
            $schedules = $stmt->fetchAll();
        }

        success_response([
            'date' => $date,
            'schedules' => $schedules
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch schedules: ' . $e->getMessage(), 500);
    }
}

function handleRecommended(PDO $db): void {
    $limit = get_limit(10);

    try {
        // แสดงเรือ active ทั้งหมด (ไม่จำกัดเฉพาะ featured) เรียง featured ก่อน แล้วตามด้วย rating
        $sql = buildBoatBaseQuery($db) .
            " WHERE b.status = 'active' AND (o.status = 'approved' OR o.status IS NULL)
              ORDER BY COALESCE(b.featured, 0) DESC, avg_rating DESC, review_count DESC, b.id DESC
              LIMIT ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$limit]);
        $boats = $stmt->fetchAll();

        foreach ($boats as &$boat) {
            enrichBoatWithImages($db, $boat);
        }

        success_response($boats);
    } catch (PDOException $e) {
        error_response('Failed to fetch recommended tours: ' . $e->getMessage(), 500);
    }
}

function handleSearch(PDO $db): void {
    $keyword = get_param('q', '');
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    if (empty($keyword)) {
        error_response('Search keyword (q) is required');
    }

    $like = "%{$keyword}%";

    try {
        $ex = getExtraColumns($db);
        $bc = $ex['boat_cols'];
        $dc = $ex['dest_cols'];
        $conds = ['b.name LIKE ?', 'b.description LIKE ?', 'b.description_th LIKE ?', 'd.name LIKE ?', 'd.name_th LIKE ?', 'd.province LIKE ?', 'b.boat_type LIKE ?'];
        foreach (['name_en','name_zh','name_ko','name_fr'] as $c) {
            if (isset($bc[$c])) $conds[] = "b.{$c} LIKE ?";
            if (isset($dc[$c])) $conds[] = "d.{$c} LIKE ?";
        }
        $search_cond = '(' . implode(' OR ', $conds) . ')';
        $search_params = array_fill(0, count($conds), $like);

        $count_stmt = $db->prepare(
            "SELECT COUNT(*) AS total FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN operators o ON b.operator_id = o.id
             WHERE b.status = 'active' AND (o.status = 'approved' OR o.status IS NULL) AND {$search_cond}"
        );
        $count_stmt->execute($search_params);
        $total = (int)$count_stmt->fetch()['total'];

        $sql = buildBoatBaseQuery($db) .
            " WHERE b.status = 'active' AND (o.status = 'approved' OR o.status IS NULL) AND {$search_cond}
              ORDER BY avg_rating DESC
              LIMIT ? OFFSET ?";
        $stmt = $db->prepare($sql);
        $stmt->execute(array_merge($search_params, [$limit, $offset]));
        $boats = $stmt->fetchAll();

        foreach ($boats as &$boat) {
            enrichBoatWithImages($db, $boat);
        }

        success_response([
            'tours' => $boats,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Search failed: ' . $e->getMessage(), 500);
    }
}

function handleMapBoats(PDO $db): void {
    try {
        $ex = getExtraColumns($db);
        $bc = $ex['boat_cols'];
        $dc = $ex['dest_cols'];
        $extra_b = '';
        foreach (['name_en','name_zh','name_ko','name_fr'] as $c) {
            if (isset($bc[$c])) $extra_b .= ', b.' . $c;
        }
        $extra_d = '';
        foreach (['name_en'] as $c) {
            if (isset($dc[$c])) $extra_d .= ', d.' . $c . ' AS destination_' . $c;
        }
        $lat_parts = [];
        $lng_parts = [];
        if (isset($bc['latitude'])) $lat_parts[] = 'b.latitude';
        if (isset($bc['pier_latitude'])) $lat_parts[] = 'b.pier_latitude';
        $lat_parts[] = 'd.latitude';
        if (isset($bc['longitude'])) $lng_parts[] = 'b.longitude';
        if (isset($bc['pier_longitude'])) $lng_parts[] = 'b.pier_longitude';
        $lng_parts[] = 'd.longitude';
        $lat_expr = 'COALESCE(' . implode(', ', $lat_parts) . ')';
        $lng_expr = 'COALESCE(' . implode(', ', $lng_parts) . ')';
        $where_coords = "({$lat_expr} IS NOT NULL AND {$lng_expr} IS NOT NULL)";
        $stmt = $db->prepare(
            "SELECT b.id, b.name{$extra_b},
                    {$lat_expr} AS latitude,
                    {$lng_expr} AS longitude,
                    b.price, b.boat_type,
                    d.name AS destination_name, d.name_th AS destination_name_th
                    {$extra_d},
                    bi.image_url AS primary_image
             FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN operators o ON b.operator_id = o.id
             LEFT JOIN (
                 SELECT boat_id, image_url
                 FROM boat_images WHERE is_primary = 1
             ) bi ON b.id = bi.boat_id
             WHERE b.status = 'active'
               AND (o.status = 'approved' OR o.status IS NULL)
               AND ({$where_coords})
             ORDER BY b.name ASC"
        );
        $stmt->execute();
        $boats = $stmt->fetchAll();
        $boats = array_filter($boats, function ($row) {
            return !empty($row['latitude']) && !empty($row['longitude']);
        });

        success_response(array_values($boats));
    } catch (PDOException $e) {
        error_response('Failed to fetch map data: ' . $e->getMessage(), 500);
    }
}

function verifyBoatOwner(PDO $db, int $boat_id, array $auth): array {
    $stmt = $db->prepare("SELECT * FROM boats WHERE id = ?");
    $stmt->execute([$boat_id]);
    $boat = $stmt->fetch();
    if (!$boat) error_response('Boat not found', 404);
    if ($auth['role'] === 'admin') return $boat;
    $stmt = $db->prepare("SELECT id FROM operators WHERE id = ? AND user_id = ?");
    $stmt->execute([$boat['operator_id'], $auth['user_id']]);
    if (!$stmt->fetch()) error_response('Forbidden', 403);
    return $boat;
}

function handleUpdateBoatSchedules(PDO $db, int $boat_id): void {
    $auth = require_auth();
    if ($auth['role'] !== 'admin' && $auth['role'] !== 'operator') {
        error_response('Forbidden', 403);
    }
    $boat = verifyBoatOwner($db, $boat_id, $auth);
    $data = get_json_body();

    $time_slots = $data['time_slots'] ?? null;
    if (!is_array($time_slots) || count($time_slots) === 0) {
        error_response('time_slots array is required (e.g. ["09:00","13:00","16:00"])');
    }

    foreach ($time_slots as $slot) {
        if (!preg_match('/^\d{2}:\d{2}$/', $slot)) {
            error_response("Invalid time format: {$slot}. Use HH:MM");
        }
    }

    try {
        $json = json_encode(array_values($time_slots));
        $stmt = $db->prepare("UPDATE boats SET default_time_slots = ? WHERE id = ?");
        $stmt->execute([$json, $boat_id]);

        success_response([
            'boat_id' => $boat_id,
            'default_time_slots' => array_values($time_slots)
        ], 'Time slots updated');
    } catch (PDOException $e) {
        error_response('Failed: ' . $e->getMessage(), 500);
    }
}

function handleUpdateBoatPier(PDO $db, int $boat_id): void {
    $auth = require_auth();
    if ($auth['role'] !== 'admin' && $auth['role'] !== 'operator') {
        error_response('Forbidden', 403);
    }
    $boat = verifyBoatOwner($db, $boat_id, $auth);
    $data = get_json_body();

    $sets = [];
    $vals = [];
    $allowed = ['pier_name', 'pier_name_th', 'pier_latitude', 'pier_longitude'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $data)) {
            $sets[] = "{$f} = ?";
            $vals[] = $data[$f];
        }
    }
    if (empty($sets)) error_response('No pier fields provided');

    try {
        $vals[] = $boat_id;
        $db->prepare("UPDATE boats SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
        success_response(['boat_id' => $boat_id], 'Pier info updated');
    } catch (PDOException $e) {
        error_response('Failed: ' . $e->getMessage(), 500);
    }
}
