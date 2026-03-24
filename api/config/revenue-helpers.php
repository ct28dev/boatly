<?php
/**
 * Revenue Helpers - บันทึกลง revenues (ไม่แก้ payments เดิม)
 * เรียกใช้: record_booking_revenue($db, $booking_id, $amount, $operator_id)
 */

function record_booking_revenue(PDO $db, int $booking_id, float $amount, ?int $operator_id, string $type = 'commission'): void {
    $commission = round($amount * 0.15, 2);
    $platform = round($amount * 0.05, 2);
    try {
        $db->query("SELECT 1 FROM revenues LIMIT 1");
        $ins = $db->prepare("INSERT INTO revenues (type, amount, reference_id, operator_id) VALUES (?, ?, ?, ?)");
        $ins->execute(['commission', $commission, $booking_id, $operator_id]);
        $ins->execute(['platform_fee', $platform, $booking_id, $operator_id]);
    } catch (PDOException $e) {}
}

function record_tip_revenue(PDO $db, int $tip_id, float $amount, ?int $operator_id): void {
    $platform = round($amount * 0.2, 2);
    try {
        $db->prepare("INSERT INTO revenues (type, amount, reference_id, operator_id) VALUES ('tip', ?, ?, ?)")
            ->execute([$platform, $tip_id, $operator_id]);
    } catch (PDOException $e) {}
}
