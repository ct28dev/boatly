<?php

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        handleGetFavorites($db);
        break;
    case 'POST':
        handleAddFavorite($db);
        break;
    case 'DELETE':
        if (is_numeric($action)) {
            handleRemoveFavorite($db, (int)$action);
        } else {
            error_response('Boat ID required', 400);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleGetFavorites(PDO $db): void {
    $auth = require_auth();
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    try {
        $count_stmt = $db->prepare("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?");
        $count_stmt->execute([$auth['user_id']]);
        $total = (int)$count_stmt->fetch()['total'];

        $stmt = $db->prepare(
            "SELECT f.id, f.boat_id,
                    b.name AS boat_name, b.slug, b.boat_type,
                    b.duration, b.price, b.capacity, b.status,
                    b.river, b.featured,
                    d.name AS destination_name, d.name_th AS destination_name_th,
                    d.province,
                    o.company_name AS operator_name,
                    bi.image_url AS primary_image,
                    COALESCE(rev.avg_rating, 0) AS avg_rating,
                    COALESCE(rev.review_count, 0) AS review_count
             FROM favorites f
             JOIN boats b ON f.boat_id = b.id
             LEFT JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN operators o ON b.operator_id = o.id
             LEFT JOIN boat_images bi ON b.id = bi.boat_id AND bi.is_primary = 1
             LEFT JOIN (
                SELECT boat_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
                FROM reviews WHERE status = 'approved' GROUP BY boat_id
             ) rev ON b.id = rev.boat_id
             WHERE f.user_id = ?
             ORDER BY f.id DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->execute([$auth['user_id'], $limit, $offset]);
        $favorites = $stmt->fetchAll();

        success_response([
            'favorites' => $favorites,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch favorites: ' . $e->getMessage(), 500);
    }
}

function handleAddFavorite(PDO $db): void {
    $auth = require_auth();
    $data = get_json_body();
    $boat_id = (int)($data['boat_id'] ?? 0);

    if (!$boat_id) {
        error_response('boat_id is required');
    }

    try {
        $stmt = $db->prepare("SELECT id FROM boats WHERE id = ?");
        $stmt->execute([$boat_id]);
        if (!$stmt->fetch()) {
            error_response('Boat not found', 404);
        }

        $stmt = $db->prepare("SELECT id FROM favorites WHERE user_id = ? AND boat_id = ?");
        $stmt->execute([$auth['user_id'], $boat_id]);
        if ($stmt->fetch()) {
            error_response('Already in favorites', 409);
        }

        $stmt = $db->prepare("INSERT INTO favorites (user_id, boat_id) VALUES (?, ?)");
        $stmt->execute([$auth['user_id'], $boat_id]);

        success_response(['boat_id' => $boat_id], 'Added to favorites', 201);
    } catch (PDOException $e) {
        error_response('Failed to add favorite: ' . $e->getMessage(), 500);
    }
}

function handleRemoveFavorite(PDO $db, int $boat_id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("DELETE FROM favorites WHERE user_id = ? AND boat_id = ?");
        $stmt->execute([$auth['user_id'], $boat_id]);

        if ($stmt->rowCount() === 0) {
            error_response('Favorite not found', 404);
        }

        success_response(null, 'Removed from favorites');
    } catch (PDOException $e) {
        error_response('Failed to remove favorite: ' . $e->getMessage(), 500);
    }
}
