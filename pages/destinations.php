<?php
$pageTitle = 'Destinations';
$bodyClass = 'page-destinations';
require __DIR__ . '/../includes/header.php';
$db = getDB();

$destinations = $db->query("SELECT * FROM destinations ORDER BY sort_order")->fetchAll();

$destFallbackImages = [
    'ayutthaya' => 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800',
    'bangkok'   => 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'phuket'    => 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
    'krabi'     => 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    'pattaya'   => 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800',
];

$boatCountStmt = $db->prepare("SELECT COUNT(*) FROM boats WHERE destination_id = ? AND status = 'active'");
?>

<style>
.dest-grid-featured{display:grid;grid-template-columns:1fr;gap:24px;margin-bottom:24px}
.dest-card-large{display:grid;grid-template-columns:1fr 1fr;min-height:360px;overflow:hidden}
.dest-card-large .dest-card-img{position:relative;overflow:hidden}
.dest-card-large .dest-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.dest-card-large:hover .dest-card-img img{transform:scale(1.05)}
.dest-card-large .dest-card-content{display:flex;flex-direction:column;justify-content:center;padding:40px}
.dest-coming-soon{position:relative}
.dest-coming-soon .card-image img{filter:grayscale(25%) brightness(.9);transition:filter .3s ease}
.dest-coming-soon:hover .card-image img{filter:grayscale(0) brightness(1)}
.dest-coming-soon .overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:2;padding:20px;text-align:center;transition:background .3s ease}
.dest-coming-soon:hover .overlay{background:rgba(15,23,42,.55)}
.dest-coming-soon .overlay h4{color:#fff}
.dest-boat-count{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--primary-light);font-weight:500}
@media(max-width:768px){
    .dest-card-large{grid-template-columns:1fr}
    .dest-card-large .dest-card-img{min-height:220px}
    .dest-card-large .dest-card-content{padding:24px}
}
</style>

<main>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero hero-destination">
    <div class="hero-bg" style="background-image:url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600')"></div>
    <div class="hero-content">
        <h1>Explore Our Destinations</h1>
        <p class="lead">From rivers to oceans, find your perfect boat experience across Thailand</p>
    </div>
    <div class="hero-wave">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40 C360 100 1080 0 1440 60 L1440 100 L0 100Z" fill="var(--body-bg)"/>
        </svg>
    </div>
</section>

<!-- ═══════════════════ DESTINATIONS GRID ═══════════════════ -->
<section class="section">
    <div class="container">

        <?php
        $active  = array_filter($destinations, fn($d) => $d['status'] === 'active');
        $coming  = array_filter($destinations, fn($d) => $d['status'] === 'coming_soon');
        ?>

        <!-- Active Destinations -->
        <?php foreach ($active as $dest):
            $boatCountStmt->execute([$dest['id']]);
            $boatCount = (int) $boatCountStmt->fetchColumn();
            $img = !empty($dest['hero_image']) ? imgUrl($dest['hero_image']) : ($destFallbackImages[$dest['slug']] ?? '');
        ?>
        <div class="dest-grid-featured">
            <div class="card card-hover dest-card-large">
                <div class="dest-card-img">
                    <img src="<?= e($img) ?>" alt="<?= e($dest['name']) ?>" loading="lazy">
                </div>
                <div class="dest-card-content">
                    <span class="badge badge-active mb-3" style="align-self:flex-start"><i class="fas fa-check-circle"></i> Active</span>
                    <h2 class="mb-2"><?= e($dest['name']) ?></h2>
                    <?php if ($dest['name_th']): ?>
                        <p class="text-muted mb-3" style="font-size:18px"><?= e($dest['name_th']) ?></p>
                    <?php endif; ?>
                    <p class="mb-4" style="line-height:1.8"><?= e($dest['description'] ?? '') ?></p>
                    <div class="flex items-center gap-6 mb-6">
                        <span class="dest-boat-count"><i class="fas fa-ship"></i> <?= $boatCount ?> boat<?= $boatCount !== 1 ? 's' : '' ?> available</span>
                        <?php if ($dest['province']): ?>
                            <span class="text-sm text-muted"><i class="fas fa-map-marker-alt"></i> <?= e($dest['province']) ?></span>
                        <?php endif; ?>
                    </div>
                    <div>
                        <a href="<?= baseUrl('/destinations/' . e($dest['slug'])) ?>" class="btn btn-primary btn-lg">
                            Explore <?= e($dest['name']) ?> <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php endforeach; ?>

        <!-- Coming Soon -->
        <?php if ($coming): ?>
        <div class="section-title mt-12">
            <h2>Coming Soon</h2>
            <p>New destinations launching soon — sign up to be the first to know</p>
        </div>

        <div class="grid grid-3">
            <?php foreach ($coming as $dest):
                $img = !empty($dest['hero_image']) ? imgUrl($dest['hero_image']) : ($destFallbackImages[$dest['slug']] ?? '');
            ?>
            <div class="card dest-coming-soon">
                <div class="card-image" style="aspect-ratio:4/3">
                    <img src="<?= e($img) ?>" alt="<?= e($dest['name']) ?>" loading="lazy">
                </div>
                <div class="overlay">
                    <span class="badge badge-coming-soon badge-lg"><i class="fas fa-clock"></i> Coming Soon</span>
                    <h4><?= e($dest['name']) ?></h4>
                    <?php if ($dest['name_th']): ?>
                        <span class="text-sm" style="color:rgba(255,255,255,.75)"><?= e($dest['name_th']) ?></span>
                    <?php endif; ?>
                    <button type="button" class="btn btn-white btn-sm mt-2"
                            onclick="alert('We\'ll notify you when <?= e($dest['name']) ?> launches!')">
                        <i class="fas fa-bell"></i> Notify Me
                    </button>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

    </div>
</section>

</main>

<?php require __DIR__ . '/../includes/footer.php'; ?>
