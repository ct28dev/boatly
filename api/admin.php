<?php

require_once __DIR__ . '/../includes/base_path.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

// Auto-migrate: admin_permissions + staff role
try {
    $db->query("SELECT 1 FROM admin_permissions LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'admin_permissions') !== false || strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE admin_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                module VARCHAR(50) NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                UNIQUE KEY uk_user_module (user_id, module),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}
try {
    $cols = $db->query("SHOW COLUMNS FROM users WHERE Field = 'role'")->fetch();
    if ($cols && strpos($cols['Type'], 'staff') === false) {
        $db->exec("ALTER TABLE users MODIFY role ENUM('customer','operator','admin','staff') DEFAULT 'customer'");
    }
} catch (PDOException $e) {}

if ($action === 'staff') {
    $auth = require_role('admin');
} else {
    $auth = require_admin_or_staff($db, $action ?: 'dashboard');
}

// Auto-migrate: add operator document columns if missing
try {
    $db->query("SELECT doc_boat_license FROM operators LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'doc_boat_license') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        try {
            $db->exec("ALTER TABLE operators ADD COLUMN doc_boat_license VARCHAR(500) NULL");
            $db->exec("ALTER TABLE operators ADD COLUMN doc_boat_permit VARCHAR(500) NULL");
            $db->exec("ALTER TABLE operators ADD COLUMN doc_insurance VARCHAR(500) NULL");
            $db->exec("ALTER TABLE operators ADD COLUMN doc_other TEXT NULL");
        } catch (PDOException $e2) {}
    }
}

// Auto-migrate: add boat document columns if missing (for multi-boat partners)
try {
    $db->query("SELECT doc_boat_permit FROM boats LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'doc_boat_permit') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        try {
            $db->exec("ALTER TABLE boats ADD COLUMN doc_boat_permit VARCHAR(500) NULL");
            $db->exec("ALTER TABLE boats ADD COLUMN doc_insurance VARCHAR(500) NULL");
        } catch (PDOException $e2) {}
    }
}

// Auto-migrate: boat_types table
try {
    $db->query("SELECT 1 FROM boat_types LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE boat_types (id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(50) NOT NULL UNIQUE, name_th VARCHAR(100) NOT NULL, name_en VARCHAR(100) NOT NULL, is_active TINYINT DEFAULT 1, sort_order INT DEFAULT 0, created_at DATETIME DEFAULT NOW(), updated_at DATETIME DEFAULT NOW() ON UPDATE NOW())");
            $seeds = [['longtail','เรือหางยาว','Longtail',1],['speedboat','สปีดโบ๊ท','Speedboat',2],['yacht','เรือยอร์ช','Yacht',3],['catamaran','เรือคาตามารัน','Catamaran',4],['ferry','เรือเฟอร์รี่','Ferry',5],['cruise','เรือสำราญ','Cruise',6],['houseboat','เรือบ้าน','Houseboat',7],['kayak','เรือคายัค','Kayak',8],['canoe','เรือแคนู','Canoe',9],['sailboat','เรือใบ','Sailboat',10],['dinghy','เรือดิงกี้','Dinghy',11],['pontoon','เรือพอนทูน','Pontoon',12],['jet_ski','เจ็ทสกี','Jet Ski',13],['traditional','เรือแบบดั้งเดิม','Traditional Boat',14],['other','อื่นๆ','Other',15]];
            $ins = $db->prepare("INSERT INTO boat_types (slug, name_th, name_en, sort_order) VALUES (?, ?, ?, ?)");
            foreach ($seeds as $s) $ins->execute($s);
        } catch (PDOException $e2) {}
    }
}

// Auto-migrate: site_content, feedback_submissions
try {
    $db->query("SELECT 1 FROM site_content LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE site_content (id INT AUTO_INCREMENT PRIMARY KEY, content_type ENUM('feedback_intro','help_item','announcement') NOT NULL, title_th VARCHAR(255) NULL, title_en VARCHAR(255) NULL, body_th TEXT NULL, body_en TEXT NULL, sort_order INT DEFAULT 0, is_active TINYINT DEFAULT 1, created_at DATETIME DEFAULT NOW(), updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM feedback_submissions LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE feedback_submissions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, message TEXT NOT NULL, created_at DATETIME DEFAULT NOW()) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}

// Auto-migrate: add pier coordinates if missing
try {
    $db->query("SELECT pier_latitude FROM boats LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'pier_latitude') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        try {
            $db->exec("ALTER TABLE boats ADD COLUMN pier_latitude DECIMAL(10,8) NULL");
            $db->exec("ALTER TABLE boats ADD COLUMN pier_longitude DECIMAL(11,8) NULL");
        } catch (PDOException $e2) {}
    }
}

switch ($action) {
    case 'dashboard':
        handleDashboard($db);
        break;
    case 'destinations':
        handleAdminDestinations($db, $method, $segments);
        break;
    case 'bookings':
        handleAdminBookings($db, $method, $segments);
        break;
    case 'tours':
    case 'boats':
        handleAdminTours($db, $method, $segments);
        break;
    case 'providers':
        handleAdminProviders($db, $method, $segments);
        break;
    case 'reviews':
        handleAdminReviews($db, $method, $segments);
        break;
    case 'finance':
        handleAdminFinance($db);
        break;
    case 'users':
        handleAdminUsers($db);
        break;
    case 'staff':
        handleAdminStaff($db, $method, $segments);
        break;
    case 'boat-types':
        handleAdminBoatTypes($db, $method, $segments);
        break;
    case 'cms':
        handleAdminCms($db, $method, $segments);
        break;
    case 'feedback-submissions':
        handleAdminFeedbackSubmissions($db, $method, $segments);
        break;
    default:
        error_response('Invalid admin endpoint', 404);
}

function handleDashboard(PDO $db): void {
    try {
        $revenue = $db->prepare(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'"
        );
        $revenue->execute();
        $total_revenue = (float)$revenue->fetch()['total'];

        $bookings = $db->prepare("SELECT COUNT(*) AS c FROM bookings");
        $bookings->execute();
        $total_bookings = (int)$bookings->fetch()['c'];

        $boats = $db->prepare("SELECT COUNT(*) AS c FROM boats WHERE status = 'active'");
        $boats->execute();
        $active_boats = (int)$boats->fetch()['c'];

        $users = $db->prepare("SELECT COUNT(*) AS c FROM users");
        $users->execute();
        $total_users = (int)$users->fetch()['c'];

        $recent = $db->prepare(
            "SELECT bk.id, bk.booking_ref, bk.booking_date, bk.time_slot,
                    bk.total_amount, bk.status, bk.created_at,
                    u.name AS user_name,
                    bt.name AS boat_name
             FROM bookings bk
             JOIN users u ON bk.user_id = u.id
             JOIN boats bt ON bk.boat_id = bt.id
             ORDER BY bk.created_at DESC LIMIT 10"
        );
        $recent->execute();
        $recent_bookings = $recent->fetchAll();

        $monthly = $db->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                    COALESCE(SUM(amount), 0) AS revenue
             FROM payments WHERE status = 'paid'
             GROUP BY month ORDER BY month DESC LIMIT 12"
        );
        $monthly->execute();
        $monthly_revenue = $monthly->fetchAll();

        $status_counts = $db->prepare(
            "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status"
        );
        $status_counts->execute();
        $booking_stats = [];
        foreach ($status_counts->fetchAll() as $row) {
            $booking_stats[$row['status']] = (int)$row['count'];
        }

        success_response([
            'total_revenue'   => $total_revenue,
            'total_bookings'  => $total_bookings,
            'active_tours'    => $active_boats,
            'total_users'     => $total_users,
            'booking_stats'   => $booking_stats,
            'recent_bookings' => $recent_bookings,
            'monthly_revenue' => $monthly_revenue
        ]);
    } catch (PDOException $e) {
        error_response('Dashboard failed: ' . $e->getMessage(), 500);
    }
}

function handleAdminBookings(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        $page = get_page();
        $limit = get_limit();
        $offset = ($page - 1) * $limit;

        $where = ['1=1'];
        $params = [];

        if ($status = get_param('status')) {
            $where[] = 'bk.status = ?';
            $params[] = $status;
        }
        if ($date_from = get_param('date_from')) {
            $where[] = 'bk.booking_date >= ?';
            $params[] = $date_from;
        }
        if ($date_to = get_param('date_to')) {
            $where[] = 'bk.booking_date <= ?';
            $params[] = $date_to;
        }
        if ($search = get_param('search')) {
            $where[] = '(u.name LIKE ? OR u.email LIKE ? OR bt.name LIKE ? OR bk.booking_ref LIKE ? OR o.company_name LIKE ?)';
            $s = "%{$search}%";
            $params = array_merge($params, [$s, $s, $s, $s, $s]);
        }
        if ($operator_id = get_param('operator_id')) {
            if ($operator_id === 'null' || $operator_id === 'none') {
                $where[] = 'bt.operator_id IS NULL';
            } else {
                $where[] = 'bt.operator_id = ?';
                $params[] = (int)$operator_id;
            }
        }

        $where_sql = implode(' AND ', $where);

        try {
            $count = $db->prepare(
                "SELECT COUNT(*) AS total
                 FROM bookings bk
                 JOIN users u ON bk.user_id = u.id
                 JOIN boats bt ON bk.boat_id = bt.id
                 LEFT JOIN operators o ON bt.operator_id = o.id
                 WHERE {$where_sql}"
            );
            $count->execute($params);
            $total = (int)$count->fetch()['total'];

            $q_params = array_merge($params, [$limit, $offset]);
            $stmt = $db->prepare(
                "SELECT bk.id, bk.booking_ref, bk.booking_date, bk.time_slot,
                        bk.passengers, bk.customer_name, bk.customer_email,
                        bk.customer_phone, bk.total_amount, bk.status, bk.created_at,
                        u.name AS user_name, u.email AS user_email,
                        bt.name AS boat_name, bt.boat_type,
                        d.name AS destination_name,
                        o.id AS operator_id, o.company_name AS operator_name,
                        pay.status AS payment_status, pay.method AS payment_method
                 FROM bookings bk
                 JOIN users u ON bk.user_id = u.id
                 JOIN boats bt ON bk.boat_id = bt.id
                 LEFT JOIN destinations d ON bk.destination_id = d.id
                 LEFT JOIN operators o ON bt.operator_id = o.id
                 LEFT JOIN payments pay ON bk.id = pay.booking_id
                 WHERE {$where_sql}
                 ORDER BY o.company_name ASC, bk.created_at DESC
                 LIMIT ? OFFSET ?"
            );
            $stmt->execute($q_params);

            success_response([
                'bookings'   => $stmt->fetchAll(),
                'pagination' => pagination_meta($total, $page, $limit)
            ]);
        } catch (PDOException $e) {
            error_response('Failed to fetch bookings: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])
              && isset($segments[2]) && $segments[2] === 'status') {
        $booking_id = (int)$segments[1];
        $data = get_json_body();
        $new_status = sanitize($data['status'] ?? '');

        $valid = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!in_array($new_status, $valid)) {
            error_response('Invalid status. Valid: ' . implode(', ', $valid));
        }

        try {
            $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([$new_status, $booking_id]);

            if ($stmt->rowCount() === 0) {
                error_response('Booking not found', 404);
            }

            success_response(['id' => $booking_id, 'status' => $new_status], 'Booking status updated');
        } catch (PDOException $e) {
            error_response('Failed to update booking: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin bookings endpoint', 404);
    }
}

function handleAdminTours(PDO $db, string $method, array $segments): void {
    // Boat document upload (per-boat docs for multi-boat partners)
    if ($method === 'POST' && isset($segments[1]) && is_numeric($segments[1]) && ($segments[2] ?? '') === 'upload-doc') {
        $boat_id = (int)$segments[1];
        $doc_type = sanitize($_POST['doc_type'] ?? '');
        $allowed = ['boat_permit', 'insurance'];
        if (!in_array($doc_type, $allowed)) error_response('Invalid doc_type (use boat_permit or insurance)');
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            error_response('No file uploaded or upload error');
        }
        $file = $_FILES['file'];
        $allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($file['type'], $allowed_mimes) && !in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'])) {
            error_response('Allowed: JPG, PNG, GIF, WebP, PDF (max 10MB)');
        }
        if ($file['size'] > 10 * 1024 * 1024) error_response('File too large (max 10MB)');
        $uploadDir = dirname(__DIR__) . '/uploads/boats/' . $boat_id . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $filename = 'doc_' . $doc_type . '_' . time() . '.' . ($ext ?: 'pdf');
        $path = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            error_response('Failed to save file');
        }
        $relativePath = 'uploads/boats/' . $boat_id . '/' . $filename;
        $col = 'doc_' . $doc_type;
        try {
            $stmt = $db->prepare("UPDATE boats SET {$col} = ? WHERE id = ?");
            $stmt->execute([$relativePath, $boat_id]);
            if ($stmt->rowCount() === 0) error_response('Boat not found', 404);
        } catch (PDOException $e) {
            error_response('Failed to save: ' . $e->getMessage());
        }
        success_response(['path' => $relativePath, 'url' => app_base_path() . '/' . $relativePath], 'Document uploaded', 201);
        return;
    }
    if ($method === 'GET') {
        $page = get_page();
        $limit = get_limit();
        $offset = ($page - 1) * $limit;

        try {
            $count = $db->prepare("SELECT COUNT(*) AS total FROM boats");
            $count->execute();
            $total = (int)$count->fetch()['total'];

            $stmt = $db->prepare(
                "SELECT bt.id, bt.name, bt.slug, bt.boat_type, bt.capacity,
                        bt.price, bt.duration, bt.description, bt.river, bt.status, bt.featured,
                        bt.destination_id, bt.operator_id, bt.pier_name,
                        bt.pier_latitude, bt.pier_longitude,
                        bt.doc_boat_permit, bt.doc_insurance,
                        d.name AS destination_name, d.province,
                        o.company_name AS operator_name,
                        bi.image_url AS primary_image,
                        COALESCE(rev.avg_rating, 0) AS avg_rating,
                        COALESCE(rev.review_count, 0) AS review_count,
                        COALESCE(bk.booking_count, 0) AS booking_count
                 FROM boats bt
                 LEFT JOIN destinations d ON bt.destination_id = d.id
                 LEFT JOIN operators o ON bt.operator_id = o.id
                 LEFT JOIN boat_images bi ON bt.id = bi.boat_id AND bi.is_primary = 1
                 LEFT JOIN (
                    SELECT boat_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
                    FROM reviews WHERE status = 'approved' GROUP BY boat_id
                 ) rev ON bt.id = rev.boat_id
                 LEFT JOIN (
                    SELECT boat_id, COUNT(*) AS booking_count
                    FROM bookings WHERE status != 'cancelled' GROUP BY boat_id
                 ) bk ON bt.id = bk.boat_id
                 ORDER BY bt.id DESC
                 LIMIT ? OFFSET ?"
            );
            $stmt->execute([$limit, $offset]);

            success_response([
                'tours'      => $stmt->fetchAll(),
                'pagination' => pagination_meta($total, $page, $limit)
            ]);
        } catch (PDOException $e) {
            error_response('Failed to fetch tours: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'POST') {
        $data = get_json_body();

        $name = trim($data['name'] ?? '');
        $price = (float)($data['price'] ?? 0);
        if (empty($name)) {
            error_response('name is required');
        }
        if ($price <= 0) {
            error_response('price is required and must be a positive number');
        }

        $destination_id = isset($data['destination_id']) ? (int)$data['destination_id'] : 0;
        if ($destination_id <= 0) {
            $first = $db->query("SELECT id FROM destinations ORDER BY sort_order ASC, id ASC LIMIT 1")->fetch();
            $destination_id = $first ? (int)$first['id'] : 0;
        }
        if ($destination_id <= 0) {
            error_response('No destination available. Please run setup.php first.');
        }

        $operator_id = isset($data['operator_id']) ? (int)$data['operator_id'] : 0;
        if ($operator_id <= 0) {
            $first = $db->query("SELECT id FROM operators ORDER BY id ASC LIMIT 1")->fetch();
            $operator_id = $first ? (int)$first['id'] : 0;
        }
        if ($operator_id <= 0) {
            error_response('No operator available. Please run setup.php first.');
        }

        $durationRaw = trim($data['duration'] ?? '');
        $duration = (int)$durationRaw;
        if ($duration <= 0 && $durationRaw !== '') {
            $num = (int)preg_replace('/[^0-9]/', '', $durationRaw);
            $isHours = preg_match('/ชม|ชั่วโมง|hr|hour|h\b/i', $durationRaw);
            $duration = $isHours && $num > 0 ? $num * 60 : ($num > 0 ? $num : 120);
        }
        if ($duration <= 0) $duration = 120;

        try {
            $name = sanitize($name);
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
            $slug .= '-' . substr(uniqid(), -4);

            $capacity = (int)($data['capacity'] ?? $data['max_passengers'] ?? 20);
            if ($capacity <= 0) $capacity = 20;

            $stmt = $db->prepare(
                "INSERT INTO boats
                    (operator_id, destination_id, name, slug, boat_type, capacity,
                     price, duration, description, description_th, route, route_th,
                     highlights, river, status, featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );

            $stmt->execute([
                $operator_id,
                $destination_id,
                $name,
                $slug,
                sanitize($data['boat_type'] ?? 'longtail'),
                $capacity,
                $price,
                $duration,
                $data['description'] ?? '',
                $data['description_th'] ?? '',
                $data['route'] ?? '',
                $data['route_th'] ?? '',
                $data['highlights'] ?? null,
                sanitize($data['river'] ?? $data['location'] ?? ''),
                sanitize($data['status'] ?? 'active'),
                (int)($data['featured'] ?? 0)
            ]);

            $id = (int)$db->lastInsertId();
            $pier = trim($data['departure_pier'] ?? $data['pier'] ?? '');
            $pierLat = isset($data['pier_latitude']) ? (float)$data['pier_latitude'] : null;
            $pierLng = isset($data['pier_longitude']) ? (float)$data['pier_longitude'] : null;
            if ($pier || $pierLat !== null || $pierLng !== null) {
                try {
                    $updates = [];
                    $params = [];
                    if ($pier) { $updates[] = 'pier_name = ?, pier_name_th = ?'; $params[] = $pier; $params[] = $pier; }
                    if ($pierLat !== null) { $updates[] = 'pier_latitude = ?'; $params[] = $pierLat; }
                    if ($pierLng !== null) { $updates[] = 'pier_longitude = ?'; $params[] = $pierLng; }
                    if (!empty($updates)) {
                        $params[] = $id;
                        $db->prepare("UPDATE boats SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
                    }
                } catch (PDOException $e) {}
            }

            success_response(['id' => $id], 'Boat created', 201);
        } catch (PDOException $e) {
            error_response('Failed to create boat: ' . $e->getMessage(), 500);
        }
    } elseif (($method === 'PUT' || $method === 'POST') && isset($segments[1]) && is_numeric($segments[1])) {
        $boat_id = (int)$segments[1];
        $data = get_json_body();

        if (isset($data['max_passengers'])) $data['capacity'] = (int)$data['max_passengers'];
        if (isset($data['location'])) $data['river'] = sanitize($data['location']);

        $durationRaw = trim($data['duration'] ?? '');
        if ($durationRaw !== '') {
            $num = (int)preg_replace('/[^0-9]/', '', $durationRaw);
            $isHours = preg_match('/ชม|ชั่วโมง|hr|hour|h\b/i', $durationRaw);
            $data['duration'] = $isHours && $num > 0 ? $num * 60 : ($num > 0 ? $num : null);
        }

        $fields = [];
        $values = [];
        $allowed = ['operator_id', 'destination_id', 'name', 'slug', 'boat_type',
                     'capacity', 'price', 'duration', 'description', 'description_th',
                     'route', 'route_th', 'highlights', 'river', 'status', 'featured'];

        foreach ($allowed as $f) {
            if (isset($data[$f])) {
                $fields[] = "{$f} = ?";
                $values[] = $data[$f];
            }
        }

        if (empty($fields)) {
            error_response('No fields to update');
        }

        $values[] = $boat_id;

        try {
            $sql = "UPDATE boats SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($values);

            if ($stmt->rowCount() === 0) {
                error_response('Boat not found', 404);
            }

            $pier = trim($data['departure_pier'] ?? $data['pier'] ?? '');
            $pierLat = isset($data['pier_latitude']) ? (float)$data['pier_latitude'] : null;
            $pierLng = isset($data['pier_longitude']) ? (float)$data['pier_longitude'] : null;
            if ($pier || $pierLat !== null || $pierLng !== null) {
                try {
                    $updates = [];
                    $params = [];
                    if ($pier) { $updates[] = 'pier_name = ?, pier_name_th = ?'; $params[] = $pier; $params[] = $pier; }
                    if ($pierLat !== null) { $updates[] = 'pier_latitude = ?'; $params[] = $pierLat; }
                    if ($pierLng !== null) { $updates[] = 'pier_longitude = ?'; $params[] = $pierLng; }
                    if (!empty($updates)) {
                        $params[] = $boat_id;
                        $db->prepare("UPDATE boats SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
                    }
                } catch (PDOException $e) {}
            }

            success_response(['id' => $boat_id], 'Boat updated');
        } catch (PDOException $e) {
            error_response('Failed to update boat: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $boat_id = (int)$segments[1];
        try {
            $stmt = $db->prepare("UPDATE boats SET status = 'inactive' WHERE id = ?");
            $stmt->execute([$boat_id]);

            if ($stmt->rowCount() === 0) {
                error_response('Boat not found', 404);
            }

            success_response(null, 'Boat deactivated');
        } catch (PDOException $e) {
            error_response('Failed to delete boat: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin tours endpoint', 404);
    }
}

function handleAdminDestinations(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        if (isset($segments[1]) && is_numeric($segments[1])) {
            $id = (int)$segments[1];
            try {
                $stmt = $db->prepare("SELECT * FROM destinations WHERE id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) error_response('Destination not found', 404);
                success_response($row);
            } catch (PDOException $e) {
                error_response('Failed to fetch destination: ' . $e->getMessage(), 500);
            }
            return;
        }
        try {
            $stmt = $db->prepare(
                "SELECT id, name, name_th, slug, province, status, sort_order
                 FROM destinations ORDER BY sort_order ASC, name ASC"
            );
            $stmt->execute();
            success_response($stmt->fetchAll());
        } catch (PDOException $e) {
            error_response('Failed to fetch destinations: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $name_th = trim($data['name_th'] ?? '');
        $slug = trim($data['slug'] ?? '') ?: strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        $province = trim($data['province'] ?? '');
        $status = sanitize($data['status'] ?? 'coming_soon');
        if (!in_array($status, ['active', 'coming_soon', 'inactive'])) $status = 'coming_soon';
        $sort_order = (int)($data['sort_order'] ?? 0);
        if (empty($name)) error_response('Name is required');
        try {
            $stmt = $db->prepare("SELECT id FROM destinations WHERE slug = ?");
            $stmt->execute([$slug]);
            if ($stmt->fetch()) error_response('Slug already exists', 409);
            $stmt = $db->prepare(
                "INSERT INTO destinations (name, name_th, slug, province, status, sort_order, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([$name, $name_th ?: $name, $slug, $province, $status, $sort_order]);
            success_response(['id' => (int)$db->lastInsertId()], 'Destination created', 201);
        } catch (PDOException $e) {
            error_response('Failed to create destination: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $name_th = trim($data['name_th'] ?? '');
        $slug = trim($data['slug'] ?? '');
        $province = trim($data['province'] ?? '');
        $status = strtolower(trim($data['status'] ?? ''));
        if (!in_array($status, ['active', 'coming_soon', 'inactive'])) $status = 'coming_soon';
        $sort_order = isset($data['sort_order']) ? (int)$data['sort_order'] : 0;
        if (empty($name)) error_response('Name is required');
        try {
            $stmt = $db->prepare("SELECT id FROM destinations WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) error_response('Destination not found', 404);
            if ($slug && $slug !== '') {
                $chk = $db->prepare("SELECT id FROM destinations WHERE slug = ? AND id != ?");
                $chk->execute([$slug, $id]);
                if ($chk->fetch()) error_response('Slug already in use', 409);
            }
            $slugVal = $slug ?: strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
            $stmt = $db->prepare(
                "UPDATE destinations SET name = ?, name_th = ?, slug = ?, province = ?, status = ?, sort_order = ? WHERE id = ?"
            );
            $stmt->execute([$name, $name_th ?: $name, $slugVal, $province, $status, $sort_order, $id]);
            success_response(['id' => $id], 'Destination updated');
        } catch (PDOException $e) {
            error_response('Failed to update destination: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        try {
            $stmt = $db->prepare("SELECT id FROM destinations WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) error_response('Destination not found', 404);
            $db->prepare("DELETE FROM destinations WHERE id = ?")->execute([$id]);
            success_response(['id' => $id], 'Destination deleted');
        } catch (PDOException $e) {
            error_response('Failed to delete destination: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin destinations endpoint', 404);
    }
}

function handleAdminBoatTypes(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        try {
            $stmt = $db->prepare("SELECT id, slug, name_th, name_en, is_active, sort_order FROM boat_types ORDER BY sort_order ASC, name_th ASC");
            $stmt->execute();
            success_response($stmt->fetchAll());
        } catch (PDOException $e) {
            error_response('Failed to fetch boat types: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $slug = trim($data['slug'] ?? '') ?: strtolower(preg_replace('/[^a-z0-9_]+/i', '_', $data['name_en'] ?? ''));
        $name_th = trim($data['name_th'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        $sort_order = (int)($data['sort_order'] ?? 0);
        if (empty($name_th) || empty($name_en)) error_response('name_th และ name_en จำเป็น');
        try {
            $stmt = $db->prepare("SELECT id FROM boat_types WHERE slug = ?");
            $stmt->execute([$slug]);
            if ($stmt->fetch()) error_response('Slug ซ้ำ', 409);
            $stmt = $db->prepare("INSERT INTO boat_types (slug, name_th, name_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$slug, $name_th, $name_en, $is_active, $sort_order]);
            success_response(['id' => (int)$db->lastInsertId()], 'เพิ่มประเภทเรือแล้ว', 201);
        } catch (PDOException $e) {
            error_response('Failed: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $data = get_json_body();
        $slug = trim($data['slug'] ?? '');
        $name_th = trim($data['name_th'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
        $sort_order = isset($data['sort_order']) ? (int)$data['sort_order'] : 0;
        try {
            $stmt = $db->prepare("SELECT id FROM boat_types WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) error_response('ไม่พบประเภทเรือ', 404);
            if ($slug) {
                $chk = $db->prepare("SELECT id FROM boat_types WHERE slug = ? AND id != ?");
                $chk->execute([$slug, $id]);
                if ($chk->fetch()) error_response('Slug ซ้ำ', 409);
            }
            $stmt = $db->prepare("UPDATE boat_types SET slug = COALESCE(NULLIF(?, ''), slug), name_th = COALESCE(NULLIF(?, ''), name_th), name_en = COALESCE(NULLIF(?, ''), name_en), is_active = ?, sort_order = ? WHERE id = ?");
            $stmt->execute([$slug, $name_th, $name_en, $is_active, $sort_order, $id]);
            success_response(['id' => $id], 'อัปเดตแล้ว');
        } catch (PDOException $e) {
            error_response('Failed: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        try {
            $stmt = $db->prepare("SELECT id FROM boat_types WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) error_response('ไม่พบประเภทเรือ', 404);
            $db->prepare("UPDATE boat_types SET is_active = 0 WHERE id = ?")->execute([$id]);
            success_response(['id' => $id], 'ปิดใช้งานแล้ว');
        } catch (PDOException $e) {
            error_response('Failed: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid boat-types endpoint', 404);
    }
}

function handleAdminProviders(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        if (isset($segments[1]) && is_numeric($segments[1])) {
            $id = (int)$segments[1];
            try {
                $stmt = $db->prepare(
                    "SELECT o.id, o.company_name, o.description, o.contact_phone, o.status,
                            o.doc_boat_license, o.doc_boat_permit, o.doc_insurance, o.doc_other,
                            u.id AS user_id, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
                            (SELECT COUNT(*) FROM boats WHERE operator_id = o.id) AS boat_count
                     FROM operators o JOIN users u ON o.user_id = u.id WHERE o.id = ?"
                );
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if (!$row) error_response('Provider not found', 404);
                success_response($row);
            } catch (PDOException $e) {
                error_response('Failed to fetch provider: ' . $e->getMessage(), 500);
            }
            return;
        }
        try {
            $stmt = $db->prepare(
                "SELECT o.id, o.company_name, o.description, o.logo,
                        o.tax_id, o.bank_account, o.contact_phone, o.status,
                        u.name AS user_name, u.email AS user_email,
                        (SELECT COUNT(*) FROM boats WHERE operator_id = o.id) AS boat_count
                 FROM operators o
                 JOIN users u ON o.user_id = u.id
                 ORDER BY o.id DESC"
            );
            $stmt->execute();
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['boats_count'] = $r['boat_count'] ?? 0;
                $r['tours_count'] = $r['boat_count'] ?? 0;
            }
            success_response(['providers' => $rows]);
        } catch (PDOException $e) {
            error_response('Failed to fetch operators: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'POST' && isset($segments[1]) && is_numeric($segments[1]) && ($segments[2] ?? '') === 'upload-doc') {
        $operator_id = (int)$segments[1];
        $doc_type = sanitize($_POST['doc_type'] ?? '');
        $allowed = ['boat_license', 'boat_permit', 'insurance', 'other'];
        if (!in_array($doc_type, $allowed)) error_response('Invalid doc_type');
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            error_response('No file uploaded or upload error');
        }
        $file = $_FILES['file'];
        $allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($file['type'], $allowed_mimes) && !in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'])) {
            error_response('Allowed: JPG, PNG, GIF, WebP, PDF (max 10MB)');
        }
        if ($file['size'] > 10 * 1024 * 1024) error_response('File too large (max 10MB)');
        $uploadDir = dirname(__DIR__) . '/uploads/operators/' . $operator_id . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $filename = 'doc_' . $doc_type . '_' . time() . '.' . ($ext ?: 'pdf');
        $path = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            error_response('Failed to save file');
        }
        $relativePath = 'uploads/operators/' . $operator_id . '/' . $filename;
        $col = 'doc_' . $doc_type;
        if ($doc_type === 'other') {
            try {
                $stmt = $db->prepare("SELECT doc_other FROM operators WHERE id = ?");
                $stmt->execute([$operator_id]);
                $row = $stmt->fetch();
                $arr = $row && $row['doc_other'] ? json_decode($row['doc_other'], true) : [];
                if (!is_array($arr)) $arr = [];
                $arr[] = $relativePath;
                $stmt = $db->prepare("UPDATE operators SET doc_other = ? WHERE id = ?");
                $stmt->execute([json_encode($arr), $operator_id]);
            } catch (PDOException $e) {
                error_response('Failed to save: ' . $e->getMessage());
            }
        } else {
            try {
                $stmt = $db->prepare("UPDATE operators SET {$col} = ? WHERE id = ?");
                $stmt->execute([$relativePath, $operator_id]);
            } catch (PDOException $e) {
                error_response('Failed to save: ' . $e->getMessage());
            }
        }
        success_response(['path' => $relativePath, 'url' => app_base_path() . '/' . $relativePath], 'Document uploaded', 201);
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = sanitize($data['phone'] ?? '');
        $company = trim($data['company_name'] ?? '');
        $description = trim($data['description'] ?? '');
        $password = $data['password'] ?? '';
        $autoApproved = !empty($data['auto_approved']);

        if (empty($name) || empty($email) || empty($company)) {
            error_response('Name, email and company name are required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_response('Invalid email format');
        }
        if (empty($password) || strlen($password) < 6) {
            error_response('Password must be at least 6 characters');
        }

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $db->rollBack();
                error_response('Email already registered', 409);
            }

            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $phoneVal = $phone !== '' ? $phone : null;
            $stmt = $db->prepare(
                "INSERT INTO users (name, email, phone, password_hash, role, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 'operator', NOW(), NOW())"
            );
            $stmt->execute([$name, $email, $phoneVal, $password_hash]);
            $user_id = (int)$db->lastInsertId();
            if ($user_id <= 0) {
                $db->rollBack();
                error_response('Failed to create user account', 500);
            }

            $status = $autoApproved ? 'approved' : 'pending';
            $stmt = $db->prepare(
                "INSERT INTO operators (user_id, company_name, description, contact_phone, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
            );
            $stmt->execute([$user_id, $company, $description ?: null, $phone ?: null, $status]);

            $operator_id = (int)$db->lastInsertId();
            if ($operator_id <= 0) {
                $db->rollBack();
                error_response('Failed to create operator record', 500);
            }
            $db->commit();
            success_response(['id' => $operator_id, 'user_id' => $user_id], 'Provider created', 201);
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            error_response('Failed to create provider: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $operator_id = (int)$segments[1];
        $seg2 = $segments[2] ?? null;
        $data = get_json_body();

        if ($seg2 === 'status') {
            $new_status = sanitize($data['status'] ?? '');
            if (!in_array($new_status, ['pending', 'approved', 'suspended'])) {
                error_response('Invalid status. Valid: pending, approved, suspended');
            }
            try {
                $stmt = $db->prepare("UPDATE operators SET status = ? WHERE id = ?");
                $stmt->execute([$new_status, $operator_id]);
                if ($stmt->rowCount() === 0) error_response('Operator not found', 404);

                // แจ้งพาร์ทเนอร์เมื่อได้รับการอนุมัติ (in-app + อีเมล)
                if ($new_status === 'approved') {
                    try {
                        $notif = $db->prepare(
                            "INSERT INTO operator_notifications (operator_id, title, message, notif_type, ref_id, status, is_pinned)
                             VALUES (?, 'บัญชีได้รับการอนุมัติ', 'ยินดีด้วย! บัญชีพาร์ทเนอร์ของคุณได้รับการอนุมัติแล้ว คุณสามารถใช้งานระบบได้เต็มรูปแบบ', 'approval', ?, 'new', 1)"
                        );
                        $notif->execute([$operator_id, $operator_id]);
                        $op_row = $db->prepare("SELECT u.email, u.name, o.company_name FROM operators o JOIN users u ON o.user_id = u.id WHERE o.id = ?");
                        $op_row->execute([$operator_id]);
                        $op = $op_row->fetch();
                        if ($op && !empty($op['email'])) {
                            send_partner_approved_email($op['email'], $op['name'] ?? '', $op['company_name'] ?? '');
                        }
                    } catch (Throwable $e) {}
                }

                success_response(['id' => $operator_id, 'status' => $new_status], 'Operator status updated');
            } catch (PDOException $e) {
                error_response('Failed to update operator: ' . $e->getMessage(), 500);
            }
            return;
        }

        $company = trim($data['company_name'] ?? '');
        $description = trim($data['description'] ?? '');
        $contact_phone = sanitize($data['contact_phone'] ?? '');
        $status = sanitize($data['status'] ?? '');
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = sanitize($data['phone'] ?? '');
        $password = $data['password'] ?? '';
        $doc_boat_license = isset($data['doc_boat_license']) ? trim($data['doc_boat_license']) : null;
        $doc_boat_permit = isset($data['doc_boat_permit']) ? trim($data['doc_boat_permit']) : null;
        $doc_insurance = isset($data['doc_insurance']) ? trim($data['doc_insurance']) : null;

        try {
            $stmt = $db->prepare("SELECT o.id, o.user_id, o.company_name, u.email FROM operators o JOIN users u ON o.user_id = u.id WHERE o.id = ?");
            $stmt->execute([$operator_id]);
            $row = $stmt->fetch();
            if (!$row) error_response('Provider not found', 404);

            $updates = [];
            $params = [];
            if ($company !== '') { $updates[] = 'company_name = ?'; $params[] = $company; }
            if ($description !== '') { $updates[] = 'description = ?'; $params[] = $description; }
            $updates[] = 'contact_phone = ?'; $params[] = $contact_phone;
            if (in_array($status, ['pending', 'approved', 'suspended'])) { $updates[] = 'status = ?'; $params[] = $status; }
            if ($doc_boat_license !== null) { $updates[] = 'doc_boat_license = ?'; $params[] = $doc_boat_license ?: null; }
            if ($doc_boat_permit !== null) { $updates[] = 'doc_boat_permit = ?'; $params[] = $doc_boat_permit ?: null; }
            if ($doc_insurance !== null) { $updates[] = 'doc_insurance = ?'; $params[] = $doc_insurance ?: null; }
            $params[] = $operator_id;

            if (!empty($updates)) {
                $sql = "UPDATE operators SET " . implode(', ', $updates) . " WHERE id = ?";
                $db->prepare($sql)->execute($params);
            }

            $user_updates = [];
            $user_params = [];
            if ($name !== '') { $user_updates[] = 'name = ?'; $user_params[] = $name; }
            if ($email !== '') {
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error_response('Invalid email format');
                $chk = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $chk->execute([$email, $row['user_id']]);
                if ($chk->fetch()) error_response('Email already in use', 409);
                $user_updates[] = 'email = ?'; $user_params[] = $email;
            }
            if ($phone !== '') { $user_updates[] = 'phone = ?'; $user_params[] = $phone; }
            if ($password !== '' && strlen($password) >= 6) {
                $user_updates[] = 'password_hash = ?'; $user_params[] = password_hash($password, PASSWORD_DEFAULT);
            }
            if (!empty($user_updates)) {
                $user_params[] = $row['user_id'];
                $usql = "UPDATE users SET " . implode(', ', $user_updates) . " WHERE id = ?";
                $db->prepare($usql)->execute($user_params);
            }

            success_response(['id' => $operator_id], 'Provider updated');
        } catch (PDOException $e) {
            error_response('Failed to update provider: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $operator_id = (int)$segments[1];
        try {
            $stmt = $db->prepare("SELECT id FROM operators WHERE id = ?");
            $stmt->execute([$operator_id]);
            if (!$stmt->fetch()) error_response('Provider not found', 404);
            $db->prepare("DELETE FROM operators WHERE id = ?")->execute([$operator_id]);
            success_response(['id' => $operator_id], 'Provider deleted');
        } catch (PDOException $e) {
            error_response('Failed to delete provider: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin providers endpoint', 404);
    }
}

function handleAdminReviews(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        $page = get_page();
        $limit = get_limit();
        $offset = ($page - 1) * $limit;
        $status = get_param('status');

        $where = '1=1';
        $params = [];
        if ($status) {
            $where = 'r.status = ?';
            $params[] = $status;
        }

        try {
            $count = $db->prepare("SELECT COUNT(*) AS total FROM reviews r WHERE {$where}");
            $count->execute($params);
            $total = (int)$count->fetch()['total'];

            $q_params = array_merge($params, [$limit, $offset]);
            $stmt = $db->prepare(
                "SELECT r.id, r.booking_id, r.boat_id, r.destination_id,
                        r.rating, r.comment, r.status, r.created_at,
                        u.name AS user_name, u.email AS user_email,
                        bt.name AS boat_name
                 FROM reviews r
                 JOIN users u ON r.user_id = u.id
                 LEFT JOIN boats bt ON r.boat_id = bt.id
                 WHERE {$where}
                 ORDER BY r.created_at DESC
                 LIMIT ? OFFSET ?"
            );
            $stmt->execute($q_params);

            success_response([
                'reviews'    => $stmt->fetchAll(),
                'pagination' => pagination_meta($total, $page, $limit)
            ]);
        } catch (PDOException $e) {
            error_response('Failed to fetch reviews: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1]) && isset($segments[2])) {
        $review_id = (int)$segments[1];
        $review_action = $segments[2];

        if ($review_action === 'approve') {
            $new_status = 'approved';
        } elseif ($review_action === 'reject') {
            $new_status = 'rejected';
        } else {
            error_response('Invalid action. Use: approve, reject', 400);
            return;
        }

        try {
            $stmt = $db->prepare("UPDATE reviews SET status = ? WHERE id = ?");
            $stmt->execute([$new_status, $review_id]);

            if ($stmt->rowCount() === 0) {
                error_response('Review not found', 404);
            }

            success_response(['id' => $review_id, 'status' => $new_status], "Review {$new_status}");
        } catch (PDOException $e) {
            error_response('Failed to update review: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin reviews endpoint', 404);
    }
}

function handleAdminFinance(PDO $db): void {
    try {
        $total_rev = $db->prepare(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'"
        );
        $total_rev->execute();
        $total_revenue = (float)$total_rev->fetch()['total'];

        $monthly = $db->prepare(
            "SELECT DATE_FORMAT(pay.created_at, '%Y-%m') AS month,
                    COALESCE(SUM(pay.amount), 0) AS revenue,
                    COUNT(DISTINCT pay.booking_id) AS bookings
             FROM payments pay
             WHERE pay.status = 'paid'
             GROUP BY month ORDER BY month DESC LIMIT 12"
        );
        $monthly->execute();
        $monthly_data = $monthly->fetchAll();

        $by_operator = $db->prepare(
            "SELECT o.id, o.company_name,
                    COALESCE(SUM(pay.amount), 0) AS total_revenue,
                    COUNT(DISTINCT bk.id) AS total_bookings
             FROM operators o
             JOIN boats bt ON o.id = bt.operator_id
             JOIN bookings bk ON bt.id = bk.boat_id AND bk.status != 'cancelled'
             LEFT JOIN payments pay ON bk.id = pay.booking_id AND pay.status = 'paid'
             GROUP BY o.id
             ORDER BY total_revenue DESC"
        );
        $by_operator->execute();
        $operator_stats = $by_operator->fetchAll();

        $payment_methods = $db->prepare(
            "SELECT method, COUNT(*) AS count, SUM(amount) AS total
             FROM payments WHERE status = 'paid'
             GROUP BY method"
        );
        $payment_methods->execute();

        success_response([
            'total_revenue'   => $total_revenue,
            'monthly_revenue' => $monthly_data,
            'operator_payouts' => $operator_stats,
            'payment_methods' => $payment_methods->fetchAll()
        ]);
    } catch (PDOException $e) {
        error_response('Finance report failed: ' . $e->getMessage(), 500);
    }
}

function handleAdminUsers(PDO $db): void {
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;
    $search = get_param('search');
    $role = get_param('role');

    $where = ['1=1'];
    $params = [];

    if ($search) {
        $where[] = '(u.name LIKE ? OR u.email LIKE ?)';
        $s = "%{$search}%";
        $params = array_merge($params, [$s, $s]);
    }
    if ($role) {
        $where[] = 'u.role = ?';
        $params[] = $role;
    }

    $where_sql = implode(' AND ', $where);

    try {
        $count = $db->prepare("SELECT COUNT(*) AS total FROM users u WHERE {$where_sql}");
        $count->execute($params);
        $total = (int)$count->fetch()['total'];

        $q_params = array_merge($params, [$limit, $offset]);
        $stmt = $db->prepare(
            "SELECT u.id, u.name, u.email, u.phone, u.role, u.language,
                    u.profile_image,
                    (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) AS booking_count,
                    (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) AS review_count
             FROM users u
             WHERE {$where_sql}
             ORDER BY u.id DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute($q_params);

        success_response([
            'users'      => $stmt->fetchAll(),
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch users: ' . $e->getMessage(), 500);
    }
}

function handleAdminStaff(PDO $db, string $method, array $segments): void {
    if ($method === 'GET') {
        if (isset($segments[1]) && is_numeric($segments[1])) {
            $id = (int)$segments[1];
            try {
                $stmt = $db->prepare("SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = 'staff'");
                $stmt->execute([$id]);
                $user = $stmt->fetch();
                if (!$user) error_response('Staff not found', 404);
                $perms = $db->prepare("SELECT module FROM admin_permissions WHERE user_id = ?");
                $perms->execute([$id]);
                $user['modules'] = array_column($perms->fetchAll(), 'module');
                success_response($user);
            } catch (PDOException $e) {
                error_response('Failed to fetch staff: ' . $e->getMessage(), 500);
            }
            return;
        }
        try {
            $stmt = $db->prepare(
                "SELECT u.id, u.name, u.email, u.role, u.created_at,
                        (SELECT GROUP_CONCAT(module) FROM admin_permissions WHERE user_id = u.id) AS modules
                 FROM users u WHERE u.role = 'staff' ORDER BY u.id DESC"
            );
            $stmt->execute();
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['modules'] = $r['modules'] ? explode(',', $r['modules']) : [];
            }
            success_response(['staff' => $rows]);
        } catch (PDOException $e) {
            error_response('Failed to fetch staff: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'POST') {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $modules = $data['modules'] ?? [];

        if (empty($name) || empty($email) || empty($password)) {
            error_response('Name, email and password are required');
        }
        if (strlen($password) < 6) error_response('Password must be at least 6 characters');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error_response('Invalid email');

        try {
            $chk = $db->prepare("SELECT id FROM users WHERE email = ?");
            $chk->execute([$email]);
            if ($chk->fetch()) error_response('Email already registered', 409);

            $stmt = $db->prepare(
                "INSERT INTO users (name, email, phone, password_hash, role, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 'staff', NOW(), NOW())"
            );
            $stmt->execute([$name, $email, sanitize($data['phone'] ?? ''), password_hash($password, PASSWORD_DEFAULT)]);
            $user_id = (int)$db->lastInsertId();

            $ins = $db->prepare("INSERT INTO admin_permissions (user_id, module) VALUES (?, ?)");
            foreach (array_unique($modules) as $m) {
                if ($m && trim($m)) $ins->execute([$user_id, trim($m)]);
            }
            success_response(['id' => $user_id], 'Staff created', 201);
        } catch (PDOException $e) {
            error_response('Failed to create staff: ' . $e->getMessage(), 500);
        }
    } elseif ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1])) {
        $id = (int)$segments[1];
        $data = get_json_body();
        $modules = $data['modules'] ?? [];

        try {
            $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'staff'");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) error_response('Staff not found', 404);

            $db->prepare("DELETE FROM admin_permissions WHERE user_id = ?")->execute([$id]);
            $ins = $db->prepare("INSERT INTO admin_permissions (user_id, module) VALUES (?, ?)");
            foreach (array_unique($modules) as $m) {
                if ($m && trim($m)) $ins->execute([$id, trim($m)]);
            }
            success_response(['id' => $id], 'Staff permissions updated');
        } catch (PDOException $e) {
            error_response('Failed to update staff: ' . $e->getMessage(), 500);
        }
    } else {
        error_response('Invalid admin staff endpoint', 404);
    }
}

function handleAdminCms(PDO $db, string $method, array $segments): void {
    $id = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : 0;

    if ($method === 'GET' && $id === 0) {
        $type = $_GET['type'] ?? '';
        $valid = ['feedback_intro', 'help_item', 'announcement'];
        if (!in_array($type, $valid)) {
            $stmt = $db->query("SELECT * FROM site_content ORDER BY content_type, sort_order, id");
            success_response($stmt->fetchAll());
            return;
        }
        $stmt = $db->prepare("SELECT * FROM site_content WHERE content_type = ? ORDER BY sort_order ASC, id ASC");
        $stmt->execute([$type]);
        success_response($stmt->fetchAll());
        return;
    }

    if ($method === 'POST') {
        $data = get_json_body();
        $ct = $data['content_type'] ?? '';
        if (!in_array($ct, ['feedback_intro', 'help_item', 'announcement'])) error_response('Invalid content_type');
        $title_th = sanitize($data['title_th'] ?? '');
        $title_en = sanitize($data['title_en'] ?? '');
        $body_th = sanitize($data['body_th'] ?? '');
        $body_en = sanitize($data['body_en'] ?? '');
        $sort_order = (int)($data['sort_order'] ?? 0);
        if ($ct === 'feedback_intro') {
            $db->prepare("DELETE FROM site_content WHERE content_type = 'feedback_intro'")->execute();
        }
        $stmt = $db->prepare("INSERT INTO site_content (content_type, title_th, title_en, body_th, body_en, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$ct, $title_th, $title_en, $body_th, $body_en, $sort_order]);
        success_response(['id' => (int)$db->lastInsertId()], 'Created', 201);
        return;
    }

    if (($method === 'PUT' || $method === 'PATCH') && $id > 0) {
        $data = get_json_body();
        $sets = []; $params = [];
        foreach (['title_th', 'title_en', 'body_th', 'body_en', 'sort_order', 'is_active'] as $f) {
            if (array_key_exists($f, $data)) {
                $sets[] = "{$f} = ?";
                $params[] = in_array($f, ['sort_order', 'is_active']) ? (int)$data[$f] : sanitize($data[$f]);
            }
        }
        if (empty($sets)) error_response('No fields to update');
        $params[] = $id;
        $db->prepare("UPDATE site_content SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
        success_response(['id' => $id], 'Updated');
        return;
    }

    if ($method === 'DELETE' && $id > 0) {
        $db->prepare("DELETE FROM site_content WHERE id = ?")->execute([$id]);
        success_response(null, 'Deleted');
        return;
    }

    error_response('Invalid admin CMS endpoint', 404);
}

function handleAdminFeedbackSubmissions(PDO $db, string $method, array $segments): void {
    if ($method !== 'GET') error_response('Method not allowed', 405);
    $stmt = $db->prepare("SELECT f.*, u.name, u.email FROM feedback_submissions f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC LIMIT 200");
    $stmt->execute();
    success_response($stmt->fetchAll());
}
