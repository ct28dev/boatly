    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-grid">
                <div class="footer-column footer-brand">
                    <a href="<?= baseUrl('/') ?>" class="footer-logo">
                        <i class="fas fa-anchor"></i>
                        <span>BOATLY</span>
                    </a>
                    <p class="footer-description">Thailand's premier boat tour platform</p>
                </div>

                <div class="footer-column">
                    <h3 class="footer-heading">Quick Links</h3>
                    <ul class="footer-links">
                        <li><a href="<?= baseUrl('/') ?>">Home</a></li>
                        <li><a href="<?= baseUrl('/destinations') ?>">Destinations</a></li>
                        <li><a href="<?= baseUrl('/boats') ?>">Boats</a></li>
                        <li><a href="<?= baseUrl('/booking') ?>">Booking</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3 class="footer-heading">Destinations</h3>
                    <ul class="footer-links">
                        <li><a href="<?= baseUrl('/destinations/ayutthaya') ?>">Ayutthaya</a></li>
                        <li><a href="<?= baseUrl('/destinations/bangkok') ?>">Bangkok</a></li>
                        <li><a href="<?= baseUrl('/destinations/phuket') ?>">Phuket</a></li>
                        <li><a href="<?= baseUrl('/destinations/krabi') ?>">Krabi</a></li>
                        <li><a href="<?= baseUrl('/destinations/pattaya') ?>">Pattaya</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h3 class="footer-heading">Contact</h3>
                    <ul class="footer-contact">
                        <li><i class="fas fa-envelope"></i> <a href="mailto:hello@boatly.com">hello@boatly.com</a></li>
                        <li><i class="fas fa-phone"></i> <span>+66 2 XXX XXXX</span></li>
                    </ul>
                </div>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2026 BOATLY. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        document.querySelector('.nav-toggle')?.addEventListener('click', function() {
            document.querySelector('.nav-links')?.classList.toggle('active');
        });
    </script>
</body>
</html>
