<?php
$pageTitle = 'Boat Experiences';
$bodyClass = 'page-boats';
require __DIR__ . '/../includes/header.php';
$db = getDB();

$destinations = $db->query("SELECT id, name, slug FROM destinations WHERE status = 'active' ORDER BY sort_order")->fetchAll();

$boats = $db->query("
    SELECT b.*, d.name as destination_name, d.slug as destination_slug,
           (SELECT image_url FROM boat_images WHERE boat_id = b.id AND is_primary = 1 LIMIT 1) as primary_image,
           (SELECT AVG(rating) FROM reviews WHERE boat_id = b.id AND status = 'approved') as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE boat_id = b.id AND status = 'approved') as review_count
    FROM boats b
    JOIN destinations d ON b.destination_id = d.id
    WHERE b.status = 'active'
    ORDER BY b.featured DESC, b.created_at DESC
")->fetchAll();

$boatTypes = [
    'longtail'  => 'Longtail',
    'speedboat' => 'Speedboat',
    'yacht'     => 'Yacht',
    'catamaran' => 'Catamaran',
    'ferry'     => 'Ferry',
    'cruise'    => 'Cruise',
    'houseboat' => 'Houseboat',
];
?>

<main class="page-content">
    <!-- Compact Hero -->
    <section class="hero-compact">
        <div class="hero-compact-bg"></div>
        <div class="container">
            <div class="hero-compact-content">
                <h1>Find Your Perfect Boat Experience</h1>
                <p class="lead">Explore Thailand's waterways with our curated selection of boat tours, river cruises, and island adventures.</p>
            </div>
        </div>
    </section>

    <!-- Filters -->
    <section class="filters-section">
        <div class="container">
            <div class="filters-bar" id="filtersBar">
                <div class="filter-group">
                    <label for="filterDest">Destination</label>
                    <select id="filterDest" class="form-control">
                        <option value="">All Destinations</option>
                        <?php foreach ($destinations as $dest): ?>
                            <option value="<?= e($dest['slug']) ?>"><?= e($dest['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterType">Boat Type</label>
                    <select id="filterType" class="form-control">
                        <option value="">All Types</option>
                        <?php foreach ($boatTypes as $val => $label): ?>
                            <option value="<?= e($val) ?>"><?= e($label) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterPrice">Price Range</label>
                    <select id="filterPrice" class="form-control">
                        <option value="">Any Price</option>
                        <option value="0-1500">Under ฿1,500</option>
                        <option value="1500-3000">฿1,500 – ฿3,000</option>
                        <option value="3000-5000">฿3,000 – ฿5,000</option>
                        <option value="5000-99999">฿5,000+</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="filterSort">Sort By</label>
                    <select id="filterSort" class="form-control">
                        <option value="featured">Popular</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>
            </div>
            <div class="filters-meta" id="filtersMeta">
                <span id="boatCount"><?= count($boats) ?> boat<?= count($boats) !== 1 ? 's' : '' ?> found</span>
                <button type="button" class="btn btn-ghost btn-sm" id="clearFilters" style="display:none">
                    <i class="fas fa-times"></i> Clear Filters
                </button>
            </div>
        </div>
    </section>

    <!-- Boats Grid -->
    <section class="section-sm">
        <div class="container">
            <?php if (empty($boats)): ?>
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-ship"></i></div>
                    <h3>No Boats Available</h3>
                    <p>We're preparing amazing boat experiences for you. Check back soon!</p>
                    <a href="<?= baseUrl('/') ?>" class="btn btn-primary">Back to Home</a>
                </div>
            <?php else: ?>
                <div class="grid grid-3" id="boatsGrid">
                    <?php foreach ($boats as $boat):
                        $img = $boat['primary_image'] ?: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800';
                        $avgRating = $boat['avg_rating'] ? round($boat['avg_rating'], 1) : 0;
                        $reviewCount = (int)$boat['review_count'];
                        $highlights = json_decode($boat['highlights'] ?: '[]', true);
                        $durationHrs = floor($boat['duration'] / 60);
                        $durationMins = $boat['duration'] % 60;
                        $durationStr = $durationHrs > 0
                            ? $durationHrs . 'h' . ($durationMins > 0 ? ' ' . $durationMins . 'm' : '')
                            : $durationMins . 'm';
                    ?>
                    <div class="card card-hover boat-card"
                         data-dest="<?= e($boat['destination_slug']) ?>"
                         data-type="<?= e($boat['boat_type']) ?>"
                         data-price="<?= (int)$boat['price'] ?>"
                         data-rating="<?= $avgRating ?>"
                         data-featured="<?= $boat['featured'] ?>">
                        <div class="card-image">
                            <img src="<?= imgUrl($img) ?>" alt="<?= e($boat['name']) ?>" loading="lazy">
                            <div class="card-image-badges">
                                <span class="badge badge-active"><?= e($boat['destination_name']) ?></span>
                                <span class="badge badge-boat-type <?= e($boat['boat_type']) ?>"><?= e($boatTypes[$boat['boat_type']] ?? ucfirst($boat['boat_type'])) ?></span>
                            </div>
                            <?php if ($boat['featured']): ?>
                                <span class="badge-featured"><i class="fas fa-star"></i> Featured</span>
                            <?php endif; ?>
                        </div>
                        <div class="card-body">
                            <h3 class="boat-card-title"><?= e($boat['name']) ?></h3>
                            <p class="boat-card-desc line-clamp-2"><?= e($boat['description'] ?? '') ?></p>
                            <div class="boat-specs">
                                <span class="boat-spec"><i class="fas fa-clock"></i> <?= $durationStr ?></span>
                                <span class="boat-spec"><i class="fas fa-users"></i> Max <?= (int)$boat['capacity'] ?></span>
                                <?php if ($boat['river']): ?>
                                    <span class="boat-spec"><i class="fas fa-water"></i> <?= e($boat['river']) ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="card-footer">
                                <div>
                                    <span class="card-price">From ฿<?= number_format($boat['price']) ?></span>
                                    <span class="card-price-unit">/person</span>
                                </div>
                                <div class="card-rating-inline">
                                    <?php if ($avgRating > 0): ?>
                                        <i class="fas fa-star"></i>
                                        <span><?= $avgRating ?></span>
                                        <span class="text-muted text-sm">(<?= $reviewCount ?>)</span>
                                    <?php else: ?>
                                        <span class="text-muted text-sm">New</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <a href="<?= baseUrl('/boats/' . e($boat['slug'])) ?>" class="btn btn-primary btn-block mt-4">View Details</a>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <div class="empty-state" id="noResults" style="display:none">
                    <div class="empty-state-icon"><i class="fas fa-search"></i></div>
                    <h3>No Matching Boats</h3>
                    <p>Try adjusting your filters to find what you're looking for.</p>
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('clearFilters').click()">Clear Filters</button>
                </div>
            <?php endif; ?>
        </div>
    </section>
</main>

<style>
.hero-compact {
    position: relative;
    padding: 120px 0 60px;
    background: var(--primary-dark);
    overflow: hidden;
}
.hero-compact-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, #0E7490 100%);
    opacity: 0.95;
}
.hero-compact-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83z' fill='rgba(255,255,255,0.03)' fill-rule='evenodd'/%3E%3C/svg%3E");
}
.hero-compact-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
}
.hero-compact-content h1 {
    color: #fff;
    font-size: 40px;
    line-height: 48px;
    margin-bottom: 12px;
}
.hero-compact-content .lead {
    color: rgba(255,255,255,0.75);
    font-size: 17px;
}

.filters-section {
    background: var(--card-bg);
    border-bottom: 1px solid var(--border-light);
    padding: 24px 0 16px;
    position: sticky;
    top: var(--navbar-height);
    z-index: var(--z-sticky);
    box-shadow: var(--shadow-xs);
}
.filters-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}
.filter-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
}
.filters-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    font-size: 14px;
    color: var(--text-muted);
}

.card-image-badges {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 6px;
    z-index: 2;
    flex-wrap: wrap;
}
.badge-featured {
    position: absolute;
    top: 12px;
    right: 12px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    z-index: 2;
}
.boat-card-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.3;
}
.boat-card-desc {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 14px;
    line-height: 1.5;
}
.card-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
}
.card-price-unit {
    font-size: 13px;
    color: var(--text-light);
    font-weight: 400;
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
    .filters-bar { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
    .hero-compact { padding: 100px 0 40px; }
    .hero-compact-content h1 { font-size: 28px; line-height: 36px; }
    .filters-bar { grid-template-columns: 1fr; }
    .filters-section { position: static; }
}
</style>

<script>
(function() {
    const grid = document.getElementById('boatsGrid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.boat-card'));
    const filterDest = document.getElementById('filterDest');
    const filterType = document.getElementById('filterType');
    const filterPrice = document.getElementById('filterPrice');
    const filterSort = document.getElementById('filterSort');
    const boatCount = document.getElementById('boatCount');
    const clearBtn = document.getElementById('clearFilters');
    const noResults = document.getElementById('noResults');

    function applyFilters() {
        const dest = filterDest.value;
        const type = filterType.value;
        const price = filterPrice.value;
        const sort = filterSort.value;
        let visible = [];

        cards.forEach(card => {
            let show = true;
            if (dest && card.dataset.dest !== dest) show = false;
            if (type && card.dataset.type !== type) show = false;
            if (price) {
                const [min, max] = price.split('-').map(Number);
                const p = parseInt(card.dataset.price);
                if (p < min || p > max) show = false;
            }
            card.style.display = show ? '' : 'none';
            if (show) visible.push(card);
        });

        visible.sort((a, b) => {
            switch (sort) {
                case 'price-asc':  return parseInt(a.dataset.price) - parseInt(b.dataset.price);
                case 'price-desc': return parseInt(b.dataset.price) - parseInt(a.dataset.price);
                case 'rating':     return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                default:           return parseInt(b.dataset.featured) - parseInt(a.dataset.featured);
            }
        });

        visible.forEach(card => grid.appendChild(card));
        cards.filter(c => c.style.display === 'none').forEach(c => grid.appendChild(c));

        boatCount.textContent = visible.length + ' boat' + (visible.length !== 1 ? 's' : '') + ' found';
        noResults.style.display = visible.length === 0 ? '' : 'none';
        grid.style.display = visible.length === 0 ? 'none' : '';
        clearBtn.style.display = (dest || type || price) ? '' : 'none';
    }

    [filterDest, filterType, filterPrice, filterSort].forEach(el => {
        el.addEventListener('change', applyFilters);
    });

    clearBtn.addEventListener('click', () => {
        filterDest.value = '';
        filterType.value = '';
        filterPrice.value = '';
        filterSort.value = 'featured';
        applyFilters();
    });
})();
</script>

<?php require __DIR__ . '/../includes/footer.php'; ?>
