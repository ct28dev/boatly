<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$token_str = $_GET['token'] ?? '';
$token_data = verify_token($token_str);
if (!$token_data) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $token_data['user_id'];
$db = Database::getInstance()->getConnection();

$op = $db->prepare("SELECT id, status FROM operators WHERE user_id = ?");
$op->execute([$user_id]);
$operator = $op->fetch();
$op_id = $operator ? (int)$operator['id'] : 0;

// Auto-migrate: boat_types, boat_type VARCHAR, tips, operator_notifications, operator_documents
try {
    $db->query("SELECT 1 FROM boat_types LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE boat_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(50) NOT NULL UNIQUE,
                name_th VARCHAR(100) NOT NULL,
                name_en VARCHAR(100) NOT NULL,
                is_active TINYINT DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            )");
            $seeds = [
                ['longtail','เรือหางยาว','Longtail',1],['speedboat','สปีดโบ๊ท','Speedboat',2],['yacht','เรือยอร์ช','Yacht',3],
                ['catamaran','เรือคาตามารัน','Catamaran',4],['ferry','เรือเฟอร์รี่','Ferry',5],['cruise','เรือสำราญ','Cruise',6],
                ['houseboat','เรือบ้าน','Houseboat',7],['kayak','เรือคายัค','Kayak',8],['canoe','เรือแคนู','Canoe',9],
                ['sailboat','เรือใบ','Sailboat',10],['dinghy','เรือดิงกี้','Dinghy',11],['pontoon','เรือพอนทูน','Pontoon',12],
                ['jet_ski','เจ็ทสกี','Jet Ski',13],['traditional','เรือแบบดั้งเดิม','Traditional Boat',14],['other','อื่นๆ','Other',15]
            ];
            $ins = $db->prepare("INSERT INTO boat_types (slug, name_th, name_en, sort_order) VALUES (?, ?, ?, ?)");
            foreach ($seeds as $s) $ins->execute($s);
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT default_time_slots FROM boats LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'default_time_slots') !== false || strpos($e->getMessage(), "doesn't exist") !== false) {
        try { $db->exec("ALTER TABLE boats ADD COLUMN default_time_slots TEXT NULL"); } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM addon_templates LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE addon_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operator_id INT NOT NULL,
                name_th VARCHAR(200) NOT NULL,
                name_en VARCHAR(200),
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                is_active TINYINT DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            try { $db->exec("ALTER TABLE addons ADD COLUMN addon_template_id INT NULL"); } catch (PDOException $e3) {}
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT boat_type FROM boats LIMIT 1");
    $cols = $db->query("SHOW COLUMNS FROM boats WHERE Field = 'boat_type'")->fetch();
    if ($cols && stripos($cols['Type'] ?? '', 'enum') !== false) {
        try { $db->exec("ALTER TABLE boats MODIFY boat_type VARCHAR(50) NOT NULL DEFAULT 'longtail'"); } catch (PDOException $e2) {}
    }
} catch (PDOException $e) {}
try {
    $db->query("SELECT 1 FROM booking_tips LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE booking_tips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                boat_id INT NOT NULL,
                operator_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                message TEXT,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
                FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
            )");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM operator_notifications LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE operator_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operator_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT,
                is_read TINYINT DEFAULT 0,
                is_pinned TINYINT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'new',
                notif_type VARCHAR(50),
                ref_id INT,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
            )");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT last_booking_acknowledged_at FROM operators LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'last_booking_acknowledged_at') !== false) {
        try { $db->exec("ALTER TABLE operators ADD COLUMN last_booking_acknowledged_at DATETIME NULL"); } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT tip_promptpay_phone FROM operators LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'tip_promptpay') !== false) {
        try { $db->exec("ALTER TABLE operators ADD COLUMN tip_promptpay_phone VARCHAR(20) NULL"); } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT payment_method FROM booking_tips LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'payment_method') !== false) {
        try { $db->exec("ALTER TABLE booking_tips ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'cash'"); } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM tip_distribution LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE tip_distribution (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tip_id INT NOT NULL,
                recipient_type VARCHAR(20) NOT NULL,
                recipient_id INT NULL,
                amount DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (tip_id) REFERENCES booking_tips(id) ON DELETE CASCADE
            )");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT is_pinned FROM bookings LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'is_pinned') !== false) {
        try { $db->exec("ALTER TABLE bookings ADD COLUMN is_pinned TINYINT DEFAULT 0"); } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT partner_note FROM bookings LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false || strpos($e->getMessage(), 'partner_note') !== false) {
        try { $db->exec("ALTER TABLE bookings ADD COLUMN partner_note TEXT NULL"); } catch (PDOException $e2) {}
    }
}
try {
    $col = $db->query("SHOW COLUMNS FROM bookings WHERE Field = 'status'")->fetch(PDO::FETCH_ASSOC);
    if ($col && isset($col['Type']) && stripos($col['Type'], 'enum') !== false) {
        $db->exec("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");
    }
} catch (PDOException $e) {}
try {
    $db->query("SELECT 1 FROM messages LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                sender_type VARCHAR(20) NOT NULL,
                sender_id INT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM pricing_rules LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE pricing_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
                start_date DATE NULL,
                end_date DATE NULL,
                is_active TINYINT DEFAULT 1,
                created_at DATETIME DEFAULT NOW()
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM settings LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value TEXT, updated_at DATETIME DEFAULT NOW() ON UPDATE NOW())");
        } catch (PDOException $e2) {}
    }
}
try {
    $stmt = $db->prepare("SELECT 1 FROM settings WHERE setting_key = 'dynamic_pricing_enabled'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('dynamic_pricing_enabled', '{\"enabled\":false}')")->execute();
    }
} catch (PDOException $e) {}
$pricingSettingsFile = dirname(__DIR__) . '/uploads/settings/pricing_settings.json';
if (!file_exists($pricingSettingsFile)) {
    $dir = dirname($pricingSettingsFile);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    @file_put_contents($pricingSettingsFile, json_encode(['dynamic_pricing_enabled' => false], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}
try {
    $db->query("SELECT 1 FROM operator_documents LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE operator_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                operator_id INT NOT NULL,
                boat_id INT NULL,
                doc_type VARCHAR(50) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                doc_name VARCHAR(200),
                expiry_date DATE NULL,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
                FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
            )");
        } catch (PDOException $e2) {}
    }
}

$action = $_GET['action'] ?? 'dashboard';

if ($op_id <= 0) {
    echo json_encode(['error' => 'Operator not found']);
    exit;
}

// action=status ให้ตรวจสอบได้แม้สถานะ pending (เพื่อให้ผู้สมัครเห็นเมื่อได้รับการอนุมัติ)
if ($action === 'status') {
    echo json_encode(['status' => $operator['status'] ?? 'pending'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($operator['status'] ?? '') === 'pending') {
    echo json_encode(['error' => 'Operator pending', 'message' => 'บัญชีพาร์ทเนอร์รอการอนุมัติจากผู้ดูแลระบบ']);
    exit;
}
if (($operator['status'] ?? '') === 'suspended') {
    echo json_encode(['error' => 'Operator suspended', 'message' => 'บัญชีพาร์ทเนอร์ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ']);
    exit;
}

switch ($action) {
    case 'dashboard':
        $boats_count = $db->prepare("SELECT COUNT(*) as c FROM boats WHERE operator_id = ?");
        $boats_count->execute([$op_id]);

        $bookings_count = $db->prepare("SELECT COUNT(*) as c FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bt.operator_id = ? AND MONTH(bk.created_at) = MONTH(NOW()) AND YEAR(bk.created_at) = YEAR(NOW())");
        $bookings_count->execute([$op_id]);

        $revenue = $db->prepare("SELECT COALESCE(SUM(bk.total_amount),0) as r FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id JOIN payments p ON p.booking_id = bk.id WHERE bt.operator_id = ? AND p.status = 'paid' AND MONTH(bk.created_at) = MONTH(NOW())");
        $revenue->execute([$op_id]);

        $rating = $db->prepare("SELECT COALESCE(AVG(r.rating),0) as avg_r FROM reviews r JOIN boats bt ON r.boat_id = bt.id WHERE bt.operator_id = ? AND r.status = 'approved'");
        $rating->execute([$op_id]);

        $recent = $db->prepare("SELECT bk.*, bt.name as boat_name, COALESCE(u.name, bk.customer_name) as display_name FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id LEFT JOIN users u ON bk.user_id = u.id WHERE bt.operator_id = ? ORDER BY COALESCE(bk.is_pinned,0) DESC, bk.created_at DESC LIMIT 10");
        $recent->execute([$op_id]);

        $tips_total = 0;
        $tips_today = 0;
        $tips_unread_count = 0;
        try {
            $tips = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM booking_tips WHERE operator_id = ?");
            $tips->execute([$op_id]);
            $tips_total = (float)$tips->fetchColumn();
            $tipsToday = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM booking_tips WHERE operator_id = ? AND DATE(created_at) = CURDATE()");
            $tipsToday->execute([$op_id]);
            $tips_today = (float)$tipsToday->fetchColumn();
            $tipsUnread = $db->prepare("SELECT COUNT(*) FROM operator_notifications WHERE operator_id = ? AND notif_type = 'tip' AND (is_read = 0 OR is_read IS NULL)");
            $tipsUnread->execute([$op_id]);
            $tips_unread_count = (int)$tipsUnread->fetchColumn();
        } catch (PDOException $e) {}

        $unread_notif = 0;
        try {
            $un = $db->prepare("SELECT COUNT(*) FROM operator_notifications WHERE operator_id = ? AND is_read = 0");
            $un->execute([$op_id]);
            $unread_notif = (int)$un->fetchColumn();
        } catch (PDOException $e) {}

        $unack_count = 0;
        try {
            $ack = $db->prepare("SELECT last_booking_acknowledged_at FROM operators WHERE id = ?");
            $ack->execute([$op_id]);
            $last_ack = $ack->fetchColumn();
            $uc = $db->prepare("SELECT COUNT(*) FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bt.operator_id = ? AND bk.status NOT IN ('cancelled')");
            $uc->execute([$op_id]);
            $total = (int)$uc->fetchColumn();
            if ($last_ack === null || $last_ack === '') {
                $unack_count = $total;
            } else {
                $uc2 = $db->prepare("SELECT COUNT(*) FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bt.operator_id = ? AND bk.status NOT IN ('cancelled') AND bk.created_at > ?");
                $uc2->execute([$op_id, $last_ack]);
                $unack_count = (int)$uc2->fetchColumn();
            }
        } catch (PDOException $e) {}

        echo json_encode([
            'boats' => $boats_count->fetch()['c'],
            'bookings' => $bookings_count->fetch()['c'],
            'revenue' => $revenue->fetch()['r'],
            'rating' => $rating->fetch()['avg_r'],
            'tips_total' => $tips_total,
            'tips_today' => $tips_today,
            'tips_unread_count' => $tips_unread_count,
            'unread_notifications' => $unread_notif,
            'unacknowledged_bookings' => $unack_count,
            'recent' => $recent->fetchAll(),
        ], JSON_UNESCAPED_UNICODE);
        break;

    case 'acknowledge-bookings':
        $stmt = $db->prepare("UPDATE operators SET last_booking_acknowledged_at = NOW() WHERE id = ?");
        $stmt->execute([$op_id]);
        echo json_encode(['success' => true]);
        break;

    case 'unacknowledged-count':
        $unack = 0;
        $tips_unread = 0;
        try {
            $ack = $db->prepare("SELECT last_booking_acknowledged_at FROM operators WHERE id = ?");
            $ack->execute([$op_id]);
            $last_ack = $ack->fetchColumn();
            if ($last_ack === null || $last_ack === '') {
                $uc = $db->prepare("SELECT COUNT(*) FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bt.operator_id = ? AND bk.status NOT IN ('cancelled')");
                $uc->execute([$op_id]);
                $unack = (int)$uc->fetchColumn();
            } else {
                $uc2 = $db->prepare("SELECT COUNT(*) FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bt.operator_id = ? AND bk.status NOT IN ('cancelled') AND bk.created_at > ?");
                $uc2->execute([$op_id, $last_ack]);
                $unack = (int)$uc2->fetchColumn();
            }
            $tu = $db->prepare("SELECT COUNT(*) FROM operator_notifications WHERE operator_id = ? AND notif_type = 'tip' AND (is_read = 0 OR is_read IS NULL)");
            $tu->execute([$op_id]);
            $tips_unread = (int)$tu->fetchColumn();
        } catch (PDOException $e) {}
        echo json_encode(['unacknowledged_bookings' => $unack, 'tips_unread_count' => $tips_unread]);
        break;

    case 'boats':
        $stmt = $db->prepare("SELECT b.*, d.province, COALESCE(d.name_th, d.province) AS province_name_th, (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) as image FROM boats b LEFT JOIN destinations d ON b.destination_id = d.id WHERE b.operator_id = ? ORDER BY b.created_at DESC");
        $stmt->execute([$op_id]);
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'bookings':
        $search = trim($_GET['search'] ?? '');
        $sql = "SELECT bk.*, bt.name as boat_name, bt.pier_name, bt.pier_name_th, COALESCE(u.name, bk.customer_name) as display_name,
                (SELECT p2.id FROM payments p2 WHERE p2.booking_id = bk.id ORDER BY p2.id DESC LIMIT 1) as payment_id,
                (SELECT COALESCE(p2.status,'pending') FROM payments p2 WHERE p2.booking_id = bk.id ORDER BY p2.id DESC LIMIT 1) as pay_status,
                (SELECT p2.transaction_ref FROM payments p2 WHERE p2.booking_id = bk.id ORDER BY p2.id DESC LIMIT 1) as transaction_ref
                FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id LEFT JOIN users u ON bk.user_id = u.id WHERE bt.operator_id = ?";
        $params = [$op_id];
        if ($search !== '') {
            $term = '%' . $search . '%';
            $sql .= " AND (bk.booking_ref LIKE ? OR bk.customer_name LIKE ? OR COALESCE(u.name, bk.customer_name) LIKE ? OR bk.customer_email LIKE ?)";
            $params = array_merge($params, [$term, $term, $term, $term]);
        }
        $sql .= " ORDER BY COALESCE(bk.is_pinned,0) DESC, bk.booking_date ASC, bk.time_slot ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'confirm':
        $id = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ? AND boat_id IN (SELECT id FROM boats WHERE operator_id = ?)");
        $stmt->execute([$id, $op_id]);
        echo json_encode(['success' => true]);
        break;

    case 'cancel':
        $id = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND boat_id IN (SELECT id FROM boats WHERE operator_id = ?)");
        $stmt->execute([$id, $op_id]);
        echo json_encode(['success' => true]);
        break;

    case 'complete':
        $id = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("UPDATE bookings SET status = 'completed' WHERE id = ? AND boat_id IN (SELECT id FROM boats WHERE operator_id = ?)");
        $stmt->execute([$id, $op_id]);
        echo json_encode(['success' => true]);
        break;

    case 'booking-status':
        $id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
        $newStatus = trim($_GET['status'] ?? $_POST['status'] ?? '');
        $allowed = ['confirmed', 'completed', 'rescheduled', 'in_progress'];
        if ($id <= 0 || !in_array($newStatus, $allowed)) {
            echo json_encode(['success' => false, 'message' => 'Invalid id or status']);
            break;
        }
        $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ? AND boat_id IN (SELECT id FROM boats WHERE operator_id = ?)");
        $stmt->execute([$newStatus, $id, $op_id]);
        echo json_encode(['success' => true, 'status' => $newStatus]);
        break;

    case 'booking-pin':
        $id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
        $pinned = (int)($_GET['pinned'] ?? $_POST['pinned'] ?? 0);
        if ($id <= 0) { echo json_encode(['success' => false, 'message' => 'Invalid id']); break; }
        $stmt = $db->prepare("UPDATE bookings SET is_pinned = ? WHERE id = ? AND boat_id IN (SELECT id FROM boats WHERE operator_id = ?)");
        $stmt->execute([$pinned ? 1 : 0, $id, $op_id]);
        echo json_encode(['success' => true, 'pinned' => (bool)$pinned]);
        break;

    case 'booking-note':
        $id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
        $note = $_POST['note'] ?? '';
        $booking_ref = trim($_POST['booking_ref'] ?? '');
        if ($note === '' && ($raw = @file_get_contents('php://input'))) {
            $json = json_decode($raw, true);
            if (is_array($json)) {
                if (isset($json['note'])) $note = $json['note'];
                if (isset($json['id'])) $id = (int)$json['id'];
                if (isset($json['booking_ref'])) $booking_ref = trim($json['booking_ref']);
            }
        }
        if ($id <= 0 && $booking_ref === '') { echo json_encode(['success' => false, 'message' => 'Invalid id']); break; }
        $bid = null;
        if ($id > 0) {
            $chk = $db->prepare("SELECT bk.id FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bk.id = ? AND bt.operator_id = ?");
            $chk->execute([$id, $op_id]);
            $row = $chk->fetch();
            if ($row) $bid = (int)$row['id'];
        }
        if ($bid === null && $booking_ref !== '') {
            $chk = $db->prepare("SELECT bk.id FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bk.booking_ref = ? AND bt.operator_id = ?");
            $chk->execute([$booking_ref, $op_id]);
            $row = $chk->fetch();
            if ($row) $bid = (int)$row['id'];
        }
        if ($bid === null) { echo json_encode(['success' => false, 'message' => 'ไม่พบการจองหรือไม่มีสิทธิ์แก้ไข']); break; }
        $stmt = $db->prepare("UPDATE bookings SET partner_note = ? WHERE id = ?");
        $stmt->execute([trim($note), $bid]);
        echo json_encode(['success' => true]);
        break;

    case 'revenue':
        $total = $db->prepare("SELECT COALESCE(SUM(bk.total_amount),0) as v FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id JOIN payments p ON p.booking_id = bk.id WHERE bt.operator_id = ? AND p.status = 'paid'");
        $total->execute([$op_id]);

        $month = $db->prepare("SELECT COALESCE(SUM(bk.total_amount),0) as v FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id JOIN payments p ON p.booking_id = bk.id WHERE bt.operator_id = ? AND p.status = 'paid' AND MONTH(bk.created_at) = MONTH(NOW())");
        $month->execute([$op_id]);

        $pending = $db->prepare("SELECT COALESCE(SUM(bk.total_amount),0) as v FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id JOIN payments p ON p.booking_id = bk.id WHERE bt.operator_id = ? AND p.status = 'pending'");
        $pending->execute([$op_id]);

        $items = $db->prepare("SELECT bk.booking_ref, bk.booking_date, bk.total_amount, bt.name as boat_name, COALESCE(p.status,'pending') as pay_status FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id LEFT JOIN payments p ON p.booking_id = bk.id WHERE bt.operator_id = ? ORDER BY bk.booking_date DESC LIMIT 50");
        $items->execute([$op_id]);

        echo json_encode([
            'total' => $total->fetch()['v'],
            'month' => $month->fetch()['v'],
            'pending' => $pending->fetch()['v'],
            'items' => $items->fetchAll(),
        ], JSON_UNESCAPED_UNICODE);
        break;

    case 'addon-templates':
        try {
            $stmt = $db->prepare("SELECT t.*, (SELECT GROUP_CONCAT(b.name) FROM addons a JOIN boats b ON a.boat_id = b.id WHERE a.addon_template_id = t.id) as boat_names FROM addon_templates t WHERE t.operator_id = ? ORDER BY t.sort_order ASC, t.name_th ASC");
            $stmt->execute([$op_id]);
            echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode([], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'addons':
        try {
            $stmt = $db->prepare("SELECT a.*, b.name as boat_name FROM addons a JOIN boats b ON a.boat_id = b.id WHERE b.operator_id = ? ORDER BY b.name, a.sort_order, a.id");
            $stmt->execute([$op_id]);
            echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode([], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'reviews':
        $stmt = $db->prepare(
            "SELECT r.id, r.rating, r.comment, r.status, r.created_at,
                    u.name AS customer_name, bt.name AS boat_name
             FROM reviews r
             JOIN boats bt ON r.boat_id = bt.id
             LEFT JOIN users u ON r.user_id = u.id
             WHERE bt.operator_id = ?
             ORDER BY r.created_at DESC LIMIT 100"
        );
        $stmt->execute([$op_id]);
        $reviews = $stmt->fetchAll();
        try {
            $ids = array_filter(array_map('intval', array_column($reviews, 'id')));
            if (!empty($ids)) {
                $imgStmt = $db->prepare("SELECT review_id, image_url, sort_order FROM review_images WHERE review_id IN (" . implode(',', $ids) . ") ORDER BY review_id, sort_order");
                $imgStmt->execute();
                $imgs = [];
                foreach ($imgStmt->fetchAll() as $row) {
                    $imgs[$row['review_id']][] = $row['image_url'];
                }
                foreach ($reviews as &$r) {
                    $r['images'] = $imgs[$r['id']] ?? [];
                }
            } else {
                foreach ($reviews as &$r) { $r['images'] = []; }
            }
        } catch (PDOException $e) {
            foreach ($reviews as &$r) { $r['images'] = []; }
        }
        echo json_encode($reviews, JSON_UNESCAPED_UNICODE);
        break;

    case 'destinations':
        $stmt = $db->prepare("SELECT id, name, name_th, slug, province FROM destinations WHERE status = 'active' ORDER BY sort_order ASC, name ASC");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'provinces':
        $provinces = require __DIR__ . '/config/provinces.php';
        echo json_encode($provinces, JSON_UNESCAPED_UNICODE);
        break;

    case 'boat-types':
        try {
            $db->query("SELECT 1 FROM boat_types LIMIT 1");
            $stmt = $db->prepare("SELECT id, name_th, name_en, slug FROM boat_types WHERE is_active = 1 ORDER BY sort_order ASC, name_th ASC");
            $stmt->execute();
            $types = $stmt->fetchAll();
            if (!empty($types)) {
                echo json_encode($types, JSON_UNESCAPED_UNICODE);
                break;
            }
        } catch (PDOException $e) {}
        $defaultTypes = [
            ['id' => 1, 'slug' => 'longtail', 'name_th' => 'เรือหางยาว', 'name_en' => 'Longtail'],
            ['id' => 2, 'slug' => 'speedboat', 'name_th' => 'สปีดโบ๊ท', 'name_en' => 'Speedboat'],
            ['id' => 3, 'slug' => 'yacht', 'name_th' => 'เรือยอร์ช', 'name_en' => 'Yacht'],
            ['id' => 4, 'slug' => 'catamaran', 'name_th' => 'เรือคาตามารัน', 'name_en' => 'Catamaran'],
            ['id' => 5, 'slug' => 'ferry', 'name_th' => 'เรือเฟอร์รี่', 'name_en' => 'Ferry'],
            ['id' => 6, 'slug' => 'cruise', 'name_th' => 'เรือสำราญ', 'name_en' => 'Cruise'],
            ['id' => 7, 'slug' => 'houseboat', 'name_th' => 'เรือบ้าน', 'name_en' => 'Houseboat'],
            ['id' => 8, 'slug' => 'kayak', 'name_th' => 'เรือคายัค', 'name_en' => 'Kayak'],
            ['id' => 9, 'slug' => 'canoe', 'name_th' => 'เรือแคนู', 'name_en' => 'Canoe'],
            ['id' => 10, 'slug' => 'sailboat', 'name_th' => 'เรือใบ', 'name_en' => 'Sailboat'],
            ['id' => 11, 'slug' => 'dinghy', 'name_th' => 'เรือดิงกี้', 'name_en' => 'Dinghy'],
            ['id' => 12, 'slug' => 'pontoon', 'name_th' => 'เรือพอนทูน', 'name_en' => 'Pontoon'],
            ['id' => 13, 'slug' => 'jet_ski', 'name_th' => 'เจ็ทสกี', 'name_en' => 'Jet Ski'],
            ['id' => 14, 'slug' => 'traditional', 'name_th' => 'เรือแบบดั้งเดิม', 'name_en' => 'Traditional Boat'],
            ['id' => 15, 'slug' => 'other', 'name_th' => 'อื่นๆ', 'name_en' => 'Other'],
        ];
        echo json_encode($defaultTypes, JSON_UNESCAPED_UNICODE);
        break;

    case 'tips':
        $limit = min(500, max(50, (int)($_GET['limit'] ?? 50)));
        $stmt = $db->prepare(
            "SELECT t.*, bk.booking_ref, bt.name AS boat_name, u.name AS customer_name
             FROM booking_tips t
             JOIN bookings bk ON t.booking_id = bk.id
             JOIN boats bt ON t.boat_id = bt.id
             LEFT JOIN users u ON bk.user_id = u.id
             WHERE t.operator_id = ?
             ORDER BY t.created_at DESC LIMIT " . (int)$limit
        );
        $stmt->execute([$op_id]);
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'mark-tips-read':
        try {
            $db->prepare("UPDATE operator_notifications SET is_read = 1 WHERE operator_id = ? AND notif_type = 'tip'")->execute([$op_id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false]);
        }
        break;

    case 'notifications':
        $stmt = $db->prepare(
            "SELECT * FROM operator_notifications WHERE operator_id = ? ORDER BY is_pinned DESC, created_at DESC LIMIT 100"
        );
        $stmt->execute([$op_id]);
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    case 'documents':
        $stmt = $db->prepare(
            "SELECT d.*, b.name AS boat_name FROM operator_documents d
             LEFT JOIN boats b ON d.boat_id = b.id
             WHERE d.operator_id = ? ORDER BY d.expiry_date ASC, d.id DESC"
        );
        $stmt->execute([$op_id]);
        $docs = $stmt->fetchAll();
        foreach ($docs as &$d) {
            $d['days_to_expiry'] = null;
            if ($d['expiry_date']) {
                $exp = new DateTime($d['expiry_date']);
                $now = new DateTime();
                $d['days_to_expiry'] = $now->diff($exp)->days * ($exp >= $now ? 1 : -1);
            }
        }
        echo json_encode($docs, JSON_UNESCAPED_UNICODE);
        break;

    case 'documents-expiring':
        $stmt = $db->prepare(
            "SELECT * FROM operator_documents WHERE operator_id = ? AND expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY) ORDER BY expiry_date ASC"
        );
        $stmt->execute([$op_id]);
        echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        break;

    default:
        echo json_encode(['error' => 'Unknown action']);
}
