<?php
$slug = $GLOBALS['slug'] ?? '';
$db = getDB();

$stmt = $db->prepare("
    SELECT b.*, d.name as destination_name, d.slug as destination_slug,
           o.company_name as operator_name, o.description as operator_description,
           o.contact_phone as operator_phone
    FROM boats b
    JOIN destinations d ON b.destination_id = d.id
    JOIN operators o ON b.operator_id = o.id
    WHERE b.slug = ? AND b.status = 'active'
    LIMIT 1
");
$stmt->execute([$slug]);
$boat = $stmt->fetch();

if (!$boat) {
    http_response_code(404);
    require __DIR__ . '/404.php';
    return;
}

$pageTitle = $boat['name'];
$bodyClass = 'page-boat-detail';
require __DIR__ . '/../includes/header.php';

$imgStmt = $db->prepare("SELECT * FROM boat_images WHERE boat_id = ? ORDER BY is_primary DESC, sort_order ASC");
$imgStmt->execute([$boat['id']]);
$images = $imgStmt->fetchAll();
if (empty($images)) {
    $images = [['image_url' => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'alt_text' => $boat['name'], 'is_primary' => 1]];
}

$revStmt = $db->prepare("
    SELECT r.*, u.name as reviewer_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.boat_id = ? AND r.status = 'approved'
    ORDER BY r.created_at DESC
    LIMIT 20
");
$revStmt->execute([$boat['id']]);
$reviews = $revStmt->fetchAll();

$avgRating = 0;
$reviewCount = count($reviews);
if ($reviewCount > 0) {
    $avgRating = round(array_sum(array_column($reviews, 'rating')) / $reviewCount, 1);
}

$similarStmt = $db->prepare("
    SELECT b.*, d.name as destination_name, d.slug as destination_slug,
           (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) as primary_image,
           (SELECT AVG(rating) FROM reviews WHERE boat_id = b.id AND status = 'approved') as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE boat_id = b.id AND status = 'approved') as review_count
    FROM boats b
    JOIN destinations d ON b.destination_id = d.id
    WHERE b.destination_id = ? AND b.id != ? AND b.status = 'active'
    ORDER BY b.featured DESC
    LIMIT 3
");
$similarStmt->execute([$boat['destination_id'], $boat['id']]);
$similarBoats = $similarStmt->fetchAll();

$boatTypes = [
    'longtail'  => 'Longtail',
    'speedboat' => 'Speedboat',
    'yacht'     => 'Yacht',
    'catamaran' => 'Catamaran',
    'ferry'     => 'Ferry',
    'cruise'    => 'Cruise',
    'houseboat' => 'Houseboat',
];

$highlights = json_decode($boat['highlights'] ?: '[]', true);
$durationHrs = floor($boat['duration'] / 60);
$durationMins = $boat['duration'] % 60;
$durationStr = $durationHrs > 0
    ? $durationHrs . 'h' . ($durationMins > 0 ? ' ' . $durationMins . 'm' : '')
    : $durationMins . 'm';

$routeStops = array_filter(array_map('trim', explode('→', $boat['route'] ?? '')));
?>

<main class="page-content">
    <div class="container">

        <!-- Breadcrumb -->
        <nav class="breadcrumb mt-6">
            <a href="<?= baseUrl('/') ?>">Home</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <a href="<?= baseUrl('/boats') ?>">Boats</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <a href="<?= baseUrl('/destinations/' . e($boat['destination_slug'])) ?>"><?= e($boat['destination_name']) ?></a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <span class="current"><?= e($boat['name']) ?></span>
        </nav>

        <!-- Image Gallery -->
        <div class="gallery" id="gallery">
            <div class="gallery-main">
                <img id="galleryMain" src="<?= imgUrl($images[0]['image_url']) ?>" alt="<?= e($images[0]['alt_text'] ?? $boat['name']) ?>">
            </div>
            <?php if (count($images) > 1): ?>
            <div class="gallery-thumbs">
                <?php foreach ($images as $i => $img): ?>
                <button type="button"
                        class="gallery-thumb<?= $i === 0 ? ' active' : '' ?>"
                        data-src="<?= imgUrl($img['image_url']) ?>"
                        data-alt="<?= e($img['alt_text'] ?? '') ?>">
                    <img src="<?= imgUrl($img['image_url']) ?>" alt="<?= e($img['alt_text'] ?? '') ?>" loading="lazy">
                </button>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>

        <!-- Two Column Layout -->
        <div class="detail-layout mt-8">

            <!-- Left Column: Info -->
            <div class="detail-info">
                <h1><?= e($boat['name']) ?></h1>

                <div class="detail-meta flex items-center gap-4 mt-3 mb-6">
                    <?php if ($avgRating > 0): ?>
                    <div class="rating-display">
                        <?php for ($s = 1; $s <= 5; $s++): ?>
                            <i class="fa<?= $s <= round($avgRating) ? 's' : 'r' ?> fa-star"></i>
                        <?php endfor; ?>
                        <strong><?= $avgRating ?></strong>
                        <span class="text-muted text-sm">(<?= $reviewCount ?> review<?= $reviewCount !== 1 ? 's' : '' ?>)</span>
                    </div>
                    <?php endif; ?>
                    <span class="badge badge-boat-type <?= e($boat['boat_type']) ?>"><?= e($boatTypes[$boat['boat_type']] ?? ucfirst($boat['boat_type'])) ?></span>
                    <span class="badge badge-active"><?= e($boat['destination_name']) ?></span>
                </div>

                <!-- Description -->
                <div class="detail-section">
                    <h3>About This Experience</h3>
                    <p class="detail-desc"><?= nl2br(e($boat['description_th'] ?: $boat['description'] ?: '')) ?></p>
                </div>

                <!-- Route -->
                <?php if (!empty($routeStops)): ?>
                <div class="detail-section">
                    <h3><i class="fas fa-route"></i> Route</h3>
                    <div class="route-timeline">
                        <?php foreach ($routeStops as $i => $stop): ?>
                        <div class="route-stop">
                            <div class="route-dot<?= $i === 0 ? ' start' : ($i === count($routeStops) - 1 ? ' end' : '') ?>"></div>
                            <span><?= e($stop) ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Highlights -->
                <?php if (!empty($highlights)): ?>
                <div class="detail-section">
                    <h3><i class="fas fa-check-circle"></i> Highlights</h3>
                    <div class="highlights-grid">
                        <?php foreach ($highlights as $hl): ?>
                        <div class="highlight-item">
                            <i class="fas fa-check"></i>
                            <span><?= e($hl) ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Operator -->
                <div class="detail-section">
                    <h3><i class="fas fa-id-badge"></i> About the Operator</h3>
                    <div class="operator-card card">
                        <div class="card-body flex items-center gap-4">
                            <div class="operator-avatar">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="flex-1">
                                <h4><?= e($boat['operator_name']) ?></h4>
                                <?php if ($boat['operator_description']): ?>
                                    <p class="text-sm text-muted mt-1"><?= e($boat['operator_description']) ?></p>
                                <?php endif; ?>
                                <?php if ($boat['operator_phone']): ?>
                                    <p class="text-sm mt-2"><i class="fas fa-phone text-primary"></i> <?= e($boat['operator_phone']) ?></p>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reviews Section -->
                <div class="detail-section" id="reviews">
                    <h3><i class="fas fa-star"></i> Reviews</h3>
                    <?php if ($reviewCount > 0): ?>
                    <div class="reviews-summary card mb-6">
                        <div class="card-body flex items-center gap-8">
                            <div class="reviews-avg text-center">
                                <div class="reviews-avg-number"><?= $avgRating ?></div>
                                <div class="reviews-avg-stars">
                                    <?php for ($s = 1; $s <= 5; $s++): ?>
                                        <i class="fa<?= $s <= round($avgRating) ? 's' : 'r' ?> fa-star"></i>
                                    <?php endfor; ?>
                                </div>
                                <div class="text-sm text-muted mt-1"><?= $reviewCount ?> review<?= $reviewCount !== 1 ? 's' : '' ?></div>
                            </div>
                            <div class="reviews-bars flex-1">
                                <?php
                                $ratingCounts = array_fill(1, 5, 0);
                                foreach ($reviews as $r) $ratingCounts[(int)$r['rating']]++;
                                for ($star = 5; $star >= 1; $star--):
                                    $pct = $reviewCount > 0 ? round($ratingCounts[$star] / $reviewCount * 100) : 0;
                                ?>
                                <div class="rating-bar-row">
                                    <span class="text-sm"><?= $star ?> <i class="fas fa-star"></i></span>
                                    <div class="progress"><div class="progress-bar accent" style="width:<?= $pct ?>%"></div></div>
                                    <span class="text-sm text-muted"><?= $ratingCounts[$star] ?></span>
                                </div>
                                <?php endfor; ?>
                            </div>
                        </div>
                    </div>

                    <div class="reviews-list">
                        <?php foreach ($reviews as $rev): ?>
                        <div class="review-card card mb-4">
                            <div class="review-header">
                                <div class="avatar-placeholder">
                                    <?= mb_substr($rev['reviewer_name'], 0, 1) ?>
                                </div>
                                <div>
                                    <div class="review-author"><?= e($rev['reviewer_name']) ?></div>
                                    <div class="review-date"><?= formatThaiDate($rev['created_at']) ?></div>
                                </div>
                            </div>
                            <div class="review-stars">
                                <?php for ($s = 1; $s <= 5; $s++): ?>
                                    <i class="fa<?= $s <= (int)$rev['rating'] ? 's' : 'r' ?> fa-star"></i>
                                <?php endfor; ?>
                            </div>
                            <p class="review-text"><?= nl2br(e($rev['comment'] ?? '')) ?></p>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php else: ?>
                    <div class="empty-state" style="padding: 40px 20px;">
                        <div class="empty-state-icon"><i class="far fa-star"></i></div>
                        <h3>No Reviews Yet</h3>
                        <p>Be the first to review this experience!</p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Right Column: Booking Card -->
            <div class="detail-sidebar">
                <div class="booking-card card" id="bookingCard">
                    <div class="card-body">
                        <div class="booking-card-price">
                            <span class="price-amount">฿<?= number_format($boat['price']) ?></span>
                            <span class="price-unit">/person</span>
                        </div>

                        <div class="booking-card-specs">
                            <div class="spec-row">
                                <i class="fas fa-clock"></i>
                                <span>Duration</span>
                                <strong><?= $durationStr ?></strong>
                            </div>
                            <div class="spec-row">
                                <i class="fas fa-users"></i>
                                <span>Capacity</span>
                                <strong>Max <?= (int)$boat['capacity'] ?> pax</strong>
                            </div>
                            <?php if ($boat['river']): ?>
                            <div class="spec-row">
                                <i class="fas fa-water"></i>
                                <span>River</span>
                                <strong><?= e($boat['river']) ?></strong>
                            </div>
                            <?php endif; ?>
                        </div>

                        <div class="divider"></div>

                        <div class="form-group">
                            <label for="bookingDate">Select Date</label>
                            <input type="date" id="bookingDate" class="form-control"
                                   min="<?= date('Y-m-d') ?>"
                                   max="<?= date('Y-m-d', strtotime('+60 days')) ?>">
                        </div>

                        <div class="form-group">
                            <label for="bookingTime">Time Slot</label>
                            <select id="bookingTime" class="form-control" disabled>
                                <option value="">Select a date first</option>
                            </select>
                            <div class="form-hint" id="seatHint"></div>
                        </div>

                        <div class="form-group">
                            <label>Passengers</label>
                            <div class="stepper">
                                <button type="button" class="stepper-btn" id="paxMinus" disabled><i class="fas fa-minus"></i></button>
                                <span class="stepper-value" id="paxCount">1</span>
                                <button type="button" class="stepper-btn" id="paxPlus"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div class="booking-card-total">
                            <div class="total-row">
                                <span><span id="totalPax">1</span> × ฿<?= number_format($boat['price']) ?></span>
                                <strong id="totalPrice">฿<?= number_format($boat['price']) ?></strong>
                            </div>
                        </div>

                        <a href="#" id="bookNowBtn" class="btn btn-accent btn-lg btn-block mt-4">
                            <i class="fas fa-calendar-check"></i> Book Now
                        </a>

                        <p class="text-xs text-muted text-center mt-3">Free cancellation up to 24h before departure</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Similar Boats -->
        <?php if (!empty($similarBoats)): ?>
        <section class="section">
            <div class="section-title">
                <h2>Similar Experiences in <?= e($boat['destination_name']) ?></h2>
                <p>Discover more boat tours in this destination</p>
            </div>
            <div class="grid grid-3">
                <?php foreach ($similarBoats as $sb):
                    $sbImg = $sb['primary_image'] ?: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800';
                    $sbRating = $sb['avg_rating'] ? round($sb['avg_rating'], 1) : 0;
                    $sbDur = floor($sb['duration'] / 60) > 0
                        ? floor($sb['duration'] / 60) . 'h' . ($sb['duration'] % 60 > 0 ? ' ' . ($sb['duration'] % 60) . 'm' : '')
                        : ($sb['duration'] % 60) . 'm';
                ?>
                <a href="<?= baseUrl('/boats/' . e($sb['slug'])) ?>" class="card card-hover boat-card" style="text-decoration:none;color:inherit;">
                    <div class="card-image">
                        <img src="<?= imgUrl($sbImg) ?>" alt="<?= e($sb['name']) ?>" loading="lazy">
                    </div>
                    <div class="card-body">
                        <h4 style="margin-bottom:8px;"><?= e($sb['name']) ?></h4>
                        <div class="boat-specs">
                            <span class="boat-spec"><i class="fas fa-clock"></i> <?= $sbDur ?></span>
                            <span class="boat-spec"><i class="fas fa-users"></i> Max <?= (int)$sb['capacity'] ?></span>
                        </div>
                        <div class="card-footer">
                            <div>
                                <span class="card-price">฿<?= number_format($sb['price']) ?></span>
                                <span class="card-price-unit">/person</span>
                            </div>
                            <?php if ($sbRating > 0): ?>
                            <div class="card-rating-inline">
                                <i class="fas fa-star"></i>
                                <span><?= $sbRating ?></span>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>
        </section>
        <?php endif; ?>

    </div>
</main>

<style>
/* Gallery */
.gallery {
    display: grid;
    gap: 12px;
}
.gallery-main {
    border-radius: var(--radius-lg);
    overflow: hidden;
    aspect-ratio: 16 / 8;
    background: var(--border-light);
}
.gallery-main img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
}
.gallery-thumbs {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
}
.gallery-thumb {
    flex-shrink: 0;
    width: 88px;
    height: 64px;
    border-radius: var(--radius);
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    transition: border-color var(--transition), opacity var(--transition);
    padding: 0;
    background: none;
    opacity: 0.65;
}
.gallery-thumb.active,
.gallery-thumb:hover {
    border-color: var(--primary-light);
    opacity: 1;
}
.gallery-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Detail Layout */
.detail-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 40px;
    align-items: start;
}
.detail-info h1 {
    font-size: 32px;
    line-height: 40px;
}
.detail-section {
    margin-bottom: 40px;
}
.detail-section h3 {
    font-size: 20px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.detail-section h3 i {
    color: var(--primary-light);
    font-size: 18px;
}
.detail-desc {
    font-size: 15px;
    line-height: 1.8;
    color: var(--text-muted);
}

/* Rating Display */
.rating-display {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--accent);
    font-size: 14px;
}
.rating-display strong {
    color: var(--text);
    margin-left: 4px;
}

/* Route Timeline */
.route-timeline {
    position: relative;
    padding-left: 24px;
}
.route-stop {
    position: relative;
    padding: 10px 0 10px 20px;
    font-size: 15px;
    color: var(--text-muted);
}
.route-stop:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -18px;
    top: 28px;
    bottom: -2px;
    width: 2px;
    background: var(--border);
}
.route-dot {
    position: absolute;
    left: -24px;
    top: 14px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--border);
    border: 2px solid var(--card-bg);
    box-shadow: 0 0 0 2px var(--border);
}
.route-dot.start {
    background: var(--success);
    box-shadow: 0 0 0 2px var(--success);
}
.route-dot.end {
    background: var(--primary-light);
    box-shadow: 0 0 0 2px var(--primary-light);
}

/* Highlights */
.highlights-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
.highlight-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--text-muted);
    padding: 10px 14px;
    background: var(--border-light);
    border-radius: var(--radius);
}
.highlight-item i {
    color: var(--success);
    font-size: 13px;
    flex-shrink: 0;
}

/* Operator Card */
.operator-avatar {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    background: rgba(2,132,199,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-light);
    font-size: 22px;
    flex-shrink: 0;
}

/* Booking Card */
.detail-sidebar {
    position: sticky;
    top: calc(var(--navbar-height) + 24px);
}
.booking-card {
    border: 2px solid var(--border-light);
    box-shadow: var(--shadow-md);
}
.booking-card-price {
    margin-bottom: 20px;
}
.booking-card-price .price-amount {
    font-size: 32px;
    font-weight: 800;
    color: var(--primary);
}
.booking-card-price .price-unit {
    font-size: 15px;
    color: var(--text-muted);
    font-weight: 400;
}
.booking-card-specs .spec-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    color: var(--text-muted);
}
.booking-card-specs .spec-row i {
    color: var(--primary-light);
    width: 18px;
    text-align: center;
}
.booking-card-specs .spec-row span {
    flex: 1;
}
.booking-card-specs .spec-row strong {
    color: var(--text);
}

/* Stepper */
.stepper {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}
.stepper-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border-light);
    color: var(--text);
    font-size: 14px;
    cursor: pointer;
    transition: background var(--transition);
    border: none;
}
.stepper-btn:hover:not(:disabled) {
    background: var(--border);
}
.stepper-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.stepper-value {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
}

/* Booking Total */
.booking-card-total .total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
}
.booking-card-total .total-row strong {
    font-size: 22px;
    color: var(--primary);
}

/* Reviews Summary */
.reviews-avg-number {
    font-size: 48px;
    font-weight: 800;
    color: var(--text);
    line-height: 1;
}
.reviews-avg-stars {
    color: var(--accent);
    font-size: 16px;
    margin-top: 6px;
}
.rating-bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}
.rating-bar-row .progress {
    flex: 1;
    height: 6px;
}
.rating-bar-row .text-sm {
    min-width: 32px;
}

/* Avatar placeholder */
.avatar-placeholder {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
}

/* Similar boats card price/rating (reuse from boats page) */
.card-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
}
.card-price-unit {
    font-size: 13px;
    color: var(--text-light);
}
.card-rating-inline {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
}

@media (max-width: 1024px) {
    .detail-layout {
        grid-template-columns: 1fr 320px;
        gap: 28px;
    }
}
@media (max-width: 768px) {
    .detail-layout {
        grid-template-columns: 1fr;
    }
    .detail-sidebar {
        position: static;
    }
    .gallery-main { aspect-ratio: 16 / 9; }
    .highlights-grid { grid-template-columns: 1fr; }
    .reviews-summary .card-body {
        flex-direction: column;
        text-align: center;
    }
}
</style>

<script>
(function() {
    const boatId = <?= (int)$boat['id'] ?>;
    const boatSlug = '<?= e($boat['slug']) ?>';
    const pricePerPax = <?= (float)$boat['price'] ?>;
    const maxCapacity = <?= (int)$boat['capacity'] ?>;

    // Gallery
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.getElementById('galleryMain').src = thumb.dataset.src;
            document.getElementById('galleryMain').alt = thumb.dataset.alt;
            document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // Booking
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('bookingTime');
    const seatHint = document.getElementById('seatHint');
    const paxMinus = document.getElementById('paxMinus');
    const paxPlus = document.getElementById('paxPlus');
    const paxCount = document.getElementById('paxCount');
    const totalPax = document.getElementById('totalPax');
    const totalPrice = document.getElementById('totalPrice');
    const bookBtn = document.getElementById('bookNowBtn');
    let pax = 1;
    let maxAvailable = maxCapacity;

    function formatPrice(n) {
        return '฿' + n.toLocaleString('en-US');
    }

    function updateTotal() {
        totalPax.textContent = pax;
        totalPrice.textContent = formatPrice(pax * pricePerPax);
    }

    paxMinus.addEventListener('click', () => {
        if (pax > 1) { pax--; paxCount.textContent = pax; updateTotal(); }
        paxMinus.disabled = pax <= 1;
        paxPlus.disabled = pax >= maxAvailable;
    });
    paxPlus.addEventListener('click', () => {
        if (pax < maxAvailable) { pax++; paxCount.textContent = pax; updateTotal(); }
        paxMinus.disabled = pax <= 1;
        paxPlus.disabled = pax >= maxAvailable;
    });

    dateInput.addEventListener('change', async () => {
        const date = dateInput.value;
        if (!date) return;
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Loading...</option>';
        seatHint.textContent = '';

        try {
            const resp = await fetch(`<?= baseUrl('/api/index.php') ?>?route=bookings/check-availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: boatId, date })
            });

            let slots = [];
            if (resp.ok) {
                const json = await resp.json();
                if (json.data && json.data.slots) slots = json.data.slots;
            }

            if (slots.length === 0) {
                // Fallback: load from availability table via inline data
                timeSelect.innerHTML = '<option value="">No slots for this date</option>';
                timeSelect.disabled = true;
                return;
            }
            timeSelect.innerHTML = '<option value="">Choose time</option>';
            slots.forEach(s => {
                const remaining = s.remaining_seats ?? (s.max_seats - s.booked_seats);
                if (remaining > 0) {
                    const opt = document.createElement('option');
                    opt.value = s.time_slot;
                    opt.textContent = s.time_slot + ' (' + remaining + ' seats left)';
                    opt.dataset.remaining = remaining;
                    timeSelect.appendChild(opt);
                }
            });
            timeSelect.disabled = false;
        } catch {
            // Fallback: try loading availability directly
            try {
                const r2 = await fetch(`<?= baseUrl('/pages/boat-detail.php') ?>?ajax=availability&boat_id=${boatId}&date=${date}`);
                if (r2.ok) {
                    const data = await r2.json();
                    timeSelect.innerHTML = '<option value="">Choose time</option>';
                    data.forEach(s => {
                        const remaining = s.max_seats - s.booked_seats;
                        if (remaining > 0) {
                            const opt = document.createElement('option');
                            opt.value = s.time_slot;
                            opt.textContent = s.time_slot + ' (' + remaining + ' seats left)';
                            opt.dataset.remaining = remaining;
                            timeSelect.appendChild(opt);
                        }
                    });
                    timeSelect.disabled = false;
                }
            } catch {
                timeSelect.innerHTML = '<option value="">Unable to load slots</option>';
            }
        }
    });

    timeSelect.addEventListener('change', () => {
        const sel = timeSelect.options[timeSelect.selectedIndex];
        if (sel && sel.dataset.remaining) {
            maxAvailable = Math.min(parseInt(sel.dataset.remaining), maxCapacity);
            seatHint.textContent = maxAvailable + ' seats available';
            if (pax > maxAvailable) {
                pax = maxAvailable;
                paxCount.textContent = pax;
            }
            paxPlus.disabled = pax >= maxAvailable;
            updateTotal();
        }
    });

    bookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const date = dateInput.value;
        const time = timeSelect.value;
        if (!date) { dateInput.focus(); alert('Please select a date'); return; }
        if (!time) { timeSelect.focus(); alert('Please select a time slot'); return; }
        const params = new URLSearchParams({ boat: boatSlug, date, time, pax });
        window.location.href = '<?= baseUrl('/booking') ?>?' + params.toString();
    });
})();
</script>

<?php require __DIR__ . '/../includes/footer.php'; ?>
