<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';
$sub = $segments[1] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'webhook') {
            handlePaymentWebhook($db);
        } elseif ($action === '' || $action === '/') {
            handleCreatePayment($db);
        } else {
            error_response('Invalid payments endpoint', 404);
        }
        break;
    case 'GET':
        if (is_numeric($action) && $sub === 'status') {
            handleGetPaymentStatus($db, (int)$action);
        } elseif (is_numeric($action)) {
            handleGetPayment($db, (int)$action);
        } else {
            error_response('Invalid payments endpoint', 404);
        }
        break;
    case 'PUT':
        if (is_numeric($action) && isset($segments[1])) {
            if ($segments[1] === 'confirm') {
                handleConfirmPayment($db, (int)$action);
            } elseif ($segments[1] === 'refund') {
                handleRefundPayment($db, (int)$action);
            } else {
                error_response('Invalid payments endpoint', 404);
            }
        } else {
            error_response('Invalid payments endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleCreatePayment(PDO $db): void {
    $auth = require_auth();
    $data = get_json_body();

    $booking_id = (int)($data['booking_id'] ?? 0);
    $raw_method = sanitize($data['payment_method'] ?? 'qr');
    $method_map = ['qr' => 'promptpay', 'card' => 'credit_card', 'cod' => 'cash',
                   'promptpay' => 'promptpay', 'credit_card' => 'credit_card',
                   'bank_transfer' => 'bank_transfer', 'cash' => 'cash'];
    $payment_method = $method_map[$raw_method] ?? 'promptpay';

    if (!$booking_id) {
        error_response('booking_id is required');
    }

    try {
        $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?");
        $stmt->execute([$booking_id, $auth['user_id']]);
        $booking = $stmt->fetch();

        if (!$booking) {
            error_response('Booking not found', 404);
        }

        if ($booking['status'] === 'cancelled') {
            error_response('Cannot pay for cancelled booking');
        }

        $stmt = $db->prepare("SELECT id FROM payments WHERE booking_id = ? AND status = 'paid'");
        $stmt->execute([$booking_id]);
        if ($stmt->fetch()) {
            error_response('Booking already paid');
        }

        $transaction_ref = 'BH' . date('Ymd') . strtoupper(substr(md5(uniqid()), 0, 8));

        $stmt = $db->prepare(
            "INSERT INTO payments (booking_id, method, amount, status, transaction_ref, created_at, updated_at)
             VALUES (?, ?, ?, 'pending', ?, NOW(), NOW())"
        );
        $stmt->execute([$booking_id, $payment_method, $booking['total_amount'], $transaction_ref]);
        $payment_id = (int)$db->lastInsertId();

        success_response([
            'payment_id' => $payment_id,
            'transaction_ref' => $transaction_ref,
            'amount' => (float)$booking['total_amount'],
            'payment_method' => $payment_method,
            'status' => 'pending'
        ], 'Payment created', 201);
    } catch (PDOException $e) {
        error_response('Failed to create payment: ' . $e->getMessage(), 500);
    }
}

function handleGetPayment(PDO $db, int $booking_id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare(
            "SELECT pay.*, b.status as booking_status, b.total_amount as booking_amount
             FROM payments pay
             JOIN bookings b ON pay.booking_id = b.id
             WHERE pay.booking_id = ? AND b.user_id = ?
             ORDER BY pay.created_at DESC LIMIT 1"
        );
        $stmt->execute([$booking_id, $auth['user_id']]);
        $payment = $stmt->fetch();

        if (!$payment) {
            error_response('Payment not found', 404);
        }

        success_response($payment);
    } catch (PDOException $e) {
        error_response('Failed to fetch payment: ' . $e->getMessage(), 500);
    }
}

function handleConfirmPayment(PDO $db, int $id): void {
    $auth = require_auth();
    ensurePaymentColumns($db);

    try {
        $stmt = $db->prepare(
            "SELECT pay.*, b.user_id, b.id as booking_id, b.boat_id, bt.operator_id
             FROM payments pay
             JOIN bookings b ON pay.booking_id = b.id
             JOIN boats bt ON b.boat_id = bt.id
             WHERE pay.id = ?"
        );
        $stmt->execute([$id]);
        $payment = $stmt->fetch();

        if (!$payment) error_response('Payment not found', 404);
        if ($payment['status'] !== 'pending') error_response('Payment is not in pending status');

        $can_confirm = false;
        if ($auth['role'] === 'admin') $can_confirm = true;
        elseif ($auth['role'] === 'operator') {
            $op_stmt = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
            $op_stmt->execute([$auth['user_id']]);
            $op = $op_stmt->fetch();
            if ($op && (int)$payment['operator_id'] === (int)$op['id']) $can_confirm = true;
        }

        if (!$can_confirm) {
            error_response('เฉพาะผู้ให้บริการหรือแอดมินเท่านั้นที่ยืนยันการชำระเงินได้ กรุณารอการยืนยันจากธนาคารหรือติดต่อผู้ให้บริการ', 403);
        }

        $db->beginTransaction();
        $db->prepare("UPDATE payments SET status = 'paid', verified_at = NOW(), verified_source = ? WHERE id = ?")->execute([$auth['role'], $id]);
        $db->prepare("UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = ?")->execute([$payment['booking_id']]);
        $notifBody = buildPaymentSuccessNotificationBody($db, (int)$payment['booking_id'], (float)$payment['amount'], $payment['transaction_ref'] ?? '');
        $db->prepare("INSERT INTO notifications (user_id, title, body, type, created_at) VALUES (?, 'ชำระเงินสำเร็จ', ?, 'payment', NOW())")->execute([
            $payment['user_id'],
            $notifBody
        ]);
        $db->commit();

        if (file_exists(__DIR__ . '/config/revenue-helpers.php')) {
            require_once __DIR__ . '/config/revenue-helpers.php';
            $b = $db->prepare("SELECT bt.operator_id FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bk.id = ?");
            $b->execute([$payment['booking_id']]);
            $row = $b->fetch();
            record_booking_revenue($db, (int)$payment['booking_id'], (float)$payment['amount'], $row ? (int)$row['operator_id'] : null);
        }

        success_response([
            'payment_status' => 'paid',
            'booking_status' => 'confirmed'
        ], 'Payment confirmed');
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to confirm payment: ' . $e->getMessage(), 500);
    }
}

function ensurePaymentColumns(PDO $db): void {
    try {
        $cols = $db->query("SHOW COLUMNS FROM payments LIKE 'verified_at'")->fetch();
        if (!$cols) {
            $db->exec("ALTER TABLE payments ADD COLUMN verified_at DATETIME NULL, ADD COLUMN verified_source VARCHAR(50) NULL, ADD COLUMN external_ref VARCHAR(255) NULL");
        }
    } catch (PDOException $e) {}
}

/** สร้างข้อความแจ้งลูกค้าเมื่อชำระเงินสำเร็จ พร้อมรายละเอียดการบริการ */
function buildPaymentSuccessNotificationBody(PDO $db, int $booking_id, float $amount, string $transaction_ref): string {
    $stmt = $db->prepare(
        "SELECT bk.booking_ref, bk.booking_date, bk.time_slot, bk.pickup_location,
                bt.name AS boat_name, bt.pier_name, bt.pier_name_th
         FROM bookings bk
         JOIN boats bt ON bk.boat_id = bt.id
         WHERE bk.id = ?"
    );
    $stmt->execute([$booking_id]);
    $b = $stmt->fetch();
    $lines = ["ชำระเงิน ฿" . number_format($amount, 2) . " สำเร็จ (Ref: {$transaction_ref})"];
    if ($b) {
        $lines[] = "รายละเอียดการจอง:";
        if (!empty($b['boat_name'])) $lines[] = "• เรือ: " . $b['boat_name'];
        if (!empty($b['booking_date'])) $lines[] = "• วันที่: " . $b['booking_date'];
        if (!empty($b['time_slot'])) $lines[] = "• เวลา: " . $b['time_slot'];
        $loc = trim($b['pickup_location'] ?? '') ?: ($b['pier_name_th'] ?? $b['pier_name'] ?? '');
        if ($loc) $lines[] = "• สถานที่รับ/ส่ง: " . $loc;
    }
    return implode("\n", $lines);
}

function handleGetPaymentStatus(PDO $db, int $payment_id): void {
    $auth = require_auth();
    try {
        $stmt = $db->prepare(
            "SELECT pay.id, pay.status, pay.amount, pay.transaction_ref, pay.verified_at, pay.verified_source, b.id as booking_id, b.status as booking_status, b.booking_ref
             FROM payments pay
             JOIN bookings b ON pay.booking_id = b.id
             WHERE pay.id = ? AND b.user_id = ?"
        );
        $stmt->execute([$payment_id, $auth['user_id']]);
        $payment = $stmt->fetch();
        if (!$payment) error_response('Payment not found', 404);
        success_response([
            'payment_id' => (int)$payment['id'],
            'status' => $payment['status'],
            'amount' => (float)$payment['amount'],
            'transaction_ref' => $payment['transaction_ref'],
            'booking_status' => $payment['booking_status'],
            'booking_ref' => $payment['booking_ref'],
            'verified_at' => $payment['verified_at'],
            'verified_source' => $payment['verified_source']
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch payment status: ' . $e->getMessage(), 500);
    }
}

function handlePaymentWebhook(PDO $db): void {
    ensurePaymentColumns($db);
    $data = get_json_body();
    $transaction_ref = trim($data['transaction_ref'] ?? $data['ref'] ?? '');
    $amount = (float)($data['amount'] ?? 0);
    $status = strtolower(trim($data['status'] ?? $data['payment_status'] ?? ''));
    $external_ref = trim($data['external_ref'] ?? $data['bank_ref'] ?? $data['transaction_id'] ?? '');
    $secret = trim($data['webhook_secret'] ?? $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '');
    $expected_secret = defined('PAYMENT_WEBHOOK_SECRET') ? PAYMENT_WEBHOOK_SECRET : (getenv('PAYMENT_WEBHOOK_SECRET') ?: '');
    if ($expected_secret && !hash_equals($expected_secret, $secret)) {
        error_response('Invalid webhook secret', 403);
    }
    if (!$transaction_ref) error_response('transaction_ref required');
    if (!in_array($status, ['paid', 'success', 'completed'])) {
        success_response(['received' => true, 'message' => 'Status not paid, ignored']);
        return;
    }
    try {
        $stmt = $db->prepare("SELECT pay.*, b.user_id FROM payments pay JOIN bookings b ON pay.booking_id = b.id WHERE pay.transaction_ref = ? AND pay.status = 'pending'");
        $stmt->execute([$transaction_ref]);
        $payment = $stmt->fetch();
        if (!$payment) {
            success_response(['received' => true, 'message' => 'Payment not found or already processed']);
            return;
        }
        if ($amount > 0 && abs((float)$payment['amount'] - $amount) > 0.01) {
            error_response('Amount mismatch', 400);
        }
        $db->beginTransaction();
        $db->prepare("UPDATE payments SET status = 'paid', verified_at = NOW(), verified_source = 'webhook', external_ref = ? WHERE id = ?")->execute([$external_ref ?: null, $payment['id']]);
        $db->prepare("UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = ?")->execute([$payment['booking_id']]);
        $notifBody = buildPaymentSuccessNotificationBody($db, (int)$payment['booking_id'], (float)$payment['amount'], $payment['transaction_ref'] ?? '');
        $db->prepare("INSERT INTO notifications (user_id, title, body, type, created_at) VALUES (?, 'ชำระเงินสำเร็จ', ?, 'payment', NOW())")->execute([
            $payment['user_id'],
            $notifBody
        ]);
        $db->commit();
        success_response(['received' => true, 'payment_id' => (int)$payment['id'], 'booking_id' => (int)$payment['booking_id']], 'Payment verified', 201);
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Webhook processing failed: ' . $e->getMessage(), 500);
    }
}

function handleRefundPayment(PDO $db, int $id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare(
            "SELECT pay.*, b.user_id, b.id as booking_id
             FROM payments pay
             JOIN bookings b ON pay.booking_id = b.id
             WHERE pay.id = ?"
        );
        $stmt->execute([$id]);
        $payment = $stmt->fetch();

        if (!$payment) error_response('Payment not found', 404);
        if ($payment['status'] !== 'paid') error_response('Only paid payments can be refunded');

        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);

        $stmt = $db->prepare("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$payment['booking_id']]);

        $stmt = $db->prepare(
            "INSERT INTO notifications (user_id, title, body, type, created_at)
             VALUES (?, 'คืนเงินสำเร็จ', ?, 'payment', NOW())"
        );
        $stmt->execute([
            $payment['user_id'],
            "คืนเงิน ฿" . number_format($payment['amount'], 2) . " เรียบร้อยแล้ว"
        ]);

        $db->commit();

        success_response([
            'payment_status' => 'refunded',
            'booking_status' => 'cancelled'
        ], 'Refund processed');
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to process refund: ' . $e->getMessage(), 500);
    }
}
