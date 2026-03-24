<?php
$pageTitle = 'Discover Boat Experiences in Thailand';
$pageDescription = 'Book unique boat tours across Thailand. Start with Ayutthaya river cruises.';
$bodyClass = 'page-home';
require __DIR__ . '/../includes/header.php';
$db = getDB();

$destFallbackImages = [
    'ayutthaya' => 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200',
    'bangkok'   => 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'phuket'    => 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
    'krabi'     => 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    'pattaya'   => 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800',
];

$boatTypeLabels = [
    'longtail' => 'Longtail', 'speedboat' => 'Speedboat', 'yacht' => 'Yacht',
    'catamaran' => 'Catamaran', 'ferry' => 'Ferry', 'cruise' => 'Cruise', 'houseboat' => 'Houseboat',
];

function destImage(array $dest, array $fallbacks): string {
    if (!empty($dest['hero_image'])) return imgUrl($dest['hero_image']);
    return $fallbacks[$dest['slug']] ?? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
}

function fmtDuration(int $min): string {
    $h = intdiv($min, 60);
    $m = $min % 60;
    if ($h > 0 && $m > 0) return $h . 'h ' . $m . 'm';
    return $h > 0 ? $h . ' hr' . ($h > 1 ? 's' : '') : $m . ' min';
}

function stars(float $rating): string {
    $out = '';
    $full = (int) floor($rating);
    $half = ($rating - $full) >= 0.25;
    for ($i = 0; $i < $full; $i++) $out .= '<i class="fas fa-star"></i>';
    if ($half) { $out .= '<i class="fas fa-star-half-alt"></i>'; $full++; }
    for ($i = $full; $i < 5; $i++) $out .= '<i class="far fa-star"></i>';
    return $out;
}

// ── Data queries ────────────────────────────────────────────
$destinations = $db->query("SELECT id, name, slug, status FROM destinations ORDER BY sort_order")->fetchAll();

$featuredBoats = $db->query("
    SELECT b.*,
           (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) AS primary_image,
           COALESCE((SELECT AVG(rating) FROM reviews WHERE boat_id = b.id AND status = 'approved'), 0) AS avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE boat_id = b.id AND status = 'approved') AS review_count
    FROM boats b
    WHERE b.featured = 1 AND b.status = 'active'
    ORDER BY b.id
")->fetchAll();

$ayutthaya = $db->query("SELECT * FROM destinations WHERE slug = 'ayutthaya' LIMIT 1")->fetch();
$comingSoon = $db->query("SELECT * FROM destinations WHERE status = 'coming_soon' ORDER BY sort_order")->fetchAll();

$reviews = $db->query("
    SELECT r.*, u.name AS user_name, u.profile_image, bt.name AS boat_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN boats bt ON bt.id = r.boat_id
    WHERE r.status = 'approved'
    ORDER BY r.created_at DESC
    LIMIT 6
")->fetchAll();

$totalBoats   = (int) $db->query("SELECT COUNT(*) FROM boats WHERE status = 'active'")->fetchColumn();
$totalReviews = (int) $db->query("SELECT COUNT(*) FROM reviews WHERE status = 'approved'")->fetchColumn();
$avgRating    = (float) $db->query("SELECT COALESCE(AVG(rating),0) FROM reviews WHERE status = 'approved'")->fetchColumn();
?>

<style>
.hero-search{max-width:680px;margin:0 auto 48px}
.hero-search-form{display:flex;align-items:center;background:#fff;border-radius:60px;padding:6px 6px 6px 8px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.hero-search-field{display:flex;align-items:center;gap:10px;padding:8px 16px;flex:1;min-width:0}
.hero-search-field i{color:var(--primary-light);font-size:16px;flex-shrink:0}
.hero-search-field .form-control{border:none;padding:8px 0;background:0 0;font-size:15px}
.hero-search-field .form-control:focus{box-shadow:none}
.hero-search-divider{width:1px;height:32px;background:var(--border);flex-shrink:0}
.hero-search-form .btn{border-radius:50px;padding:12px 28px;flex-shrink:0}
.hero-stats{display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
.hero-stat-value{font-size:28px;font-weight:800;color:#fff;line-height:1}
.hero-stat-label{font-size:14px;color:rgba(255,255,255,.7);margin-top:4px}
.featured-dest-card{position:relative;border-radius:var(--radius-xl);overflow:hidden;aspect-ratio:21/9}
.featured-dest-card img{width:100%;height:100%;object-fit:cover}
.featured-dest-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(8,47,73,.85) 0%,rgba(8,47,73,.4) 60%,transparent 100%);display:flex;flex-direction:column;justify-content:center;padding:48px;color:#fff}
.featured-dest-overlay h3{font-size:32px;color:#fff;margin-bottom:12px}
.featured-dest-overlay p{color:rgba(255,255,255,.85);margin-bottom:24px;max-width:500px;font-size:16px;line-height:1.7}
.coming-soon-card{position:relative;overflow:hidden}
.coming-soon-card .card-image img{filter:grayscale(30%) brightness(.85)}
.coming-soon-overlay{position:absolute;inset:0;background:rgba(15,23,42,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;gap:8px;padding:20px;text-align:center}
.coming-soon-overlay h4{color:#fff;font-size:16px}
.step-card{text-align:center;padding:32px 20px}
.step-icon{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 20px;background:linear-gradient(135deg,rgba(12,74,110,.08),rgba(2,132,199,.12));color:var(--primary-light)}
.step-number{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--accent);color:var(--primary-dark);font-size:14px;font-weight:700;margin-bottom:12px}
.newsletter-section{background:linear-gradient(135deg,var(--primary-dark),var(--primary));color:#fff;padding:80px 0}
.newsletter-section h2{color:#fff}
.newsletter-section p{color:rgba(255,255,255,.8)}
.newsletter-form{display:flex;gap:12px;max-width:480px;margin:24px auto 0}
.newsletter-form .form-control{flex:1;border-radius:50px;padding:12px 24px;border:2px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff}
.newsletter-form .form-control::placeholder{color:rgba(255,255,255,.6)}
.newsletter-form .form-control:focus{border-color:rgba(255,255,255,.5);box-shadow:none;background:rgba(255,255,255,.15)}
.newsletter-form .btn{border-radius:50px}
@media(max-width:768px){
    .hero-search-form{flex-direction:column;border-radius:var(--radius-xl);padding:12px}
    .hero-search-divider{width:100%;height:1px}
    .hero-search-form .btn{width:100%}
    .hero-stats{gap:24px}
    .featured-dest-card{aspect-ratio:4/3}
    .featured-dest-overlay{padding:24px}
    .featured-dest-overlay h3{font-size:24px}
    .newsletter-form{flex-direction:column}
    .newsletter-form .btn{width:100%}
}
</style>

<main>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero hero-home">
    <div class="hero-bg" style="background-image:url('https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600')"></div>
    <div class="hero-particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
    </div>

    <div class="hero-content">
        <h1>Discover Boat Experiences<br>in <span class="accent">Thailand</span></h1>
        <p class="lead">From ancient river cruises to island adventures. Book unique boat experiences across the Land of Smiles.</p>

        <div class="hero-search">
            <form class="hero-search-form" action="<?= baseUrl('/boats') ?>" method="GET">
                <div class="hero-search-field">
                    <i class="fas fa-map-marker-alt"></i>
                    <select name="destination" class="form-control">
                        <option value="">All Destinations</option>
                        <?php foreach ($destinations as $d): ?>
                            <option value="<?= e($d['slug']) ?>" <?= $d['status'] !== 'active' ? 'disabled' : '' ?>><?= e($d['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="hero-search-divider"></div>
                <div class="hero-search-field">
                    <i class="fas fa-calendar-alt"></i>
                    <input type="date" name="date" class="form-control" placeholder="Select date" min="<?= date('Y-m-d') ?>">
                </div>
                <button type="submit" class="btn btn-accent btn-lg">
                    <i class="fas fa-search"></i> Search
                </button>
            </form>
        </div>

        <div class="hero-stats">
            <div class="text-center">
                <div class="hero-stat-value"><?= $totalBoats ?>+</div>
                <div class="hero-stat-label">Boats</div>
            </div>
            <div class="text-center">
                <div class="hero-stat-value"><?= $totalReviews ?>+</div>
                <div class="hero-stat-label">Happy Customers</div>
            </div>
            <div class="text-center">
                <div class="hero-stat-value"><?= number_format($avgRating, 1) ?>★</div>
                <div class="hero-stat-label">Average Rating</div>
            </div>
        </div>
    </div>

    <div class="hero-wave">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40 C360 100 1080 0 1440 60 L1440 100 L0 100Z" fill="var(--body-bg)"/>
        </svg>
    </div>
</section>

<!-- ═══════════════════ FEATURED DESTINATION ═══════════════════ -->
<section class="section">
    <div class="container">
        <div class="section-title">
            <h2>Featured Destination</h2>
            <p>Start your journey in Thailand's ancient capital</p>
        </div>

        <?php if ($ayutthaya): ?>
        <a href="<?= baseUrl('/destinations/ayutthaya') ?>" class="featured-dest-card">
            <img src="https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200" alt="Ayutthaya" loading="lazy">
            <div class="featured-dest-overlay">
                <span class="badge badge-active mb-3"><i class="fas fa-check-circle"></i> Now Available</span>
                <h3>Ayutthaya — Ancient Capital River Tours</h3>
                <p><?= e($ayutthaya['description']) ?></p>
                <div>
                    <span class="btn btn-accent">Explore Ayutthaya <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </a>
        <?php endif; ?>

        <?php if ($comingSoon): ?>
        <div class="grid grid-4 mt-8">
            <?php foreach ($comingSoon as $cs): ?>
            <div class="card coming-soon-card">
                <div class="card-image" style="aspect-ratio:4/3">
                    <img src="<?= e(destImage($cs, $destFallbackImages)) ?>" alt="<?= e($cs['name']) ?>" loading="lazy">
                </div>
                <div class="coming-soon-overlay">
                    <span class="badge badge-coming-soon"><i class="fas fa-clock"></i> Coming Soon</span>
                    <h4><?= e($cs['name']) ?></h4>
                    <?php if ($cs['name_th']): ?>
                        <span class="text-sm" style="color:rgba(255,255,255,.7)"><?= e($cs['name_th']) ?></span>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- ═══════════════════ POPULAR BOATS ═══════════════════ -->
<section class="section bg-light">
    <div class="container">
        <div class="section-title">
            <h2>Popular Boat Experiences</h2>
            <p>Hand-picked tours loved by travellers from around the world</p>
        </div>

        <?php if ($featuredBoats): ?>
        <div class="grid grid-3">
            <?php foreach ($featuredBoats as $boat): ?>
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
                        <span class="boat-spec"><i class="fas fa-clock"></i> <?= fmtDuration((int)$boat['duration']) ?></span>
                        <span class="boat-spec"><i class="fas fa-users"></i> <?= (int)$boat['capacity'] ?> pax</span>
                        <span class="boat-spec"><i class="fas fa-water"></i> <?= e($boat['river'] ?? 'River') ?></span>
                    </div>
                    <div class="card-footer">
                        <div>
                            <span style="font-size:22px;font-weight:700;color:var(--primary)">฿<?= number_format($boat['price']) ?></span>
                            <span class="text-sm text-muted"> / person</span>
                        </div>
                        <div class="flex items-center gap-1" style="color:var(--accent)">
                            <?= stars((float)$boat['avg_rating']) ?>
                            <span class="text-sm font-semibold" style="margin-left:4px"><?= number_format($boat['avg_rating'], 1) ?></span>
                        </div>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>

        <div class="text-center mt-10">
            <a href="<?= baseUrl('/boats') ?>" class="btn btn-secondary btn-lg">View All Boats <i class="fas fa-arrow-right"></i></a>
        </div>
        <?php else: ?>
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-ship"></i></div>
            <h3>No boats available yet</h3>
            <p>Check back soon for exciting boat experiences!</p>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- ═══════════════════ HOW IT WORKS ═══════════════════ -->
<section class="section">
    <div class="container">
        <div class="section-title">
            <h2>How It Works</h2>
            <p>Book your perfect boat experience in four simple steps</p>
        </div>

        <div class="grid grid-4">
            <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-icon"><i class="fas fa-compass"></i></div>
                <h4 class="mb-2">Choose Destination</h4>
                <p class="text-sm">Pick from Thailand's most beautiful waterways and coastal gems</p>
            </div>
            <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-icon"><i class="fas fa-ship"></i></div>
                <h4 class="mb-2">Select Your Boat</h4>
                <p class="text-sm">Browse longtails, cruises, speedboats and more for your ideal trip</p>
            </div>
            <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-icon"><i class="fas fa-credit-card"></i></div>
                <h4 class="mb-2">Book &amp; Pay</h4>
                <p class="text-sm">Secure your seats with easy online payment via PromptPay or card</p>
            </div>
            <div class="step-card">
                <div class="step-number">4</div>
                <div class="step-icon"><i class="fas fa-sun"></i></div>
                <h4 class="mb-2">Enjoy the Trip</h4>
                <p class="text-sm">Show up at the pier, hop on board and create unforgettable memories</p>
            </div>
        </div>
    </div>
</section>

<!-- ═══════════════════ CUSTOMER REVIEWS ═══════════════════ -->
<section class="section bg-light">
    <div class="container">
        <div class="section-title">
            <h2>What Our Customers Say</h2>
            <p>Real stories from travellers who explored Thailand by boat</p>
        </div>

        <?php if ($reviews): ?>
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
                <div class="review-stars"><?= stars((float)$rev['rating']) ?></div>
                <p class="review-text line-clamp-3"><?= e($rev['comment'] ?? '') ?></p>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-comments"></i></div>
            <h3>No reviews yet</h3>
            <p>Be the first to share your boat experience!</p>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- ═══════════════════ NEWSLETTER ═══════════════════ -->
<section class="newsletter-section">
    <div class="container text-center">
        <h2>Stay Updated</h2>
        <p class="lead" style="color:rgba(255,255,255,.8);max-width:500px;margin:12px auto 0">Get the latest boat tour deals and new destination launches delivered to your inbox.</p>
        <form class="newsletter-form" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed!';this.querySelector('button').disabled=true">
            <input type="email" class="form-control" placeholder="Enter your email" required>
            <button type="submit" class="btn btn-accent btn-lg"><i class="fas fa-paper-plane"></i> Subscribe</button>
        </form>
    </div>
</section>

</main>

<?php require __DIR__ . '/../includes/footer.php'; ?>
