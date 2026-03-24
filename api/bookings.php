<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';
$subAction = $segments[1] ?? '';

switch ($method) {
    case 'GET':
        if (is_numeric($action) && $subAction === 'messages') {
            require_once __DIR__ . '/messages.php';
            exit;
        }
        if (is_numeric($action)) {
            handleBookingDetail($db, (int)$action);
        } elseif ($action === '' || $action === '/') {
            handleListBookings($db);
        } else {
            error_response('Invalid bookings endpoint', 404);
        }
        break;
    case 'POST':
        if (is_numeric($action) && $subAction === 'messages') {
            require_once __DIR__ . '/messages.php';
            exit;
        }
        if (is_numeric($action) && isset($segments[1]) && $segments[1] === 'tip') {
            handleAddTip($db, (int)$action);
        } elseif ($action === 'check-availability') {
            handleCheckAvailability($db);
        } elseif ($action === '' || $action === '/') {
            handleCreateBooking($db);
        } else {
            error_response('Invalid bookings endpoint', 404);
        }
        break;
    case 'PUT':
        if (is_numeric($action) && isset($segments[1]) && $segments[1] === 'cancel') {
            handleCancelBooking($db, (int)$action);
        } else {
            error_response('Invalid bookings endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function generateBookingRef(PDO $db, ?string $destination_slug): string {
    $code = 'GEN';
    if ($destination_slug) {
        $code = strtoupper(substr(preg_replace('/[^a-z]/', '', strtolower($destination_slug)), 0, 3));
        if (strlen($code) < 3) {
            $code = str_pad($code, 3, 'X');
        }
    }

    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do {
        $random = '';
        for ($i = 0; $i < 6; $i++) {
            $random .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $ref = "BH-{$code}-{$random}";

        $stmt = $db->prepare("SELECT id FROM bookings WHERE booking_ref = ?");
        $stmt->execute([$ref]);
    } while ($stmt->fetch());

    return $ref;
}

function handleCreateBooking(PDO $db): void {
    $auth = require_auth();
    $data = get_json_body();

    $boat_id        = (int)($data['boat_id'] ?? 0);
    $booking_date   = sanitize($data['booking_date'] ?? '');
    $time_slot      = sanitize($data['time_slot'] ?? '');
    $passengers     = (int)($data['passengers'] ?? 0);
    $customer_name  = sanitize($data['customer_name'] ?? '');
    $customer_email = sanitize($data['customer_email'] ?? '');
    $customer_phone = sanitize($data['customer_phone'] ?? '');
    $pickup_location = sanitize($data['pickup_location'] ?? '');
    $special_request = sanitize($data['special_request'] ?? '');
    $addons_input   = $data['addons'] ?? $data['addon_ids'] ?? [];
    if (!is_array($addons_input)) {
        $addons_input = [];
    }
    // Normalize: addons can be [{id, quantity}] or legacy [id, id, ...]
    $addons_list = [];
    foreach ($addons_input as $a) {
        if (is_array($a) && isset($a['id'])) {
            $addons_list[] = ['id' => (int)$a['id'], 'quantity' => max(1, (int)($a['quantity'] ?? 1))];
        } elseif (is_numeric($a)) {
            $addons_list[] = ['id' => (int)$a, 'quantity' => 1];
        }
    }

    if (!$boat_id || empty($booking_date) || empty($time_slot) || $passengers < 1) {
        error_response('boat_id, booking_date, time_slot and passengers (>=1) are required');
    }
    if (empty($customer_name) || empty($customer_email)) {
        error_response('customer_name and customer_email are required');
    }
    if (empty($customer_phone)) {
        $customer_phone = '-';
    }

    try {
        $stmt = $db->prepare(
            "SELECT b.*, d.slug AS destination_slug, d.id AS dest_id
             FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             WHERE b.id = ? AND b.status = 'active'"
        );
        $stmt->execute([$boat_id]);
        $boat = $stmt->fetch();
        if (!$boat) {
            error_response('Boat not found or inactive', 404);
        }

        $stmt = $db->prepare(
            "SELECT id, max_seats, booked_seats, is_available, price_override
             FROM availability
             WHERE boat_id = ? AND date = ? AND time_slot = ? AND is_available = 1"
        );
        $stmt->execute([$boat_id, $booking_date, $time_slot]);
        $slot = $stmt->fetch();

        if (!$slot) {
            $cap = (int)($boat['capacity'] ?? 20);
            $ins = $db->prepare(
                "INSERT INTO availability (boat_id, date, time_slot, max_seats, booked_seats, is_available)
                 VALUES (?, ?, ?, ?, 0, 1)"
            );
            $ins->execute([$boat_id, $booking_date, $time_slot, $cap]);
            $stmt->execute([$boat_id, $booking_date, $time_slot]);
            $slot = $stmt->fetch();
            if (!$slot) {
                error_response('Time slot not available for this date');
            }
        }

        $remaining = $slot['max_seats'] - $slot['booked_seats'];
        if ($passengers > $remaining) {
            error_response("Only {$remaining} seats remaining for this time slot");
        }

        $unit_price = $slot['price_override'] ? (float)$slot['price_override'] : (float)$boat['price'];
        require_once __DIR__ . '/config/pricing-helpers.php';
        $multiplier = getActiveMultiplierForDate($db, $booking_date);
        $unit_price = round($unit_price * $multiplier, 2);
        $total_amount = $unit_price * $passengers;

        $addons_total = 0;
        $selected_addons = [];
        if (!empty($addons_list)) {
            $ids = array_unique(array_column($addons_list, 'id'));
            $qty_map = [];
            foreach ($addons_list as $a) {
                $qty_map[(int)$a['id']] = ($qty_map[(int)$a['id']] ?? 0) + (int)($a['quantity'] ?? 1);
            }
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare(
                "SELECT id, name_en, name_th, price FROM addons
                 WHERE id IN ({$placeholders}) AND boat_id = ? AND is_active = 1"
            );
            $stmt->execute(array_merge($ids, [$boat_id]));
            $rows = $stmt->fetchAll();

            foreach ($rows as $addon) {
                $qty = $qty_map[(int)$addon['id']] ?? 1;
                $selected_addons[] = [
                    'id' => (int)$addon['id'],
                    'name' => $addon['name_en'] ?: $addon['name_th'],
                    'price' => (float)$addon['price'],
                    'quantity' => $qty,
                    'subtotal' => (float)$addon['price'] * $qty
                ];
                $addons_total += (float)$addon['price'] * $qty;
            }
        }

        $total_amount += $addons_total;

        $booking_addons_json = !empty($selected_addons)
            ? json_encode($selected_addons, JSON_UNESCAPED_UNICODE)
            : null;

        $booking_ref = generateBookingRef($db, $boat['destination_slug'] ?? null);

        $db->beginTransaction();

        $has_addons_col = false;
        $has_pickup_col = false;
        try {
            $cols = $db->query("SHOW COLUMNS FROM bookings LIKE 'booking_addons'")->fetchAll();
            $has_addons_col = count($cols) > 0;
            $cols2 = $db->query("SHOW COLUMNS FROM bookings LIKE 'pickup_location'")->fetchAll();
            $has_pickup_col = count($cols2) > 0;
        } catch (PDOException $e) {}

        if ($has_addons_col && $has_pickup_col) {
            $stmt = $db->prepare(
                "INSERT INTO bookings
                    (booking_ref, user_id, boat_id, destination_id, booking_date, time_slot,
                     passengers, customer_name, customer_email, customer_phone,
                     special_request, pickup_location, booking_addons, total_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $booking_ref, $auth['user_id'], $boat_id, $boat['dest_id'],
                $booking_date, $time_slot, $passengers,
                $customer_name, $customer_email, $customer_phone,
                $special_request ?: null, $pickup_location ?: null, $booking_addons_json, $total_amount
            ]);
        } elseif ($has_addons_col) {
            $stmt = $db->prepare(
                "INSERT INTO bookings
                    (booking_ref, user_id, boat_id, destination_id, booking_date, time_slot,
                     passengers, customer_name, customer_email, customer_phone,
                     special_request, booking_addons, total_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $booking_ref, $auth['user_id'], $boat_id, $boat['dest_id'],
                $booking_date, $time_slot, $passengers,
                $customer_name, $customer_email, $customer_phone,
                $special_request ?: null, $booking_addons_json, $total_amount
            ]);
        } elseif ($has_pickup_col) {
            $stmt = $db->prepare(
                "INSERT INTO bookings
                    (booking_ref, user_id, boat_id, destination_id, booking_date, time_slot,
                     passengers, customer_name, customer_email, customer_phone,
                     special_request, pickup_location, total_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $booking_ref, $auth['user_id'], $boat_id, $boat['dest_id'],
                $booking_date, $time_slot, $passengers,
                $customer_name, $customer_email, $customer_phone,
                $special_request ?: null, $pickup_location ?: null, $total_amount
            ]);
        } else {
            $stmt = $db->prepare(
                "INSERT INTO bookings
                    (booking_ref, user_id, boat_id, destination_id, booking_date, time_slot,
                     passengers, customer_name, customer_email, customer_phone,
                     special_request, total_amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $booking_ref, $auth['user_id'], $boat_id, $boat['dest_id'],
                $booking_date, $time_slot, $passengers,
                $customer_name, $customer_email, $customer_phone,
                $special_request ?: null, $total_amount
            ]);
        }
        $booking_id = (int)$db->lastInsertId();

        try {
            $opId = (int)($boat['operator_id'] ?? 0);
            if ($opId > 0) {
                $notif = $db->prepare("INSERT INTO operator_notifications (operator_id, title, message, notif_type, ref_id, status) VALUES (?, ?, ?, 'new_booking', ?, 'new')");
                $notif->execute([
                    $opId,
                    'การจองใหม่ ' . $booking_ref,
                    $customer_name . ' จอง ' . $passengers . ' ที่นั่ง วันที่ ' . $booking_date . ' ' . $time_slot,
                    $booking_id
                ]);
            }
        } catch (PDOException $e) {}

        $stmt = $db->prepare(
            "UPDATE availability SET booked_seats = booked_seats + ? WHERE id = ?"
        );
        $stmt->execute([$passengers, $slot['id']]);

        $db->commit();

        createNotification($db, $auth['user_id'], 'booking',
            'การจองสำเร็จ / Booking Confirmed',
            "Ref: {$booking_ref} | {$booking_date} {$time_slot} | " . number_format($total_amount) . " THB"
        );

        success_response([
            'booking_id'   => $booking_id,
            'booking_ref'  => $booking_ref,
            'total_amount' => $total_amount,
            'addons_total' => $addons_total,
            'addons'       => $selected_addons,
            'status'       => 'pending'
        ], 'Booking created successfully', 201);

    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to create booking: ' . $e->getMessage(), 500);
    }
}

function handleListBookings(PDO $db): void {
    $auth = require_auth();
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;
    $status = get_param('status');

    $where = "bk.user_id = ?";
    $params = [$auth['user_id']];

    if ($status) {
        $where .= " AND bk.status = ?";
        $params[] = $status;
    }

    try {
        $count_stmt = $db->prepare("SELECT COUNT(*) AS total FROM bookings bk WHERE {$where}");
        $count_stmt->execute($params);
        $total = (int)$count_stmt->fetch()['total'];

        $stmt = $db->prepare(
            "SELECT bk.id, bk.booking_ref, bk.booking_date, bk.time_slot,
                    bk.passengers, bk.customer_name, bk.customer_phone, bk.pickup_location, bk.total_amount,
                    bk.status, bk.created_at,
                    bt.name AS boat_name, bt.boat_type, bt.duration, bt.price AS unit_price,
                    bt.pier_name, bt.pier_name_th,
                    d.name AS destination_name, d.name_th AS destination_name_th,
                    o.company_name AS operator_name,
                    bi.image_url AS boat_image,
                    pay.status AS payment_status, pay.method AS payment_method
             FROM bookings bk
             JOIN boats bt ON bk.boat_id = bt.id
             LEFT JOIN destinations d ON bk.destination_id = d.id
             LEFT JOIN operators o ON bt.operator_id = o.id
             LEFT JOIN boat_images bi ON bt.id = bi.boat_id AND bi.is_primary = 1
             LEFT JOIN payments pay ON bk.id = pay.booking_id
             WHERE {$where}
             ORDER BY bk.created_at DESC
             LIMIT ? OFFSET ?"
        );
        $q_params = array_merge($params, [$limit, $offset]);
        $stmt->execute($q_params);
        $bookings = $stmt->fetchAll();

        success_response([
            'bookings' => $bookings,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch bookings: ' . $e->getMessage(), 500);
    }
}

function handleBookingDetail(PDO $db, int $id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare(
            "SELECT bk.*,
                    bt.name AS boat_name, bt.boat_type, bt.duration,
                    bt.description AS boat_description, bt.description_th AS boat_description_th,
                    bt.route, bt.route_th, bt.pier_name, bt.pier_name_th,
                    d.name AS destination_name, d.name_th AS destination_name_th,
                    d.latitude AS destination_lat, d.longitude AS destination_lng,
                    o.company_name AS operator_name, o.contact_phone AS operator_phone,
                    bi.image_url AS boat_image
             FROM bookings bk
             JOIN boats bt ON bk.boat_id = bt.id
             LEFT JOIN destinations d ON bk.destination_id = d.id
             LEFT JOIN operators o ON bt.operator_id = o.id
             LEFT JOIN boat_images bi ON bt.id = bi.boat_id AND bi.is_primary = 1
             WHERE bk.id = ?"
        );
        $stmt->execute([$id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            error_response('Booking not found', 404);
        }

        if ($booking['user_id'] != $auth['user_id'] && $auth['role'] !== 'admin') {
            error_response('Forbidden', 403);
        }

        $pay = $db->prepare(
            "SELECT id, method, amount, status, transaction_ref
             FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1"
        );
        $pay->execute([$id]);
        $booking['payment'] = $pay->fetch() ?: null;

        $tip = $db->prepare("SELECT amount, payment_method, created_at FROM booking_tips WHERE booking_id = ? LIMIT 1");
        $tip->execute([$id]);
        $tipRow = $tip->fetch();
        $booking['tip_given'] = $tipRow ? true : false;
        $booking['tip_amount'] = $tipRow ? (float)$tipRow['amount'] : null;
        $booking['tip_at'] = $tipRow ? $tipRow['created_at'] : null;

        $rev = $db->prepare("SELECT id FROM reviews WHERE user_id = ? AND boat_id = ? LIMIT 1");
        $rev->execute([$auth['user_id'], $booking['boat_id']]);
        $booking['has_reviewed'] = $rev->fetch() ? true : false;

        success_response($booking);
    } catch (PDOException $e) {
        error_response('Failed to fetch booking: ' . $e->getMessage(), 500);
    }
}

function handleCancelBooking(PDO $db, int $id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$id]);
        $booking = $stmt->fetch();

        if (!$booking) {
            error_response('Booking not found', 404);
        }
        if ($booking['user_id'] != $auth['user_id'] && $auth['role'] !== 'admin') {
            error_response('Forbidden', 403);
        }
        if (in_array($booking['status'], ['completed', 'cancelled'])) {
            error_response('Cannot cancel this booking');
        }

        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$id]);

        $stmt = $db->prepare(
            "UPDATE availability
             SET booked_seats = GREATEST(booked_seats - ?, 0)
             WHERE boat_id = ? AND date = ? AND time_slot = ?"
        );
        $stmt->execute([
            $booking['passengers'],
            $booking['boat_id'],
            $booking['booking_date'],
            $booking['time_slot']
        ]);

        $db->commit();

        createNotification($db, $auth['user_id'], 'cancel',
            'ยกเลิกการจอง / Booking Cancelled',
            "Ref: " . ($booking['booking_ref'] ?? '') . " | " . ($booking['booking_date'] ?? '')
        );

        success_response(['status' => 'cancelled'], 'Booking cancelled');
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to cancel booking: ' . $e->getMessage(), 500);
    }
}

function handleAddTip(PDO $db, int $booking_id): void {
    if (!is_tip_system_enabled()) {
        error_response('ระบบทิปปิดใช้งานอยู่', 403);
    }
    $auth = require_auth();
    $data = get_json_body();
    $amount = (float)($data['amount'] ?? 0);
    $message = sanitize($data['message'] ?? '');
    $payment_method = sanitize($data['payment_method'] ?? 'cash');
    if (!in_array($payment_method, ['cash', 'promptpay', 'qr', 'card'])) $payment_method = 'cash';

    if ($amount <= 0) error_response('กรุณาระบุจำนวนทิป');

    try {
        $stmt = $db->prepare("SELECT bk.*, bt.operator_id FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bk.id = ?");
        $stmt->execute([$booking_id]);
        $b = $stmt->fetch();
        if (!$b) error_response('ไม่พบการจอง', 404);
        if ($b['user_id'] != $auth['user_id']) error_response('เฉพาะผู้จองเท่านั้นที่ให้ทิปได้', 403);
        if (!in_array($b['status'], ['confirmed', 'completed'])) error_response('สามารถให้ทิปได้หลังการจองยืนยันหรือเสร็จสิ้น');

        $exist = $db->prepare("SELECT id FROM booking_tips WHERE booking_id = ? LIMIT 1");
        $exist->execute([$booking_id]);
        if ($exist->fetch()) error_response('การจองนี้ได้รับทิปแล้ว', 400);

        $tip_id = null;
        try {
            $db->query("SELECT payment_method FROM booking_tips LIMIT 1");
            $db->prepare("INSERT INTO booking_tips (booking_id, boat_id, operator_id, amount, message, payment_method) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$booking_id, $b['boat_id'], $b['operator_id'], $amount, $message ?: null, $payment_method]);
            $tip_id = (int)$db->lastInsertId();
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'payment_method') !== false) {
                $db->prepare("INSERT INTO booking_tips (booking_id, boat_id, operator_id, amount, message) VALUES (?, ?, ?, ?, ?)")
                    ->execute([$booking_id, $b['boat_id'], $b['operator_id'], $amount, $message ?: null]);
                $tip_id = (int)$db->lastInsertId();
            } else {
                throw $e;
            }
        }

        if ($tip_id > 0) {
            try {
                $db->query("SELECT 1 FROM tip_distribution LIMIT 1");
                $captain_amt = round($amount * 0.5, 2);
                $staff_amt = round($amount * 0.3, 2);
                $platform_amt = round($amount * 0.2, 2);
                $ins = $db->prepare("INSERT INTO tip_distribution (tip_id, recipient_type, recipient_id, amount) VALUES (?, ?, ?, ?)");
                $ins->execute([$tip_id, 'captain', $b['operator_id'], $captain_amt]);
                $ins->execute([$tip_id, 'staff', $b['operator_id'], $staff_amt]);
                $ins->execute([$tip_id, 'platform', null, $platform_amt]);
            } catch (PDOException $e) {}
        }

        if ($tip_id > 0 && file_exists(__DIR__ . '/config/revenue-helpers.php')) {
            require_once __DIR__ . '/config/revenue-helpers.php';
            record_tip_revenue($db, $tip_id, $amount, (int)$b['operator_id']);
        }

        try {
            $notif = $db->prepare("INSERT INTO operator_notifications (operator_id, title, message, notif_type, ref_id, status) VALUES (?, ?, ?, 'tip', ?, 'new')");
            $notif->execute([
                $b['operator_id'],
                'ลูกค้าให้ทิป ฿' . number_format($amount),
                $message ?: 'ขอบคุณสำหรับบริการที่ดี',
                $booking_id
            ]);
        } catch (PDOException $e) {}

        success_response(['amount' => $amount], 'ขอบคุณสำหรับทิป!');
    } catch (PDOException $e) {
        error_response('Failed to add tip: ' . $e->getMessage(), 500);
    }
}

function handleCheckAvailability(PDO $db): void {
    $data = get_json_body();
    $boat_id = (int)($data['boat_id'] ?? 0);
    $date    = sanitize($data['date'] ?? '');

    if (!$boat_id || empty($date)) {
        error_response('boat_id and date are required');
    }

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
        $slots = $stmt->fetchAll();

        success_response([
            'boat_id' => $boat_id,
            'date'    => $date,
            'slots'   => $slots
        ]);
    } catch (PDOException $e) {
        error_response('Availability check failed: ' . $e->getMessage(), 500);
    }
}

function createNotification(PDO $db, int $userId, string $type, string $title, string $body): void {
    try {
        $stmt = $db->prepare(
            "INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
             VALUES (?, ?, ?, ?, 0, NOW())"
        );
        $stmt->execute([$userId, $type, $title, $body]);
    } catch (PDOException $e) {
        // Silently fail - notification creation shouldn't block the main operation
    }
}
