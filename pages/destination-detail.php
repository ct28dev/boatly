<?php
$slug = $GLOBALS['slug'] ?? '';
$db = getDB();

$dest = $db->prepare("SELECT * FROM destinations WHERE slug = ?");
$dest->execute([$slug]);
$destination = $dest->fetch();

if (!$destination) {
    http_response_code(404);
    require __DIR__ . '/404.php';
    return;
}

$pageTitle = $destination['name'] . ' — Boat Tours';
$pageDescription = $destination['description'] ?? 'Boat tours in ' . $destination['name'];
$bodyClass = 'page-destination-detail';
require __DIR__ . '/../includes/header.php';

$destFallbackImages = [
    'ayutthaya' => 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200',
    'bangkok'   => 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
    'phuket'    => 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200',
    'krabi'     => 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
    'pattaya'   => 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=1200',
];

$heroImg = !empty($destination['hero_image'])
    ? imgUrl($destination['hero_image'])
    : ($destFallbackImages[$destination['slug']] ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200');

$boatTypeLabels = [
    'longtail' => 'Longtail', 'speedboat' => 'Speedboat', 'yacht' => 'Yacht',
    'catamaran' => 'Catamaran', 'ferry' => 'Ferry', 'cruise' => 'Cruise', 'houseboat' => 'Houseboat',
];

function fmtDur(int $min): string {
    $h = intdiv($min, 60);
    $m = $min % 60;
    if ($h > 0 && $m > 0) return $h . 'h ' . $m . 'm';
    return $h > 0 ? $h . ' hr' . ($h > 1 ? 's' : '') : $m . ' min';
}

function renderStars(float $rating): string {
    $out = '';
    $full = (int) floor($rating);
    $half = ($rating - $full) >= 0.25;
    for ($i = 0; $i < $full; $i++) $out .= '<i class="fas fa-star"></i>';
    if ($half) { $out .= '<i class="fas fa-star-half-alt"></i>'; $full++; }
    for ($i = $full; $i < 5; $i++) $out .= '<i class="far fa-star"></i>';
    return $out;
}

$isActive = $destination['status'] === 'active';

$boats = [];
$reviews = [];
if ($isActive) {
    $boats = $db->prepare("
        SELECT b.*,
               (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) AS primary_image,
               COALESCE((SELECT AVG(rating) FROM reviews WHERE boat_id = b.id AND status = 'approved'), 0) AS avg_rating,
               (SELECT COUNT(*) FROM reviews WHERE boat_id = b.id AND status = 'approved') AS review_count
        FROM boats b
        WHERE b.destination_id = ? AND b.status = 'active'
        ORDER BY b.featured DESC, b.id
    ");
    $boats->execute([$destination['id']]);
    $boats = $boats->fetchAll();

    $revStmt = $db->prepare("
        SELECT r.*, u.name AS user_name, u.profile_image, bt.name AS boat_name
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        JOIN boats bt ON bt.id = r.boat_id
        WHERE r.destination_id = ? AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 6
    ");
    $revStmt->execute([$destination['id']]);
    $reviews = $revStmt->fetchAll();
}

$ayutthayaLandmarks = [
    [
        'name'    => 'Wat Chaiwatthanaram',
        'name_th' => 'วัดไชยวัฒนาราม',
        'image'   => 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
        'desc'    => 'A stunning Khmer-style temple on the bank of the Chao Phraya River, best viewed at sunset from the water.',
    ],
    [
        'name'    => 'Wat Phanan Choeng',
        'name_th' => 'วัดพนัญเชิง',
        'image'   => 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
        'desc'    => 'Home to a massive 19-metre seated Buddha, this riverfront temple predates the founding of Ayutthaya.',
    ],
    [
        'name'    => 'Wat Mahathat',
        'name_th' => 'วัดมหาธาตุ',
        'image'   => 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600',
        'desc'    => 'Famous for the Buddha head entwined in tree roots, a symbol of Ayutthaya and a UNESCO World Heritage icon.',
    ],
];
?>

<style>
.detail-about{display:grid;grid-template-columns:2fr 1fr;gap:48px;align-items:start}
.detail-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.detail-info-item{padding:20px;background:var(--card-bg);border-radius:var(--radius-md);border:1px solid var(--border-light)}
.detail-info-item .info-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-light);margin-bottom:4px}
.detail-info-item .info-value{font-size:16px;font-weight:600;color:var(--text)}
.landmark-card .card-image{aspect-ratio:4/3}
.landmark-card .card-body h4{margin-bottom:4px}
.landmark-card .card-body .text-sm{color:var(--primary-light);font-weight:500;margin-bottom:8px}
.map-placeholder{background:var(--card-bg);border:2px dashed var(--border);border-radius:var(--radius-lg);padding:60px 20px;text-align:center;color:var(--text-muted)}
.map-placeholder i{font-size:48px;color:var(--text-light);margin-bottom:16px;display:block}
.coming-soon-page{text-align:center;padding:80px 20px}
.coming-soon-page .coming-icon{font-size:80px;color:var(--accent);margin-bottom:24px}
.notify-form{display:flex;gap:12px;max-width:440px;margin:32px auto 0;justify-content:center}
.notify-form .form-control{flex:1;border-radius:50px;padding:12px 24px}
.notify-form .btn{border-radius:50px}
.breadcrumb-hero{position:relative;z-index:2}
.breadcrumb-hero a{color:rgba(255,255,255,.7)}
.breadcrumb-hero a:hover{color:#fff}
.breadcrumb-hero .separator{color:rgba(255,255,255,.4)}
.breadcrumb-hero .current{color:#fff;font-weight:600}
@media(max-width:768px){
    .detail-about{grid-template-columns:1fr}
    .notify-form{flex-direction:column}
}
</style>

<main>

<?php if ($isActive): ?>

<!-- ═══════════════════ HERO — ACTIVE ═══════════════════ -->
<section class="hero hero-destination">
    <div class="hero-bg" style="background-image:url('<?= e($heroImg) ?>')"></div>
    <div class="hero-content">
        <nav class="breadcrumb breadcrumb-hero mb-4">
            <a href="<?= baseUrl('/') ?>">Home</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <a href="<?= baseUrl('/destinations') ?>">Destinations</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <span class="current"><?= e($destination['name']) ?></span>
        </nav>
        <h1><?= e($destination['name']) ?></h1>
        <?php if ($destination['name_th']): ?>
            <p class="lead"><?= e($destination['name_th']) ?></p>
        <?php endif; ?>
    </div>
    <div class="hero-wave">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40 C360 100 1080 0 1440 60 L1440 100 L0 100Z" fill="var(--body-bg)"/>
        </svg>
    </div>
</section>

<!-- ═══════════════════ ABOUT SECTION ═══════════════════ -->
<section class="section">
    <div class="container">
        <div class="detail-about">
            <div>
                <h2 class="mb-4">About <?= e($destination['name']) ?></h2>
                <p style="font-size:17px;line-height:1.9;margin-bottom:16px"><?= e($destination['description'] ?? '') ?></p>
                <?php if ($destination['description_th']): ?>
                    <p style="font-size:16px;line-height:1.9;color:var(--text-muted)"><?= e($destination['description_th']) ?></p>
                <?php endif; ?>
            </div>
            <div class="detail-info-grid">
                <?php if ($destination['province']): ?>
                <div class="detail-info-item">
                    <div class="info-label"><i class="fas fa-map-marker-alt"></i> Province</div>
                    <div class="info-value"><?= e($destination['province']) ?></div>
                </div>
                <?php endif; ?>
                <?php if ($destination['slug'] === 'ayutthaya'): ?>
                <div class="detail-info-item">
                    <div class="info-label"><i class="fas fa-water"></i> River</div>
                    <div class="info-value">Chao Phraya &amp; Pa Sak</div>
                </div>
                <div class="detail-info-item">
                    <div class="info-label"><i class="fas fa-cloud-sun"></i> Best Season</div>
                    <div class="info-value">Nov — Feb</div>
                </div>
                <div class="detail-info-item">
                    <div class="info-label"><i class="fas fa-landmark"></i> UNESCO Status</div>
                    <div class="info-value">World Heritage Site</div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════ LANDMARKS ═══════════════════ -->
<?php if ($destination['slug'] === 'ayutthaya'): ?>
<section class="section bg-light">
    <div class="container">
        <div class="section-title">
            <h2>Key Landmarks</h2>
            <p>Historic temples you'll see from the river</p>
        </div>
        <div class="grid grid-3">
            <?php foreach ($ayutthayaLandmarks as $lm): ?>
            <div class="card card-hover landmark-card">
                <div class="card-image">
                    <img src="<?= e($lm['image']) ?>" alt="<?= e($lm['name']) ?>" loading="lazy">
                </div>
                <div class="card-body">
                    <h4><?= e($lm['name']) ?></h4>
                    <p class="text-sm mb-2"><?= e($lm['name_th']) ?></p>
                    <p class="text-sm text-muted"><?= e($lm['desc']) ?></p>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- ═══════════════════ AVAILABLE BOATS ═══════════════════ -->
<section class="section <?= $destination['slug'] === 'ayutthaya' ? '' : 'bg-light' ?>">
    <div class="container">
        <div class="section-title">
            <h2>Available Boats</h2>
            <p>Choose your ideal boat experience in <?= e($destination['name']) ?></p>
        </div>

        <?php if ($boats): ?>
        <div class="grid grid-3">
            <?php foreach ($boats as $boat): ?>
            <a href="<?= baseUrl('/boats/' . e($boat['slug'])) ?>" class="card card-hover boat-card" style="color:inherit">
                <div class="card-image">
                    <img src="<?= e($boat['primary_image'] ? imgUrl($boat['primary_image']) : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600') ?>"
                         alt="<?= e($boat['name']) ?>" loading="lazy">
                    <div style="position:absolute;top:16px;left:16px;z-index:2">
                        <span class="badge badge-boat-type <?= e($boat['boat_type']) ?>"><?= e($boatTypeLabels[$boat['boat_type']] ?? ucfirst($boat['boat_type'])) ?></span>
                    </div>
                    <?php if ($boat['featured']): ?>
                    <div style="position:absolute;top:16px;right:16px;z-index:2">
                        <span class="badge badge-info"><i class="fas fa-fire"></i> Popular</span>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="card-body">
                    <h4 class="mb-3"><?= e($boat['name']) ?></h4>
                    <div class="boat-specs">
                        <span class="boat-spec"><i class="fas fa-clock"></i> <?= fmtDur((int)$boat['duration']) ?></span>
                        <span class="boat-spec"><i class="fas fa-users"></i> <?= (int)$boat['capacity'] ?> pax</span>
                        <?php if ($boat['river']): ?>
                            <span class="boat-spec"><i class="fas fa-water"></i> <?= e($boat['river']) ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="card-footer">
                        <div>
                            <span style="font-size:22px;font-weight:700;color:var(--primary)">฿<?= number_format($boat['price']) ?></span>
                            <span class="text-sm text-muted"> / person</span>
                        </div>
                        <div class="flex items-center gap-1" style="color:var(--accent)">
                            <?= renderStars((float)$boat['avg_rating']) ?>
                            <span class="text-sm font-semibold" style="margin-left:4px"><?= number_format($boat['avg_rating'], 1) ?></span>
                        </div>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-ship"></i></div>
            <h3>No boats available yet</h3>
            <p>We're preparing exciting experiences for this destination. Check back soon!</p>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- ═══════════════════ REVIEWS ═══════════════════ -->
<?php if ($reviews): ?>
<section class="section bg-light">
    <div class="container">
        <div class="section-title">
            <h2>Traveller Reviews</h2>
            <p>What people are saying about <?= e($destination['name']) ?> boat tours</p>
        </div>
        <div class="grid grid-3">
            <?php foreach ($reviews as $rev): ?>
            <div class="card review-card">
                <div class="review-header">
                    <?php if (!empty($rev['profile_image'])): ?>
                        <img src="<?= e(imgUrl($rev['profile_image'])) ?>" alt="" class="review-avatar">
                    <?php else: ?>
                        <div class="review-avatar" style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;width:48px;height:48px;border-radius:50%;flex-shrink:0">
                            <?= e(mb_substr($rev['user_name'], 0, 1, 'UTF-8')) ?>
                        </div>
                    <?php endif; ?>
                    <div>
                        <div class="review-author"><?= e($rev['user_name']) ?></div>
                        <div class="review-date"><?= e($rev['boat_name']) ?></div>
                    </div>
                </div>
                <div class="review-stars"><?= renderStars((float)$rev['rating']) ?></div>
                <p class="review-text line-clamp-3"><?= e($rev['comment'] ?? '') ?></p>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- ═══════════════════ MAP PLACEHOLDER ═══════════════════ -->
<section class="section">
    <div class="container">
        <div class="section-title">
            <h2>Location</h2>
        </div>
        <div class="map-placeholder">
            <i class="fas fa-map-marked-alt"></i>
            <h4 class="mb-2"><?= e($destination['name']) ?>, <?= e($destination['province'] ?? 'Thailand') ?></h4>
            <?php if ($destination['latitude'] && $destination['longitude']): ?>
                <p class="text-sm text-muted">
                    Coordinates: <?= number_format($destination['latitude'], 4) ?>°N, <?= number_format($destination['longitude'], 4) ?>°E
                </p>
                <a href="https://www.google.com/maps?q=<?= $destination['latitude'] ?>,<?= $destination['longitude'] ?>"
                   target="_blank" rel="noopener" class="btn btn-secondary btn-sm mt-4">
                    <i class="fas fa-external-link-alt"></i> Open in Google Maps
                </a>
            <?php endif; ?>
        </div>
    </div>
</section>

<?php else: ?>

<!-- ═══════════════════ COMING SOON LAYOUT ═══════════════════ -->
<section class="hero hero-destination">
    <div class="hero-bg" style="background-image:url('<?= e($heroImg) ?>')"></div>
    <div style="position:absolute;inset:0;background:rgba(15,23,42,.6);z-index:1"></div>
    <div class="hero-content">
        <nav class="breadcrumb breadcrumb-hero mb-4">
            <a href="<?= baseUrl('/') ?>">Home</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <a href="<?= baseUrl('/destinations') ?>">Destinations</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <span class="current"><?= e($destination['name']) ?></span>
        </nav>
        <span class="badge badge-coming-soon badge-lg mb-4"><i class="fas fa-clock"></i> Coming Soon</span>
        <h1><?= e($destination['name']) ?></h1>
        <?php if ($destination['name_th']): ?>
            <p class="lead"><?= e($destination['name_th']) ?></p>
        <?php endif; ?>
    </div>
    <div class="hero-wave">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40 C360 100 1080 0 1440 60 L1440 100 L0 100Z" fill="var(--body-bg)"/>
        </svg>
    </div>
</section>

<section class="section-lg">
    <div class="container">
        <div class="coming-soon-page">
            <div class="coming-icon"><i class="fas fa-anchor"></i></div>
            <h2 class="mb-3">This destination is not yet available</h2>
            <p class="lead mb-2" style="max-width:500px;margin-left:auto;margin-right:auto">
                We're working on bringing amazing boat experiences to <strong><?= e($destination['name']) ?></strong>.
            </p>
            <p class="text-muted"><?= e($destination['description'] ?? '') ?></p>

            <div style="margin-top:40px">
                <h4 class="mb-3">Notify me when <?= e($destination['name']) ?> launches</h4>
                <form class="notify-form" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed!';this.querySelector('button').disabled=true">
                    <input type="email" class="form-control" placeholder="Your email address" required>
                    <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-bell"></i> Notify Me</button>
                </form>
            </div>

            <div class="divider" style="max-width:200px;margin:40px auto"></div>

            <p class="text-muted mb-4">In the meantime, explore our active destinations</p>
            <a href="<?= baseUrl('/destinations') ?>" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> View All Destinations
            </a>
        </div>
    </div>
</section>

<?php endif; ?>

</main>

<?php require __DIR__ . '/../includes/footer.php'; ?>
