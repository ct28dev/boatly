<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        handleListAddons($db);
        break;
    case 'POST':
        handleCreateAddon($db);
        break;
    case 'PUT':
        if (is_numeric($action)) {
            handleUpdateAddon($db, (int)$action);
        } else {
            error_response('Invalid addons endpoint', 404);
        }
        break;
    case 'DELETE':
        if (is_numeric($action)) {
            handleDeleteAddon($db, (int)$action);
        } else {
            error_response('Invalid addons endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleListAddons(PDO $db): void {
    $boat_id = get_param('boat_id');

    if (!$boat_id || !is_numeric($boat_id)) {
        error_response('boat_id query parameter is required');
    }

    try {
        $stmt = $db->prepare(
            "SELECT id, boat_id, name_th, name_en, name_zh, name_ko, name_fr,
                    description_th, description_en, price, icon, is_active, sort_order
             FROM addons
             WHERE boat_id = ? AND is_active = 1
             ORDER BY sort_order ASC, id ASC"
        );
        $stmt->execute([(int)$boat_id]);
        $addons = $stmt->fetchAll();

        success_response($addons);
    } catch (PDOException $e) {
        success_response([]);
    }
}

function verifyBoatOwnership(PDO $db, int $boat_id, array $auth): void {
    $stmt = $db->prepare("SELECT id, operator_id FROM boats WHERE id = ?");
    $stmt->execute([$boat_id]);
    $boat = $stmt->fetch();

    if (!$boat) {
        error_response('Boat not found', 404);
    }

    if ($auth['role'] === 'admin') {
        return;
    }

    $stmt = $db->prepare("SELECT id FROM operators WHERE id = ? AND user_id = ?");
    $stmt->execute([$boat['operator_id'], $auth['user_id']]);
    if (!$stmt->fetch()) {
        error_response('You do not have permission for this boat', 403);
    }
}

function handleCreateAddon(PDO $db): void {
    $auth = require_role('operator');
    $data = get_json_body();

    $boat_id = (int)($data['boat_id'] ?? 0);
    if (!$boat_id) {
        error_response('boat_id is required');
    }

    verifyBoatOwnership($db, $boat_id, $auth);

    $name_en = sanitize($data['name_en'] ?? '');
    if (empty($name_en)) {
        error_response('name_en is required');
    }

    $price = (float)($data['price'] ?? 0);
    if ($price < 0) {
        error_response('price must be >= 0');
    }

    try {
        $stmt = $db->prepare(
            "INSERT INTO addons (boat_id, name_th, name_en, name_zh, name_ko, name_fr,
                                 description_th, description_en, price, icon, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $boat_id,
            sanitize($data['name_th'] ?? ''),
            $name_en,
            sanitize($data['name_zh'] ?? ''),
            sanitize($data['name_ko'] ?? ''),
            sanitize($data['name_fr'] ?? ''),
            sanitize($data['description_th'] ?? ''),
            sanitize($data['description_en'] ?? ''),
            $price,
            sanitize($data['icon'] ?? ''),
            (int)($data['is_active'] ?? 1),
            (int)($data['sort_order'] ?? 0)
        ]);
        $id = (int)$db->lastInsertId();

        $stmt = $db->prepare("SELECT * FROM addons WHERE id = ?");
        $stmt->execute([$id]);
        $addon = $stmt->fetch();

        success_response($addon, 'Add-on created', 201);
    } catch (PDOException $e) {
        error_response('Failed to create addon: ' . $e->getMessage(), 500);
    }
}

function handleUpdateAddon(PDO $db, int $id): void {
    $auth = require_role('operator');
    $data = get_json_body();

    try {
        $stmt = $db->prepare("SELECT * FROM addons WHERE id = ?");
        $stmt->execute([$id]);
        $addon = $stmt->fetch();

        if (!$addon) {
            error_response('Add-on not found', 404);
        }

        verifyBoatOwnership($db, (int)$addon['boat_id'], $auth);

        $fields = [
            'name_th', 'name_en', 'name_zh', 'name_ko', 'name_fr',
            'description_th', 'description_en', 'icon'
        ];
        $numeric_fields = ['price', 'is_active', 'sort_order'];

        $sets = [];
        $values = [];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "{$field} = ?";
                $values[] = sanitize($data[$field]);
            }
        }
        foreach ($numeric_fields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "{$field} = ?";
                $values[] = $field === 'price' ? (float)$data[$field] : (int)$data[$field];
            }
        }

        if (empty($sets)) {
            error_response('No valid fields to update');
        }

        $values[] = $id;
        $sql = "UPDATE addons SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);

        $stmt = $db->prepare("SELECT * FROM addons WHERE id = ?");
        $stmt->execute([$id]);
        $addon = $stmt->fetch();

        success_response($addon, 'Add-on updated');
    } catch (PDOException $e) {
        error_response('Failed to update addon: ' . $e->getMessage(), 500);
    }
}

function handleDeleteAddon(PDO $db, int $id): void {
    $auth = require_role('operator');

    try {
        $stmt = $db->prepare("SELECT * FROM addons WHERE id = ?");
        $stmt->execute([$id]);
        $addon = $stmt->fetch();

        if (!$addon) {
            error_response('Add-on not found', 404);
        }

        verifyBoatOwnership($db, (int)$addon['boat_id'], $auth);

        $db->prepare("DELETE FROM addons WHERE id = ?")->execute([$id]);

        success_response(null, 'Add-on deleted');
    } catch (PDOException $e) {
        error_response('Failed to delete addon: ' . $e->getMessage(), 500);
    }
}
