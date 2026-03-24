<?php
/**
 * Messages API
 * GET /bookings/{id}/messages - list messages for a booking
 * POST /bookings/{id}/messages - send message (auth required)
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];

// Expect: /bookings/{id}/messages -> segments = [id, messages]
$bookingId = isset($segments[0]) && is_numeric($segments[0]) ? (int)$segments[0] : 0;
if ($bookingId <= 0) {
    error_response('Invalid booking id', 404);
}

function canAccessBooking(PDO $db, int $bookingId, array $auth): bool {
    $stmt = $db->prepare("SELECT bk.id, bk.user_id, bt.operator_id FROM bookings bk JOIN boats bt ON bk.boat_id = bt.id WHERE bk.id = ?");
    $stmt->execute([$bookingId]);
    $row = $stmt->fetch();
    if (!$row) return false;
    if ($auth['role'] === 'admin') return true;
    if ((int)$row['user_id'] === (int)$auth['user_id']) return true;
    if ($auth['role'] === 'operator') {
        $op = $db->prepare("SELECT id FROM operators WHERE user_id = ?");
        $op->execute([$auth['user_id']]);
        $opRow = $op->fetch();
        return $opRow && (int)$row['operator_id'] === (int)$opRow['id'];
    }
    return false;
}

switch ($method) {
    case 'GET':
        $auth = require_auth();
        if (!canAccessBooking($db, $bookingId, $auth)) {
            error_response('Forbidden', 403);
        }
        try {
            $stmt = $db->prepare(
                "SELECT id, booking_id, sender_type, sender_id, message, created_at
                 FROM messages WHERE booking_id = ? ORDER BY created_at ASC"
            );
            $stmt->execute([$bookingId]);
            $messages = $stmt->fetchAll();
            success_response($messages);
        } catch (PDOException $e) {
            error_response('Failed to fetch messages: ' . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        $auth = require_auth();
        if (!canAccessBooking($db, $bookingId, $auth)) {
            error_response('Forbidden', 403);
        }
        $data = get_json_body();
        $message = trim($data['message'] ?? '');
        $senderType = sanitize($data['sender_type'] ?? 'customer');
        $allowedTypes = ['customer', 'crew', 'system'];
        if (!in_array($senderType, $allowedTypes)) {
            $senderType = $auth['role'] === 'operator' ? 'crew' : 'customer';
        }
        if (empty($message)) {
            error_response('Message is required');
        }
        try {
            $senderId = ($senderType === 'customer' || $senderType === 'crew') ? $auth['user_id'] : null;
            $stmt = $db->prepare(
                "INSERT INTO messages (booking_id, sender_type, sender_id, message, created_at) VALUES (?, ?, ?, ?, NOW())"
            );
            $stmt->execute([$bookingId, $senderType, $senderId, $message]);
            $id = (int)$db->lastInsertId();
            $row = $db->prepare("SELECT id, booking_id, sender_type, sender_id, message, created_at FROM messages WHERE id = ?");
            $row->execute([$id]);
            $msg = $row->fetch();
            success_response($msg, 'Message sent', 201);
        } catch (PDOException $e) {
            error_response('Failed to send message: ' . $e->getMessage(), 500);
        }
        break;

    default:
        error_response('Method not allowed', 405);
}
