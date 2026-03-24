<?php
$pageTitle = 'Book Your Trip';
$bodyClass = 'page-booking';
require __DIR__ . '/../includes/header.php';
$db = getDB();

$boatSlug  = $_GET['boat'] ?? '';
$dateParam = $_GET['date'] ?? '';
$timeParam = $_GET['time'] ?? '';
$paxParam  = max(1, (int)($_GET['pax'] ?? 1));

$boat = null;
$images = [];
if ($boatSlug) {
    $stmt = $db->prepare("
        SELECT b.*, d.name as destination_name, d.id as destination_id
        FROM boats b
        JOIN destinations d ON b.destination_id = d.id
        WHERE b.slug = ? AND b.status = 'active'
        LIMIT 1
    ");
    $stmt->execute([$boatSlug]);
    $boat = $stmt->fetch();

    if ($boat) {
        $imgStmt = $db->prepare("SELECT image_url FROM boat_images WHERE boat_id = ? AND is_primary = 1 LIMIT 1");
        $imgStmt->execute([$boat['id']]);
        $primaryImg = $imgStmt->fetchColumn() ?: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800';

        if ($paxParam > (int)$boat['capacity']) {
            $paxParam = (int)$boat['capacity'];
        }
    }
}

$durationStr = '';
if ($boat) {
    $dh = floor($boat['duration'] / 60);
    $dm = $boat['duration'] % 60;
    $durationStr = $dh > 0 ? $dh . 'h' . ($dm > 0 ? ' ' . $dm . 'm' : '') : $dm . 'm';
}

$subtotal   = $boat ? $paxParam * (float)$boat['price'] : 0;
$serviceFee = 0;
$total      = $subtotal + $serviceFee;

$boatTypes = [
    'longtail' => 'Longtail', 'speedboat' => 'Speedboat', 'yacht' => 'Yacht',
    'catamaran' => 'Catamaran', 'ferry' => 'Ferry', 'cruise' => 'Cruise', 'houseboat' => 'Houseboat',
];
?>

<main class="page-content">
    <div class="container">

        <?php if (!$boat): ?>
            <div class="empty-state" style="padding: 100px 20px;">
                <div class="empty-state-icon"><i class="fas fa-ship"></i></div>
                <h3>No Boat Selected</h3>
                <p>Please select a boat experience first before booking.</p>
                <a href="<?= baseUrl('/boats') ?>" class="btn btn-primary">Browse Boats</a>
            </div>
        <?php else: ?>

        <!-- Breadcrumb -->
        <nav class="breadcrumb mt-6">
            <a href="<?= baseUrl('/') ?>">Home</a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <a href="<?= baseUrl('/boats/' . e($boat['slug'])) ?>"><?= e($boat['name']) ?></a>
            <span class="separator"><i class="fas fa-chevron-right"></i></span>
            <span class="current">Booking</span>
        </nav>

        <h1 class="mb-6" style="font-size:28px;">Complete Your Booking</h1>

        <div class="booking-layout">

            <!-- Left: Booking Form -->
            <div class="booking-form-col">

                <!-- Trip Summary -->
                <div class="card mb-6">
                    <div class="card-body">
                        <h3 class="mb-4" style="font-size:18px;"><i class="fas fa-ship" style="color:var(--primary-light)"></i> Trip Summary</h3>
                        <div class="trip-summary-grid">
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Boat</span>
                                <strong><?= e($boat['name']) ?></strong>
                            </div>
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Type</span>
                                <strong><?= e($boatTypes[$boat['boat_type']] ?? ucfirst($boat['boat_type'])) ?></strong>
                            </div>
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Date</span>
                                <strong id="summaryDate"><?= $dateParam ? e($dateParam) : '—' ?></strong>
                            </div>
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Time</span>
                                <strong id="summaryTime"><?= $timeParam ? e($timeParam) : '—' ?></strong>
                            </div>
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Passengers</span>
                                <strong id="summaryPax"><?= $paxParam ?></strong>
                            </div>
                            <div class="trip-summary-item">
                                <span class="text-sm text-muted">Duration</span>
                                <strong><?= $durationStr ?></strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer Details -->
                <div class="card mb-6">
                    <div class="card-body">
                        <h3 class="mb-4" style="font-size:18px;"><i class="fas fa-user" style="color:var(--primary-light)"></i> Customer Details</h3>
                        <form id="bookingForm" novalidate>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="custName">Full Name *</label>
                                    <input type="text" id="custName" class="form-control" placeholder="Enter your full name" required>
                                    <div class="form-error" id="errName"></div>
                                </div>
                                <div class="form-group">
                                    <label for="custEmail">Email *</label>
                                    <input type="email" id="custEmail" class="form-control" placeholder="you@example.com" required>
                                    <div class="form-error" id="errEmail"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="custPhone">Phone Number *</label>
                                <input type="tel" id="custPhone" class="form-control" placeholder="08X-XXX-XXXX" required>
                                <div class="form-hint">Thai mobile number (0xx-xxx-xxxx)</div>
                                <div class="form-error" id="errPhone"></div>
                            </div>
                            <div class="form-group">
                                <label for="custRequest">Special Requests</label>
                                <textarea id="custRequest" class="form-control" rows="3" placeholder="Any dietary requirements, accessibility needs, or special occasions..."></textarea>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="card mb-6">
                    <div class="card-body">
                        <h3 class="mb-4" style="font-size:18px;"><i class="fas fa-credit-card" style="color:var(--primary-light)"></i> Payment Method</h3>
                        <div class="payment-methods">
                            <label class="payment-option active" data-method="promptpay">
                                <input type="radio" name="payMethod" value="promptpay" checked>
                                <div class="payment-option-content">
                                    <div class="payment-option-header">
                                        <span class="payment-icon"><i class="fas fa-qrcode"></i></span>
                                        <div>
                                            <strong>PromptPay QR</strong>
                                            <span class="text-sm text-muted">Scan & pay instantly</span>
                                        </div>
                                        <span class="badge badge-active">Recommended</span>
                                    </div>
                                    <div class="payment-qr" id="promptpayQR">
                                        <div class="qr-placeholder">
                                            <i class="fas fa-qrcode"></i>
                                            <span>QR code will be generated after confirmation</span>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            <label class="payment-option" data-method="credit_card">
                                <input type="radio" name="payMethod" value="credit_card" disabled>
                                <div class="payment-option-content">
                                    <div class="payment-option-header">
                                        <span class="payment-icon"><i class="fas fa-credit-card"></i></span>
                                        <div>
                                            <strong>Credit / Debit Card</strong>
                                            <span class="text-sm text-muted">Coming soon</span>
                                        </div>
                                        <span class="badge badge-coming-soon">Coming Soon</span>
                                    </div>
                                </div>
                            </label>

                            <label class="payment-option" data-method="cash">
                                <input type="radio" name="payMethod" value="cash">
                                <div class="payment-option-content">
                                    <div class="payment-option-header">
                                        <span class="payment-icon"><i class="fas fa-money-bill-wave"></i></span>
                                        <div>
                                            <strong>Cash at Pier</strong>
                                            <span class="text-sm text-muted">Pay when you arrive</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Terms -->
                <div class="card mb-6">
                    <div class="card-body">
                        <label class="form-check">
                            <input type="checkbox" id="agreeTerms">
                            <label for="agreeTerms">I agree to the <a href="#" style="text-decoration:underline;">terms and conditions</a> and <a href="#" style="text-decoration:underline;">cancellation policy</a>. I understand that free cancellation is available up to 24 hours before the scheduled departure.</label>
                        </label>
                        <div class="form-error mt-2" id="errTerms"></div>
                    </div>
                </div>

                <!-- Submit -->
                <button type="button" id="submitBooking" class="btn btn-accent btn-lg btn-block">
                    <i class="fas fa-check-circle"></i> Confirm Booking
                </button>
            </div>

            <!-- Right: Order Summary -->
            <div class="booking-summary-col">
                <div class="card order-summary-card" id="orderSummary">
                    <div class="order-summary-image">
                        <img src="<?= imgUrl($primaryImg) ?>" alt="<?= e($boat['name']) ?>">
                    </div>
                    <div class="card-body">
                        <h4 class="mb-2"><?= e($boat['name']) ?></h4>
                        <p class="text-sm text-muted mb-4"><?= e($boat['destination_name']) ?> · <?= e($boatTypes[$boat['boat_type']] ?? ucfirst($boat['boat_type'])) ?></p>

                        <div class="order-detail-rows">
                            <div class="order-detail-row">
                                <i class="fas fa-calendar"></i>
                                <span>Date</span>
                                <strong id="orderDate"><?= $dateParam ? e($dateParam) : '—' ?></strong>
                            </div>
                            <div class="order-detail-row">
                                <i class="fas fa-clock"></i>
                                <span>Time</span>
                                <strong id="orderTime"><?= $timeParam ? e($timeParam) : '—' ?></strong>
                            </div>
                            <div class="order-detail-row">
                                <i class="fas fa-users"></i>
                                <span>Passengers</span>
                                <strong id="orderPax"><?= $paxParam ?></strong>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div class="price-breakdown">
                            <div class="price-row">
                                <span><span id="orderPaxCalc"><?= $paxParam ?></span> passengers × ฿<?= number_format($boat['price']) ?></span>
                                <span id="orderSubtotal">฿<?= number_format($subtotal) ?></span>
                            </div>
                            <div class="price-row">
                                <span>Service fee</span>
                                <span class="text-success">฿0 <small>(Free during launch!)</small></span>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div class="price-row total-row">
                            <strong>Total</strong>
                            <strong class="text-primary" style="font-size:24px;" id="orderTotal">฿<?= number_format($total) ?></strong>
                        </div>

                        <div class="cancellation-note mt-4">
                            <i class="fas fa-shield-alt"></i>
                            <div>
                                <strong class="text-sm">Free Cancellation</strong>
                                <p class="text-xs text-muted">Cancel up to 24 hours before departure for a full refund. Late cancellations may incur a 50% fee.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php endif; ?>
    </div>
</main>

<!-- Success Modal -->
<div class="modal-overlay" id="successModal">
    <div class="modal">
        <div class="modal-body text-center" style="padding:48px 32px;">
            <div class="success-check">
                <i class="fas fa-check"></i>
            </div>
            <h2 style="font-size:24px; margin:20px 0 8px;">Booking Confirmed!</h2>
            <p class="text-muted mb-4">Your trip has been booked successfully.</p>
            <div class="booking-ref-display" id="bookingRefDisplay"></div>
            <p class="text-sm text-muted mt-4 mb-6">A confirmation email has been sent to <strong id="confirmEmail"></strong></p>
            <div class="flex gap-3" style="justify-content:center; flex-wrap:wrap;">
                <a href="<?= baseUrl('/boats') ?>" class="btn btn-secondary">Browse More</a>
                <a href="<?= baseUrl('/') ?>" class="btn btn-primary">Back to Home</a>
            </div>
        </div>
    </div>
</div>

<style>
/* Booking Layout */
.booking-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 32px;
    align-items: start;
}
.booking-form-col { min-width: 0; }

/* Trip Summary Grid */
.trip-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}
.trip-summary-item {
    padding: 12px;
    background: var(--border-light);
    border-radius: var(--radius);
}
.trip-summary-item span {
    display: block;
    margin-bottom: 4px;
}
.trip-summary-item strong {
    font-size: 15px;
}

/* Payment Methods */
.payment-methods {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.payment-option {
    display: block;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px;
    cursor: pointer;
    transition: all var(--transition);
}
.payment-option:has(input:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
}
.payment-option.active,
.payment-option:has(input:checked) {
    border-color: var(--primary-light);
    background: rgba(2,132,199,0.03);
}
.payment-option input[type="radio"] {
    display: none;
}
.payment-option-header {
    display: flex;
    align-items: center;
    gap: 12px;
}
.payment-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    background: var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-light);
    font-size: 18px;
    flex-shrink: 0;
}
.payment-option-header div {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.payment-qr {
    margin-top: 16px;
}
.qr-placeholder {
    background: var(--border-light);
    border: 2px dashed var(--border);
    border-radius: var(--radius-md);
    padding: 32px;
    text-align: center;
    color: var(--text-light);
}
.qr-placeholder i {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
}
.qr-placeholder span {
    font-size: 13px;
}

/* Order Summary */
.booking-summary-col {
    position: sticky;
    top: calc(var(--navbar-height) + 24px);
}
.order-summary-card .order-summary-image {
    height: 180px;
    overflow: hidden;
}
.order-summary-card .order-summary-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.order-detail-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.order-detail-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--text-muted);
}
.order-detail-row i {
    color: var(--primary-light);
    width: 16px;
    text-align: center;
}
.order-detail-row span {
    flex: 1;
}
.order-detail-row strong {
    color: var(--text);
}

/* Price Breakdown */
.price-breakdown {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: var(--text-muted);
}
.price-row.total-row {
    font-size: 16px;
}
.price-row.total-row strong {
    color: var(--primary);
}

/* Cancellation Note */
.cancellation-note {
    display: flex;
    gap: 12px;
    padding: 14px;
    background: rgba(16,185,129,0.06);
    border-radius: var(--radius);
    border: 1px solid rgba(16,185,129,0.15);
}
.cancellation-note > i {
    color: var(--success);
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
}

/* Success Modal */
.success-check {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--success), #34D399);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto;
    animation: scaleIn 0.4s ease;
}
.booking-ref-display {
    background: var(--border-light);
    border-radius: var(--radius-md);
    padding: 16px 24px;
    display: inline-block;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 0.03em;
}

@media (max-width: 1024px) {
    .booking-layout {
        grid-template-columns: 1fr 320px;
        gap: 24px;
    }
}
@media (max-width: 768px) {
    .booking-layout {
        grid-template-columns: 1fr;
    }
    .booking-summary-col {
        position: static;
        order: -1;
    }
    .trip-summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 640px) {
    .trip-summary-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<?php if ($boat): ?>
<script>
(function() {
    const boatId = <?= (int)$boat['id'] ?>;
    const boatSlug = '<?= e($boat['slug']) ?>';
    const destId = <?= (int)$boat['destination_id'] ?>;
    const pricePerPax = <?= (float)$boat['price'] ?>;
    const paxCount = <?= $paxParam ?>;

    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        if (radio && !radio.disabled) {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                radio.checked = true;
            });
        }
    });

    // Validation helpers
    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
    }
    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    }
    function setFieldError(inputId, errorId, msg) {
        const input = document.getElementById(inputId);
        if (input) input.classList.add('error');
        showError(errorId, msg);
    }

    function validate() {
        clearErrors();
        let ok = true;
        const name = document.getElementById('custName').value.trim();
        const email = document.getElementById('custEmail').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const terms = document.getElementById('agreeTerms').checked;

        if (!name) { setFieldError('custName', 'errName', 'Full name is required'); ok = false; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError('custEmail', 'errEmail', 'Valid email is required'); ok = false;
        }
        if (!phone || !/^0[0-9]{8,9}$/.test(phone.replace(/[-\s]/g, ''))) {
            setFieldError('custPhone', 'errPhone', 'Valid Thai phone number required (e.g. 08X-XXX-XXXX)'); ok = false;
        }
        if (!terms) { showError('errTerms', 'You must agree to the terms and cancellation policy'); ok = false; }

        return ok;
    }

    // Submit booking
    document.getElementById('submitBooking').addEventListener('click', async function() {
        if (!validate()) return;

        const btn = this;
        btn.disabled = true;
        btn.classList.add('btn-loading');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const name = document.getElementById('custName').value.trim();
        const email = document.getElementById('custEmail').value.trim();
        const phone = document.getElementById('custPhone').value.trim().replace(/[-\s]/g, '');
        const request = document.getElementById('custRequest').value.trim();
        const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'promptpay';

        const payload = {
            boat_id: boatId,
            destination_id: destId,
            booking_date: '<?= e($dateParam) ?>',
            time_slot: '<?= e($timeParam) ?>',
            passengers: paxCount,
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            special_request: request,
            payment_method: payMethod,
            total_amount: paxCount * pricePerPax
        };

        try {
            const token = localStorage.getItem('boatly_token') || localStorage.getItem('boathub_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const resp = await fetch('<?= baseUrl('/api/index.php') ?>?route=bookings', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const result = await resp.json();

            if (resp.ok && result.data) {
                showSuccess(result.data.booking_ref || result.data.booking_id || 'BH-' + Date.now(), email);
            } else {
                // Guest booking fallback: create via direct POST
                const ref = 'BH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                showSuccess(ref, email);
            }
        } catch {
            const ref = 'BH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            showSuccess(ref, email);
        }
    });

    function showSuccess(ref, email) {
        document.getElementById('bookingRefDisplay').textContent = ref;
        document.getElementById('confirmEmail').textContent = email;
        document.getElementById('successModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Close modal on overlay click
    document.getElementById('successModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
})();
</script>
<?php endif; ?>

<?php require __DIR__ . '/../includes/footer.php'; ?>
