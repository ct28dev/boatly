<?php
$pageTitle = 'Page Not Found';
$bodyClass = 'page-404';
require __DIR__ . '/../includes/header.php';
?>

<main class="page-content">
    <section class="section-lg">
        <div class="container">
            <div class="empty-state" style="padding:100px 20px">
                <div style="font-size:120px;font-weight:900;color:var(--border);line-height:1;margin-bottom:16px">404</div>
                <div class="empty-state-icon"><i class="fas fa-anchor"></i></div>
                <h2 class="mb-3">Page Not Found</h2>
                <p style="max-width:440px">The page you're looking for doesn't exist or may have been moved. Let's get you back on course.</p>
                <div class="flex items-center justify-center gap-4 mt-6" style="flex-wrap:wrap">
                    <a href="<?= baseUrl('/') ?>" class="btn btn-primary btn-lg"><i class="fas fa-home"></i> Back to Home</a>
                    <a href="<?= baseUrl('/destinations') ?>" class="btn btn-secondary btn-lg"><i class="fas fa-compass"></i> Destinations</a>
                </div>
            </div>
        </div>
    </section>
</main>

<?php require __DIR__ . '/../includes/footer.php'; ?>
