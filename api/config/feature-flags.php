<?php
/**
 * Feature Flags - Production Toggle
 * อ่านจาก feature_flags table (ไม่แก้ settings เดิม)
 */

function is_feature_active(PDO $db, string $key): bool {
    try {
        $stmt = $db->prepare("SELECT is_active FROM feature_flags WHERE `key` = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? (bool)$row['is_active'] : false;
    } catch (PDOException $e) {
        return false;
    }
}

function get_all_feature_flags(PDO $db): array {
    try {
        $stmt = $db->query("SELECT `key`, is_active FROM feature_flags");
        $rows = $stmt->fetchAll();
        $out = [];
        foreach ($rows as $r) $out[$r['key']] = (bool)$r['is_active'];
        return $out;
    } catch (PDOException $e) {
        return [];
    }
}
