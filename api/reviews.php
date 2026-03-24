<?php

require_once __DIR__ . '/../includes/base_path.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'tour' && isset($segments[1]) && is_numeric($segments[1])) {
            handleBoatReviewsList($db, (int)$segments[1]);
        } else {
            error_response('Invalid reviews endpoint', 404);
        }
        break;
    case 'POST':
        if (is_numeric($action) && isset($segments[1]) && $segments[1] === 'images') {
            handleAddReviewImage($db, (int)$action);
        } elseif ($action === '' || $action === '/') {
            handleCreateReview($db);
        } else {
            error_response('Invalid reviews endpoint', 404);
        }
        break;
    case 'PUT':
        if (is_numeric($action)) {
            handleUpdateReview($db, (int)$action);
        } else {
            error_response('Invalid reviews endpoint', 404);
        }
        break;
    case 'DELETE':
        if (is_numeric($action) && isset($segments[1]) && $segments[1] === 'images' && isset($segments[2]) && is_numeric($segments[2])) {
            handleDeleteReviewImage($db, (int)$action, (int)$segments[2]);
        } elseif (is_numeric($action)) {
            handleDeleteReview($db, (int)$action);
        } else {
            error_response('Invalid reviews endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function fetchReviewImages(PDO $db, int $review_id): array {
    $stmt = $db->prepare(
        "SELECT id, image_url, sort_order FROM review_images WHERE review_id = ? ORDER BY sort_order ASC"
    );
    $stmt->execute([$review_id]);
    return $stmt->fetchAll();
}

function handleCreateReview(PDO $db): void {
    $auth = require_auth();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $data = $_POST;
    } else {
        $data = get_json_body();
    }

    $boat_id = (int)($data['boat_id'] ?? 0);
    $rating  = (int)($data['rating'] ?? 0);
    $comment = sanitize($data['comment'] ?? '');
    $image_urls = $data['image_urls'] ?? [];

    if (!empty($_FILES)) {
        $uploadDir = dirname(__DIR__) . '/uploads/reviews/';
        if (!is_dir($uploadDir)) @mkdir($uploadDir, 0755, true);
        foreach ($_FILES as $key => $file) {
            if (is_array($file['name'])) {
                foreach ($file['tmp_name'] as $i => $tmp) {
                    if ($file['error'][$i] === UPLOAD_ERR_OK) {
                        $ext = strtolower(pathinfo($file['name'][$i], PATHINFO_EXTENSION));
                        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                            $fname = uniqid('rev_') . '.' . $ext;
                            if (move_uploaded_file($tmp, $uploadDir . $fname)) {
                                $image_urls[] = app_base_path() . '/uploads/reviews/' . $fname;
                            }
                        }
                    }
                }
            } else {
                if ($file['error'] === UPLOAD_ERR_OK) {
                    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                    if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                        $fname = uniqid('rev_') . '.' . $ext;
                        if (move_uploaded_file($file['tmp_name'], $uploadDir . $fname)) {
                            $image_urls[] = app_base_path() . '/uploads/reviews/' . $fname;
                        }
                    }
                }
            }
        }
    }

    if (!$boat_id || !$rating) {
        error_response('boat_id and rating are required');
    }
    if ($rating < 1 || $rating > 5) {
        error_response('Rating must be between 1 and 5');
    }
    if (!is_array($image_urls)) {
        $image_urls = [];
    }
    if (count($image_urls) > 5) {
        error_response('Maximum 5 images allowed per review');
    }

    try {
        $stmt = $db->prepare("SELECT id FROM boats WHERE id = ?");
        $stmt->execute([$boat_id]);
        $boat = $stmt->fetch();
        if (!$boat) {
            error_response('Boat not found', 404);
        }

        $stmt = $db->prepare(
            "SELECT id FROM bookings
             WHERE user_id = ? AND boat_id = ? AND status IN ('confirmed','completed')"
        );
        $stmt->execute([$auth['user_id'], $boat_id]);
        $booking = $stmt->fetch();
        if (!$booking) {
            error_response('You must have a confirmed or completed booking to review this boat');
        }

        $stmt = $db->prepare(
            "SELECT id FROM reviews WHERE user_id = ? AND boat_id = ? AND booking_id = ?"
        );
        $stmt->execute([$auth['user_id'], $boat_id, $booking['id']]);
        if ($stmt->fetch()) {
            error_response('You already reviewed this boat for this booking', 409);
        }

        $dest_stmt = $db->prepare("SELECT destination_id FROM boats WHERE id = ?");
        $dest_stmt->execute([$boat_id]);
        $boat_row = $dest_stmt->fetch();

        $db->beginTransaction();

        $stmt = $db->prepare(
            "INSERT INTO reviews (booking_id, user_id, boat_id, destination_id, rating, comment, status)
             VALUES (?, ?, ?, ?, ?, ?, 'approved')"
        );
        $stmt->execute([
            $booking['id'],
            $auth['user_id'],
            $boat_id,
            $boat_row['destination_id'],
            $rating,
            $comment
        ]);
        $review_id = (int)$db->lastInsertId();

        if (!empty($image_urls)) {
            $img_stmt = $db->prepare(
                "INSERT INTO review_images (review_id, image_url, sort_order) VALUES (?, ?, ?)"
            );
            foreach ($image_urls as $i => $url) {
                $img_stmt->execute([$review_id, sanitize($url), $i + 1]);
            }
        }

        $db->commit();

        $images = fetchReviewImages($db, $review_id);

        success_response([
            'review_id' => $review_id,
            'rating'    => $rating,
            'status'    => 'approved',
            'images'    => $images
        ], 'Review submitted successfully', 201);
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to create review: ' . $e->getMessage(), 500);
    }
}

function handleBoatReviewsList(PDO $db, int $boat_id): void {
    $page = get_page();
    $limit = get_limit();
    $offset = ($page - 1) * $limit;

    try {
        $count_stmt = $db->prepare(
            "SELECT COUNT(*) AS total FROM reviews WHERE boat_id = ? AND status = 'approved'"
        );
        $count_stmt->execute([$boat_id]);
        $total = (int)$count_stmt->fetch()['total'];

        $stats_stmt = $db->prepare(
            "SELECT AVG(rating) AS avg_rating,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
             FROM reviews WHERE boat_id = ? AND status = 'approved'"
        );
        $stats_stmt->execute([$boat_id]);
        $stats = $stats_stmt->fetch();

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

        foreach ($reviews as &$review) {
            $review['images'] = fetchReviewImages($db, (int)$review['id']);
        }

        success_response([
            'stats' => [
                'avg_rating'    => round((float)($stats['avg_rating'] ?? 0), 1),
                'total_reviews' => $total,
                'breakdown'     => [
                    5 => (int)($stats['five_star'] ?? 0),
                    4 => (int)($stats['four_star'] ?? 0),
                    3 => (int)($stats['three_star'] ?? 0),
                    2 => (int)($stats['two_star'] ?? 0),
                    1 => (int)($stats['one_star'] ?? 0),
                ]
            ],
            'reviews'    => $reviews,
            'pagination' => pagination_meta($total, $page, $limit)
        ]);
    } catch (PDOException $e) {
        error_response('Failed to fetch reviews: ' . $e->getMessage(), 500);
    }
}

function handleUpdateReview(PDO $db, int $id): void {
    $auth = require_auth();
    $data = get_json_body();

    try {
        $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $auth['user_id']]);
        $review = $stmt->fetch();

        if (!$review) {
            error_response('Review not found', 404);
        }

        $rating  = (int)($data['rating'] ?? $review['rating']);
        $comment = sanitize($data['comment'] ?? $review['comment']);

        if ($rating < 1 || $rating > 5) {
            error_response('Rating must be between 1 and 5');
        }

        $stmt = $db->prepare("UPDATE reviews SET rating = ?, comment = ? WHERE id = ?");
        $stmt->execute([$rating, $comment, $id]);

        $images = fetchReviewImages($db, $id);

        success_response([
            'id'      => $id,
            'rating'  => $rating,
            'comment' => $comment,
            'images'  => $images
        ], 'Review updated');
    } catch (PDOException $e) {
        error_response('Failed to update review: ' . $e->getMessage(), 500);
    }
}

function handleDeleteReview(PDO $db, int $id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        $review = $stmt->fetch();

        if (!$review) {
            error_response('Review not found', 404);
        }

        if ($review['user_id'] != $auth['user_id'] && $auth['role'] !== 'admin') {
            error_response('Forbidden', 403);
        }

        $db->beginTransaction();
        $db->prepare("DELETE FROM review_images WHERE review_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM reviews WHERE id = ?")->execute([$id]);
        $db->commit();

        success_response(null, 'Review deleted');
    } catch (PDOException $e) {
        $db->rollBack();
        error_response('Failed to delete review: ' . $e->getMessage(), 500);
    }
}

function handleAddReviewImage(PDO $db, int $review_id): void {
    $auth = require_auth();
    $data = get_json_body();

    $image_url = sanitize($data['image_url'] ?? '');
    if (empty($image_url)) {
        error_response('image_url is required');
    }

    try {
        $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND user_id = ?");
        $stmt->execute([$review_id, $auth['user_id']]);
        $review = $stmt->fetch();

        if (!$review) {
            error_response('Review not found or not yours', 404);
        }

        $count_stmt = $db->prepare("SELECT COUNT(*) AS cnt FROM review_images WHERE review_id = ?");
        $count_stmt->execute([$review_id]);
        $count = (int)$count_stmt->fetch()['cnt'];

        if ($count >= 5) {
            error_response('Maximum 5 images per review');
        }

        $stmt = $db->prepare(
            "INSERT INTO review_images (review_id, image_url, sort_order) VALUES (?, ?, ?)"
        );
        $stmt->execute([$review_id, $image_url, $count + 1]);
        $img_id = (int)$db->lastInsertId();

        success_response([
            'id'        => $img_id,
            'review_id' => $review_id,
            'image_url' => $image_url,
            'sort_order' => $count + 1
        ], 'Image added to review', 201);
    } catch (PDOException $e) {
        error_response('Failed to add review image: ' . $e->getMessage(), 500);
    }
}

function handleDeleteReviewImage(PDO $db, int $review_id, int $img_id): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ?");
        $stmt->execute([$review_id]);
        $review = $stmt->fetch();

        if (!$review) {
            error_response('Review not found', 404);
        }

        if ($review['user_id'] != $auth['user_id'] && $auth['role'] !== 'admin') {
            error_response('Forbidden', 403);
        }

        $stmt = $db->prepare("SELECT id FROM review_images WHERE id = ? AND review_id = ?");
        $stmt->execute([$img_id, $review_id]);
        if (!$stmt->fetch()) {
            error_response('Image not found', 404);
        }

        $db->prepare("DELETE FROM review_images WHERE id = ?")->execute([$img_id]);

        success_response(null, 'Review image deleted');
    } catch (PDOException $e) {
        error_response('Failed to delete review image: ' . $e->getMessage(), 500);
    }
}
