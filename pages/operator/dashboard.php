<?php require_once __DIR__ . '/../../includes/base_path.php'; $BASE = app_base_path(); ?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Operator Dashboard | BOATLY</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
:root{--sb:#0f172a;--sb-h:#1e293b;--pri:#0284c7;--pri-d:#0c4a6e;--acc:#f59e0b;--ok:#10b981;--err:#ef4444;--bg:#f8fafc;--card:#fff;--tx:#1e293b;--mu:#64748b;--bd:#e2e8f0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans Thai',sans-serif;background:var(--bg);color:var(--tx);display:flex;min-height:100vh}
.login-wrap{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0f172a,#0c4a6e,#0284c7);display:flex;align-items:center;justify-content:center}
.login-wrap.hidden{display:none}
.login-box{background:#fff;border-radius:20px;padding:40px 32px;max-width:400px;width:90%;text-align:center}
.login-box h1{font-size:24px;margin-bottom:4px}.login-box p{font-size:13px;color:var(--mu);margin-bottom:24px}
.login-box .fg{margin-bottom:14px;text-align:left}.login-box label{font-size:12px;font-weight:600;color:var(--mu);display:block;margin-bottom:4px}
.login-box input{width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px;font-size:14px;font-family:inherit;outline:none}
.login-box input:focus{border-color:var(--pri)}
.login-box .btn{width:100%;height:48px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--pri-d),var(--pri));color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;font-family:inherit}
.login-box .err{color:var(--err);font-size:12px;margin-top:8px;min-height:16px}
.login-box .hint{font-size:11px;color:var(--mu);margin-top:16px;padding-top:12px;border-top:1px solid var(--bd)}
.sidebar{width:260px;background:var(--sb);color:#fff;padding:20px 0;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;transition:transform .3s}
.sb-logo{padding:0 20px 24px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:16px;display:flex;align-items:center;gap:10px}
.sb-logo i{font-size:24px;color:var(--pri)}
.sb-logo span{font-size:18px;font-weight:700}
.sb-logo small{display:block;font-size:11px;color:var(--mu);font-weight:400}
.sb-nav a{display:flex;align-items:center;gap:12px;padding:10px 20px;color:rgba(255,255,255,.6);font-size:13px;font-weight:500;text-decoration:none;transition:all .2s;cursor:pointer}
.sb-nav a:hover,.sb-nav a.active{color:#fff;background:rgba(255,255,255,.06)}
.sb-nav a.active{border-left:3px solid var(--pri);color:var(--pri)}
.sb-nav a i{width:20px;text-align:center}
.sb-nav .sep{height:1px;background:rgba(255,255,255,.08);margin:12px 0}
.main{flex:1;overflow-x:hidden}
.topbar{height:64px;background:var(--card);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 24px;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar h2{font-size:18px;font-weight:600}
.topbar .menu-btn{display:none;width:36px;height:36px;border:none;background:var(--bg);border-radius:8px;cursor:pointer;font-size:16px}
.content{padding:24px}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;margin-bottom:24px}
.stat{background:var(--card);border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.stat .icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:12px}
.stat .val{font-size:28px;font-weight:700;margin-bottom:2px}
.stat .lbl{font-size:12px;color:var(--mu)}
.card{background:var(--card);border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden}
.card-hd{padding:16px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between}
.card-hd h3{font-size:15px;font-weight:600}
.card-bd{padding:20px}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:12px;font-weight:600;color:var(--mu);padding:10px 12px;border-bottom:2px solid var(--bd)}
td{padding:10px 12px;font-size:13px;border-bottom:1px solid #f1f5f9}
tr:hover td{background:#f8fafc}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.badge-ok{background:#d1fae5;color:#065f46}.badge-warn{background:#fef3c7;color:#92400e}.badge-err{background:#fee2e2;color:#991b1b}.badge-info{background:#dbeafe;color:#1e40af}
.page{display:none}.page.active{display:block}
.boat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.boat-item{background:var(--card);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.boat-item img{width:100%;height:160px;object-fit:cover}
.boat-item .info{padding:14px}
.boat-item h4{font-size:14px;font-weight:600;margin-bottom:6px}
.boat-item .meta{font-size:12px;color:var(--mu);display:flex;gap:12px}
.boat-item .price{font-size:18px;font-weight:700;color:var(--pri-d);margin-top:8px}
.btn-sm{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit}
.btn-pri{background:var(--pri);color:#fff}.btn-sec{background:var(--bg);color:var(--tx);border:1px solid var(--bd)}
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;transition:transform .3s;font-family:inherit}
.toast.show{transform:translateX(-50%) translateY(0)}.toast.ok{background:#d1fae5;color:#065f46}.toast.err{background:#fee2e2;color:#991b1b}
@media(max-width:768px){.sidebar{position:fixed;z-index:100;transform:translateX(-100%)}.sidebar.open{transform:translateX(0)}.topbar .menu-btn{display:flex;align-items:center;justify-content:center}.stats{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="login-wrap" id="loginWrap">
  <div class="login-box">
    <i class="fas fa-ship" style="font-size:40px;color:var(--pri);margin-bottom:16px"></i>
    <h1>Operator Dashboard</h1>
    <p>เข้าสู่ระบบจัดการเรือของคุณ</p>
    <div class="fg"><label>อีเมล</label><input type="email" id="lEmail" placeholder="somsak@ayutthaya-boats.com" autocomplete="email"></div>
    <div class="fg"><label>รหัสผ่าน</label><input type="password" id="lPass" placeholder="รหัสผ่าน" onkeydown="if(event.key==='Enter')doOpLogin()"></div>
    <div class="err" id="lErr"></div>
    <button class="btn" onclick="doOpLogin()">เข้าสู่ระบบ</button>
    <div class="hint">
      ยังไม่มีบัญชี? <a href="<?= htmlspecialchars($BASE) ?>/operator/register" style="color:var(--pri);font-weight:600">สมัครเป็นพาร์ทเนอร์</a><br>
      ทดลอง: somsak@ayutthaya-boats.com / password123<br>
      <a href="<?= htmlspecialchars($BASE) ?>/setup.php?action=add-operator" style="color:var(--acc);font-size:11px;margin-top:4px;display:inline-block">ยังไม่มีผู้ใช้ทดสอบ? คลิกสร้างบัญชีทดสอบ</a>
    </div>
  </div>
</div>

<aside class="sidebar" id="sidebar">
  <div class="sb-logo"><i class="fas fa-anchor"></i><div><span>BOATLY</span><small>พื้นที่จัดการพาร์ทเนอร์</small></div></div>
  <nav class="sb-nav">
    <a class="active" data-page="dashboard" onclick="nav(this)"><i class="fas fa-chart-line"></i>Dashboard</a>
    <a data-page="boats" onclick="nav(this)"><i class="fas fa-ship"></i>เรือของฉัน</a>
    <a data-page="bookings" onclick="nav(this)" style="position:relative"><i class="fas fa-calendar-check"></i>การจอง<span id="opBookingNewBadgeFull" style="display:none;position:absolute;top:6px;right:12px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid var(--sb)" title="มีการจองใหม่"></span></a>
    <a data-page="addons" onclick="nav(this)"><i class="fas fa-plus-circle"></i>เสริมบริการ (Add-on)</a>
    <a data-page="revenue" onclick="nav(this)"><i class="fas fa-coins"></i>รายรับ</a>
    <a data-page="reviews" onclick="nav(this)"><i class="fas fa-star"></i>รีวิวจากลูกค้า</a>
    <a data-page="tips" onclick="nav(this)" style="position:relative"><i class="fas fa-hand-holding-heart"></i>ทิป<span id="opTipsBadge" style="display:none;position:absolute;top:6px;right:12px;width:10px;height:10px;background:#a855f7;border-radius:50%;border:2px solid var(--sb)" title="มีทิปใหม่"></span></a>
    <a data-page="notifications" onclick="nav(this)"><i class="fas fa-bell"></i>การแจ้งเตือน</a>
    <a data-page="documents" onclick="nav(this)"><i class="fas fa-file-alt"></i>เอกสารสำคัญ</a>
    <div class="sep"></div>
    <a onclick="doLogout()"><i class="fas fa-sign-out-alt"></i>ออกจากระบบ</a>
    <a href="<?= htmlspecialchars($BASE) ?>/" style="margin-top:8px"><i class="fas fa-globe"></i>กลับหน้าเว็บ</a>
  </nav>
</aside>

<div class="main">
  <div class="topbar" style="border-bottom:2px solid rgba(2,132,199,0.2)">
    <button class="menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open')"><i class="fas fa-bars"></i></button>
    <h2 id="pageTitle">Dashboard</h2>
    <div style="display:flex;align-items:center;gap:16px">
      <a onclick="nav(document.querySelector('[data-page=notifications]'))" style="position:relative;color:var(--mu);text-decoration:none;cursor:pointer" title="การแจ้งเตือน">
        <i class="fas fa-bell" style="font-size:18px"></i>
        <span id="notifBadge" style="display:none;position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;align-items:center;justify-content:center;padding:0 4px">0</span>
      </a>
      <span id="opName" style="font-size:13px;color:var(--mu)"></span>
    </div>
  </div>

  <!-- DASHBOARD -->
  <div class="page active" id="pg-dashboard">
    <div class="content">
      <div class="stats">
        <div class="stat"><div class="icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-ship"></i></div><div class="val" id="stBoats">0</div><div class="lbl">เรือทั้งหมด</div></div>
        <div class="stat"><div class="icon" style="background:#d1fae5;color:#059669"><i class="fas fa-calendar-check"></i></div><div class="val" id="stBookings">0</div><div class="lbl">การจองเดือนนี้</div></div>
        <div class="stat"><div class="icon" style="background:#fef3c7;color:#d97706"><i class="fas fa-coins"></i></div><div class="val" id="stRevenue">฿0</div><div class="lbl">รายรับเดือนนี้</div></div>
        <div class="stat"><div class="icon" style="background:#fce7f3;color:#db2777"><i class="fas fa-star"></i></div><div class="val" id="stRating">0</div><div class="lbl">คะแนนเฉลี่ย</div></div>
        <div class="stat"><div class="icon" style="background:#fdf4ff;color:#a855f7"><i class="fas fa-hand-holding-heart"></i></div><div class="val" id="stTips">฿0</div><div class="lbl">ทิปจากลูกค้า</div><div class="lbl" id="stTipsToday" style="font-size:11px;color:#a855f7;margin-top:2px"></div></div>
      </div>
      <div class="card">
        <div class="card-hd" style="display:flex;justify-content:space-between;align-items:center"><h3>การจองล่าสุด</h3><a href="#" onclick="nav(document.querySelector('[data-page=bookings]'));return false" style="font-size:13px;color:var(--pri);font-weight:600">ดูทั้งหมด &gt;</a></div>
        <div class="card-bd"><table><thead><tr><th style="width:36px"></th><th>Ref</th><th>ลูกค้า</th><th>เรือ</th><th>วันที่</th><th>สถานะ</th><th>ยอด</th></tr></thead><tbody id="recentBookings"><tr><td colspan="7" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- BOATS -->
  <div class="page" id="pg-boats">
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3>เรือของฉัน</h3>
        <button class="btn-sm btn-pri" onclick="showBoatModal()"><i class="fas fa-plus"></i> เพิ่มเรือ/ทัวร์</button>
      </div>
      <div class="boat-grid" id="boatGrid"><p style="color:var(--mu)">กำลังโหลด...</p></div>
    </div>
  </div>

  <!-- BOOKINGS -->
  <div class="page" id="pg-bookings">
    <div class="content">
      <div id="opBookingsAckBarFull" style="display:none;margin-bottom:16px;padding:12px 16px;background:#fef3c7;border-radius:10px;border:1px solid #fcd34d;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font-size:13px;color:#92400e;font-weight:600"><i class="fas fa-bell" style="margin-right:6px"></i>มีการจองเข้ามาใหม่ — กรุณายืนยันรับรู้</span>
        <button type="button" onclick="acknowledgeBookingsFull()" class="btn-sm btn-pri" style="background:#22c55e;border-color:#22c55e"><i class="fas fa-check-double" style="margin-right:6px"></i>ยืนยันรับรู้</button>
      </div>
      <div class="card">
        <div class="card-hd"><h3>การจองทั้งหมด</h3></div>
        <div class="card-bd"><table><thead><tr><th style="width:36px"></th><th>Ref</th><th>ลูกค้า</th><th>เรือ</th><th>วันที่</th><th>เวลา</th><th>จำนวน</th><th>ยอด</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody id="allBookings"><tr><td colspan="10" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- ADDONS -->
  <div class="page" id="pg-addons">
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3>เสริมบริการ (Add-on)</h3>
        <button class="btn-sm btn-pri" onclick="showAddonModal()"><i class="fas fa-plus"></i> เพิ่ม Add-on</button>
      </div>
      <div class="card">
        <div class="card-hd"><h3>รายการเสริมบริการทั้งหมด</h3></div>
        <div class="card-bd"><table><thead><tr><th>ชื่อ</th><th>ราคา</th><th>ใช้กับเรือ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody id="addonsTable"><tr><td colspan="5" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- REVIEWS -->
  <div class="page" id="pg-reviews">
    <div class="content">
      <div class="card">
        <div class="card-hd"><h3>รีวิวจากลูกค้า</h3></div>
        <div class="card-bd"><table><thead><tr><th>ลูกค้า</th><th>เรือ</th><th>คะแนน</th><th>ความคิดเห็น</th><th>วันที่</th><th>จัดการ</th></tr></thead><tbody id="reviewsTable"><tr><td colspan="6" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- TIPS -->
  <div class="page" id="pg-tips">
    <div class="content">
      <div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px">
        <div class="stat"><div class="icon" style="background:#fce7f3;color:#db2777"><i class="fas fa-hand-holding-heart"></i></div><div class="val" id="tipsTotal">฿0</div><div class="lbl">ทิปทั้งหมดจากลูกค้า</div></div>
        <div class="stat"><div class="icon" style="background:#d1fae5;color:#059669"><i class="fas fa-sun"></i></div><div class="val" id="tipsToday">฿0</div><div class="lbl">ทิปวันนี้</div></div>
        <div class="stat"><div class="icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-trophy"></i></div><div class="val" id="tipsTopBoat">-</div><div class="lbl">Top Boat</div></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-hd"><h3><i class="fas fa-chart-area" style="color:#a855f7;margin-right:8px"></i>กราฟทิป 7 วันล่าสุด</h3></div>
        <div class="card-bd" style="min-height:120px">
          <div id="tipsChart" style="display:flex;align-items:flex-end;gap:8px;height:100px;padding:12px 0"></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-hd"><h3><i class="fas fa-qrcode" style="color:#a855f7;margin-right:8px"></i>ตั้งค่า QR สำหรับรับทิป</h3></div>
        <div class="card-bd">
          <p style="font-size:13px;color:var(--mu);margin-bottom:12px">ใส่เบอร์โทรศัพท์หรือเลขบัตรประชาชนที่ผูกกับ PromptPay เพื่อให้ลูกค้าสแกน QR โอนทิปให้คุณได้</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
            <div style="flex:1;min-width:200px">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">เบอร์ PromptPay</label>
              <input type="text" id="tipPromptPayInput" placeholder="0812345678 หรือ 1234567890123" maxlength="13" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px">
            </div>
            <button class="btn-sm btn-pri" onclick="saveTipPromptPay()"><i class="fas fa-save"></i> บันทึก</button>
          </div>
          <p id="tipPromptPayStatus" style="font-size:12px;color:var(--mu);margin-top:10px"></p>
        </div>
      </div>
      <div class="card">
        <div class="card-hd" style="display:flex;justify-content:space-between;align-items:center"><h3>รายการทิป</h3><button type="button" class="btn-sm btn-sec" onclick="exportTipsCsv()"><i class="fas fa-download" style="margin-right:6px"></i>Export CSV</button></div>
        <div class="card-bd"><table><thead><tr><th>Ref</th><th>ลูกค้า</th><th>เรือ</th><th>จำนวน</th><th>ข้อความ</th><th>วันที่</th></tr></thead><tbody id="tipsTable"><tr><td colspan="6" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- NOTIFICATIONS -->
  <div class="page" id="pg-notifications">
    <div class="content">
      <div class="card">
        <div class="card-hd"><h3>การแจ้งเตือน</h3></div>
        <div class="card-bd" id="notificationsList"><p style="text-align:center;color:var(--mu)">กำลังโหลด...</p></div>
      </div>
    </div>
  </div>

  <!-- DOCUMENTS -->
  <div class="page" id="pg-documents">
    <div class="content">
      <div class="card" style="margin-bottom:16px;border-left:4px solid var(--acc)">
        <div class="card-hd"><h3><i class="fas fa-exclamation-triangle" style="color:var(--acc);margin-right:8px"></i>เอกสารใกล้หมดอายุ</h3></div>
        <div class="card-bd" id="documentsExpiring"><p style="text-align:center;color:var(--mu)">กำลังโหลด...</p></div>
      </div>
      <div class="card">
        <div class="card-hd"><h3>เอกสารสำคัญทั้งหมด</h3><button class="btn-sm btn-pri" onclick="showDocumentModal()"><i class="fas fa-plus"></i> เพิ่มเอกสาร</button></div>
        <div class="card-bd"><table><thead><tr><th>ประเภท</th><th>เรือ</th><th>ชื่อ</th><th>หมดอายุ</th><th>จัดการ</th></tr></thead><tbody id="documentsTable"><tr><td colspan="5" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>

  <!-- REVENUE -->
  <div class="page" id="pg-revenue">
    <div class="content">
      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><div class="icon" style="background:#d1fae5;color:#059669"><i class="fas fa-wallet"></i></div><div class="val" id="rvTotal">฿0</div><div class="lbl">รายรับทั้งหมด</div></div>
        <div class="stat"><div class="icon" style="background:#dbeafe;color:#2563eb"><i class="fas fa-calendar"></i></div><div class="val" id="rvMonth">฿0</div><div class="lbl">เดือนนี้</div></div>
        <div class="stat"><div class="icon" style="background:#fef3c7;color:#d97706"><i class="fas fa-hourglass-half"></i></div><div class="val" id="rvPending">฿0</div><div class="lbl">รอจ่าย</div></div>
      </div>
      <div class="card">
        <div class="card-hd"><h3>รายการรับเงิน</h3></div>
        <div class="card-bd"><table><thead><tr><th>Ref</th><th>เรือ</th><th>วันที่</th><th>ยอด</th><th>สถานะ</th></tr></thead><tbody id="revTable"><tr><td colspan="5" style="text-align:center;color:var(--mu)">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
    </div>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
// API base — /boatly หรือ legacy /boathub หรือ root
var APP_PATH_PREFIX = (function () {
  var p = location.pathname || '';
  if (p.startsWith('/boatly')) return '/boatly';
  if (p.startsWith('/boathub')) return '/boathub';
  return '';
})();
const API = APP_PATH_PREFIX ? APP_PATH_PREFIX + '/api' : '/api';
let token = localStorage.getItem('bh_operator_token') || localStorage.getItem('bh_token');
let opUser = JSON.parse(localStorage.getItem('bh_operator_user') || localStorage.getItem('bh_user') || 'null');
let opId = null;

async function api(method, url, body) {
  const h = {'Content-Type':'application/json'};
  if (token) h['Authorization'] = 'Bearer ' + token;
  const o = {method, headers: h};
  if (body) o.body = JSON.stringify(body);
  try {
    const r = await fetch(API + url, o);
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch(e) { return {success:false, message:'Server error', raw: t}; }
    if (r.status === 401) {
      token = null; opUser = null;
      localStorage.removeItem('bh_operator_token');
      localStorage.removeItem('bh_operator_user');
      document.getElementById('loginWrap')?.classList.remove('hidden');
      toast('หมดอายุ กรุณาเข้าสู่ระบบใหม่', 'err');
    }
    return j;
  } catch(e) { return {success:false, message:'Connection error: ' + (e.message || 'Network failed')}; }
}

function toast(m, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = m; t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}

function fmt(n) { return '฿' + Number(n||0).toLocaleString(); }

// Auth
async function doOpLogin() {
  const email = document.getElementById('lEmail').value.trim();
  const pw = document.getElementById('lPass').value;
  const errEl = document.getElementById('lErr');
  const btn = document.querySelector('.login-box .btn');
  if (!email || !pw) {
    errEl.textContent = 'กรุณากรอกอีเมลและรหัสผ่าน';
    return;
  }
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';
  try {
    const r = await api('POST', '/auth/login', {email, password: pw});
    if (r.success && r.data && r.data.token) {
      if (r.data.user.role !== 'operator' && r.data.user.role !== 'admin') {
        errEl.textContent = 'ไม่มีสิทธิ์เข้าถึง (ต้องเป็น operator)';
        btn.disabled = false;
        btn.textContent = 'เข้าสู่ระบบ';
        return;
      }
      token = r.data.token;
      opUser = r.data.user;
      localStorage.setItem('bh_operator_token', token);
      localStorage.setItem('bh_operator_user', JSON.stringify(opUser));
      localStorage.setItem('bh_token', token);
      localStorage.setItem('bh_user', JSON.stringify(opUser));
      if (r.data.user.role === 'admin') { localStorage.setItem('boatly_admin_token', token); localStorage.removeItem('boathub_admin_token'); }
      document.getElementById('loginWrap').classList.add('hidden');
      initDashboard();
    } else {
      errEl.textContent = r.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'เข้าสู่ระบบ';
  }
}

function doLogout() {
  token = null; opUser = null; opId = null;
  localStorage.removeItem('bh_operator_token');
  localStorage.removeItem('bh_operator_user');
  document.getElementById('loginWrap').classList.remove('hidden');
}

// Nav
function nav(el) {
  document.querySelectorAll('.sb-nav a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  const pg = el.dataset.page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('pg-' + pg).classList.add('active');
  document.getElementById('pageTitle').textContent = el.textContent.trim();
  document.getElementById('sidebar').classList.remove('open');
  if (pg === 'boats') loadBoats();
  if (pg === 'bookings') loadAllBookings();
  if (pg === 'addons') loadAddons();
  if (pg === 'revenue') loadRevenue();
  if (pg === 'reviews') loadReviews();
  if (pg === 'tips') {
    loadTips();
    fetch(API + '/operator-data.php?action=mark-tips-read&token=' + encodeURIComponent(token)).catch(() => {});
    loadDashboardData();
  }
  if (pg === 'notifications') loadNotifications();
  if (pg === 'documents') loadDocuments();
}

// Dashboard data - direct PHP/DB queries via a simple inline API
let opDashboardPollTimer = null;
async function initDashboard() {
  document.getElementById('opName').textContent = opUser ? opUser.name : '';
  // Load operator_id from operators table
  const meR = await api('GET', '/auth/me');
  if (!meR.success) { doLogout(); return; }

  // Load stats using a custom fetch to a PHP endpoint
  loadDashboardData();

  if (opDashboardPollTimer) clearInterval(opDashboardPollTimer);
  opDashboardPollTimer = setInterval(async () => {
    try {
      const r = await fetch(API + '/operator-data.php?action=unacknowledged-count&token=' + encodeURIComponent(token));
      const j = await r.json();
      const ua = j.unacknowledged_bookings || 0;
      const opBadge = document.getElementById('opBookingNewBadgeFull');
      if (opBadge) opBadge.style.display = ua > 0 ? 'block' : 'none';
      const opAckBar = document.getElementById('opBookingsAckBarFull');
      if (opAckBar) opAckBar.style.display = ua > 0 ? 'flex' : 'none';
      const tipsBadge = document.getElementById('opTipsBadge');
      if (tipsBadge) tipsBadge.style.display = (j.tips_unread_count || 0) > 0 ? 'block' : 'none';
    } catch (e) {}
  }, 25000);

  // Hash navigation - e.g. /operator#reviews เปิดหน้าโดยตรงจากลิงก์
  const hash = (window.location.hash || '').replace(/^#/, '');
  const validPages = ['dashboard','boats','bookings','addons','revenue','reviews','tips','notifications','documents'];
  if (hash && validPages.includes(hash)) {
    const el = document.querySelector('[data-page="' + hash + '"]');
    if (el) nav(el);
  }
}

async function loadDashboardData() {
  const r = await fetch(API + '/operator-data.php?action=dashboard&token=' + encodeURIComponent(token));
  let data;
  try { data = await r.json(); } catch(e) { data = {boats:0,bookings:0,revenue:0,rating:0,recent:[]}; }
  if (data && data.error) {
    const msg = data.message || (data.error === 'Operator not found' ? 'บัญชีพาร์ทเนอร์ยังไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ' : data.error);
    toast(msg, 'err');
    doLogout();
    return;
  }

  document.getElementById('stBoats').textContent = data.boats || 0;
  document.getElementById('stBookings').textContent = data.bookings || 0;
  document.getElementById('stRevenue').textContent = fmt(data.revenue || 0);
  document.getElementById('stRating').textContent = Number(data.rating || 0).toFixed(1);
  const tipsEl = document.getElementById('stTips');
  if (tipsEl) tipsEl.textContent = fmt(data.tips_total || 0);
  const tipsTodayEl = document.getElementById('stTipsToday');
  if (tipsTodayEl) tipsTodayEl.textContent = (data.tips_today > 0) ? ('฿' + Number(data.tips_today).toLocaleString() + ' วันนี้') : '';
  const tipsBadge = document.getElementById('opTipsBadge');
  if (tipsBadge) tipsBadge.style.display = (data.tips_unread_count > 0) ? 'block' : 'none';
  const nb = document.getElementById('notifBadge');
  if (nb) {
    const u = data.unread_notifications || 0;
    nb.style.display = u > 0 ? 'flex' : 'none';
    nb.textContent = u > 99 ? '99+' : u;
  }
  const ua = data.unacknowledged_bookings || 0;
  const opBadge = document.getElementById('opBookingNewBadgeFull');
  if (opBadge) opBadge.style.display = ua > 0 ? 'block' : 'none';
  const opAckBar = document.getElementById('opBookingsAckBarFull');
  if (opAckBar) { opAckBar.style.display = ua > 0 ? 'flex' : 'none'; }

  recentBookingsData = data.recent || [];
  const rb = document.getElementById('recentBookings');
  if (data.recent && data.recent.length > 0) {
    rb.innerHTML = data.recent.map(b => `<tr>
      <td style="vertical-align:top;min-width:80px"><button type="button" onclick="toggleBookingPin(${b.id},${b.is_pinned?0:1},this)" title="${b.is_pinned?'ยกเลิกปักหมุด':'ปักหมุด'}" style="border:none;background:none;cursor:pointer;padding:4px;color:${b.is_pinned?'#f59e0b':'#94a3b8'}"><i class="fas fa-thumbtack"></i></button>${(b.partner_note||'').trim()?` <i class="fas fa-sticky-note" style="color:#64748b;font-size:11px"></i><div style="font-size:11px;color:#78716c;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px" title="${escAttr(b.partner_note)}">${esc((b.partner_note||'').substring(0,20))}${(b.partner_note||'').length>20?'...':''}</div>`:''}</td>
      <td><strong><a href="#" onclick="showBookingDetail(${b.id});return false" style="color:inherit;text-decoration:none">${esc(b.booking_ref||'')}</a></strong></td>
      <td>${esc(b.display_name||b.customer_name||'')}</td>
      <td>${esc(b.boat_name||'')}</td>
      <td>${b.booking_date||''}</td>
      <td><span class="badge ${b.status==='confirmed'?'badge-ok':b.status==='pending'?'badge-warn':'badge-info'}">${b.status}</span></td>
      <td>${fmt(b.total_amount)}</td>
    </tr>`).join('');
  } else {
    rb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mu)">ยังไม่มีการจอง</td></tr>';
  }
}

let boatsData = [];
let editingBoatId = null;

async function loadBoats() {
  const r = await api('GET', '/operator/boats');
  let data = r.data || r;
  if (!Array.isArray(data)) data = [];
  boatsData = data;
  const g = document.getElementById('boatGrid');
  if (data.length === 0) { g.innerHTML = '<p style="color:var(--mu)">ยังไม่มีเรือ — กดปุ่มเพิ่มเรือ/ทัวร์</p>'; return; }
  const defaultImg = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=200&fit=crop';
  g.innerHTML = data.map(b => `<div class="boat-item">
    <img src="${b.image || defaultImg}" alt="${esc(b.name)}" onerror="this.src='${defaultImg}'">
    <div class="info">
      <span class="badge badge-info" style="margin-bottom:6px">${esc(b.boat_type_name || b.boat_type)}</span>
      <h4>${esc(b.name)}</h4>
      <div class="meta"><span><i class="fas fa-users"></i> ${b.capacity} คน</span><span><i class="fas fa-clock"></i> ${Math.floor((b.duration||0)/60)} ชม.</span></div>
      <div class="price">${fmt(b.price)}</div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge ${b.status==='active'?'badge-ok':'badge-warn'}">${b.status}</span>
        <button class="btn-sm btn-sec" onclick="editBoat(${b.id})">แก้ไข</button>
        ${b.status==='active'?`<button class="btn-sm" style="background:#fee2e2;color:#991b1b" onclick="deactivateBoat(${b.id},'${escAttr(b.name)}')">ปิดขาย</button>`:`<button class="btn-sm btn-pri" onclick="reactivateBoat(${b.id})">เปิดขายอีกครั้ง</button><button class="btn-sm" style="background:#991b1b;color:#fff" onclick="permanentDeleteBoat(${b.id},'${escAttr(b.name)}')">ลบถาวร</button>`}
      </div>
    </div>
  </div>`).join('');
}

let boatModalAddonsTemp = []; // สำหรับเรือใหม่: addons ที่จะสร้างหลังบันทึกเรือ
let boatModalImagesTemp = []; // สำหรับเรือใหม่: รูปที่เลือกไว้ก่อนบันทึก

async function showBoatModal(boat) {
  const provR = await fetch(API + '/operator-data.php?action=provinces&token=' + encodeURIComponent(token));
  let provinces = []; try { provinces = await provR.json(); } catch(e) {}
  if (!Array.isArray(provinces)) provinces = [];
  const provVal = (p) => (p.name_th || p.id || '').toString();
  const provMatch = (p) => (boat?.province_name_th||boat?.province||'')===provVal(p) || (boat?.province||'')===(p.name_en||'');
  const provOpts = '<option value="">-- เลือกจังหวัด --</option>' + provinces.map(p => `<option value="${esc(provVal(p))}" ${boat && provMatch(p)?'selected':''}>${esc(p.name_th || p.name_en || p.id)}</option>`).join('');

  const typesR = await fetch(API + '/operator-data.php?action=boat-types&token=' + encodeURIComponent(token));
  let boatTypes = []; try { boatTypes = await typesR.json(); } catch(e) {}
  if (!Array.isArray(boatTypes)) boatTypes = [];
  const typeVal = (t) => (t.slug || t.id || '').toString();
  const typeLabel = (t) => esc(t.name_th || t.name_en || typeVal(t));
  const typeOpts = boatTypes.map(t => `<option value="${esc(typeVal(t))}" ${(boat?.boat_type||'')===typeVal(t)?'selected':''}>${typeLabel(t)}</option>`).join('') || '<option value="longtail">Longtail</option>';

  const templatesR = await fetch(API + '/operator-data.php?action=addon-templates&token=' + encodeURIComponent(token));
  let allTemplates = []; try { allTemplates = await templatesR.json(); } catch(e) {}
  if (!Array.isArray(allTemplates)) allTemplates = [];
  let boatAddons = [];
  if (boat && boat.id) {
    const addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(token));
    let allAddons = []; try { allAddons = await addonsR.json(); } catch(e) {}
    boatAddons = (allAddons || []).filter(a => a.boat_id == boat.id);
  }
  if (!boat) { boatModalAddonsTemp = []; boatModalImagesTemp = []; }

  const isEdit = !!boat;
  editingBoatId = boat ? boat.id : null;

  function formatBoatTimeSlots(b) {
    let slots = ['09:00', '13:00', '16:00'];
    if (b && b.default_time_slots) {
      try {
        const parsed = typeof b.default_time_slots === 'string' ? JSON.parse(b.default_time_slots) : b.default_time_slots;
        if (Array.isArray(parsed) && parsed.length > 0) slots = parsed;
      } catch (e) {}
    }
    return slots.map((s) => `<span class="boat-time-slot-badge" data-slot="${escAttr(s)}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;color:#1e40af;border-radius:8px;font-size:13px;font-weight:600">
      <i class="fas fa-clock"></i> ${esc(s)}
      <button type="button" onclick="removeBoatTimeSlot(this)" style="border:none;background:none;color:#64748b;cursor:pointer;padding:0 4px;font-size:12px" title="ลบ"><i class="fas fa-times"></i></button>
    </span>`).join('');
  }

  const addonRows = isEdit
    ? boatAddons.map(a => `<div class="boat-addon-row" data-id="${a.id}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px">
        <input type="checkbox" ${a.is_active?'checked':''} onchange="toggleBoatAddonActive(${a.id},this.checked)" style="width:18px;height:18px;cursor:pointer" title="เปิด/ปิดใช้งาน">
        <span style="flex:1;font-size:13px">${esc(a.name_th||a.name_en||'')}</span>
        <span style="font-weight:600;color:var(--pri-d)">${fmt(a.price)}</span>
        <button type="button" class="btn-sm" style="background:#fee2e2;color:#991b1b;padding:4px 8px" onclick="removeBoatAddonFromModal(${a.id})">ลบ</button>
      </div>`).join('')
    : boatModalAddonsTemp.map((a,i) => `<div class="boat-addon-temp" data-idx="${i}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px">
        <span style="flex:1;font-size:13px">${esc(a.name||'')}</span>
        <span style="font-weight:600;color:var(--pri-d)">${fmt(a.price)}</span>
        <button type="button" class="btn-sm" style="background:#fee2e2;color:#991b1b;padding:4px 8px" onclick="removeBoatAddonTemp(${i})">ลบ</button>
      </div>`).join('');

  const addonSelectFromOther = `<div id="boatAddonSelectSection">${allTemplates.length > 0
    ? `<div style="margin-top:8px;padding:8px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af">
        <strong>เลือกจาก Add-on ที่มีอยู่:</strong>
        <div id="boatAddonSelectList" style="max-height:120px;overflow-y:auto;margin-top:6px">${allTemplates.map(t => `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer">
          <input type="checkbox" data-id="${t.id}" data-name="${escAttr(t.name_th||t.name_en||'')}" data-price="${t.price}" onchange="toggleSelectAddonTemplate(this)">
          <span>${esc(t.name_th||t.name_en||'')} ${fmt(t.price)}</span>
        </label>`).join('')}</div>
      </div>`
    : '<p style="font-size:12px;color:var(--mu);margin-top:8px">ยังไม่มี Add-on — สร้างใหม่ด้านล่างหรือไปที่เมนูเสริมบริการ</p>'}</div>`;

  const boatImages = [];
  if (boat && boat.id) {
    try {
      const imgR = await api('GET', '/operator/boats/' + boat.id + '/images');
      if (imgR.data && Array.isArray(imgR.data)) boatImages.push(...imgR.data);
    } catch(e) {}
  }
  const imgUrl = (url) => (url||'').startsWith('http') ? url : (window.location.origin + (url||''));
  const imgSection = isEdit
    ? `<div class="fg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd)">
    <label style="margin-bottom:8px;display:block">รูปโปรโมท (สูงสุด 8 รูป, JPG/PNG/GIF/WEBP)</label>
    <div id="boatImagesGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px">${boatImages.map((img,i) => `<div class="boat-img-thumb" data-id="${img.id}" style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#f1f5f9">
      <img src="${imgUrl(img.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=color:var(--mu);font-size:11px>โหลดไม่สำเร็จ</span>'">
      ${i===0?'<span style="position:absolute;top:4px;left:4px;background:var(--pri);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px">หลัก</span>':''}
      <button type="button" onclick="removeBoatImage(${img.id})" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;background:rgba(0,0,0,.6);color:#fff;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-times"></i></button>
      ${i!==0?`<button type="button" onclick="setBoatImagePrimary(${img.id})" style="position:absolute;bottom:4px;left:4px;font-size:10px;padding:2px 6px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:4px;cursor:pointer">ตั้งเป็นหลัก</button>`:''}
    </div>`).join('')}</div>
    ${boatImages.length < 8 ? `<input type="file" id="boatImageInput" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" onchange="uploadBoatImages(this.files)">
    <button type="button" class="btn-sm btn-sec" onclick="document.getElementById('boatImageInput').click()" style="width:100%"><i class="fas fa-camera"></i> อัปโหลดรูป (${boatImages.length}/8)</button>` : '<p style="font-size:12px;color:var(--mu)">ครบ 8 รูปแล้ว</p>'}
  </div>`
    : `<div class="fg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd)">
    <label style="margin-bottom:8px;display:block">รูปโปรโมท (สูงสุด 8 รูป, JPG/PNG/GIF/WEBP)</label>
    <div id="boatImagesGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div>
    <input type="file" id="boatImageInput" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" onchange="addBoatImagesTemp(this.files); this.value=''">
    <button type="button" class="btn-sm btn-sec" id="boatImageAddBtn" onclick="document.getElementById('boatImageInput').click()" style="width:100%"><i class="fas fa-camera"></i> เพิ่มรูป (0/8)</button>
  </div>`;

  const addonSection = `<div class="fg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd)">
    <label style="margin-bottom:8px;display:block">Add-on ที่มีสำหรับเรือนี้</label>
    <div id="boatAddonsList" style="max-height:160px;overflow-y:auto;margin-bottom:8px">${addonRows || '<p style="color:var(--mu);font-size:12px">ยังไม่มี Add-on — เลือกจากรายการด้านล่างหรือสร้างใหม่ในเมนูเสริมบริการ</p>'}</div>
    ${addonSelectFromOther}
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <button type="button" class="btn-sm btn-sec" onclick="showAddonModalForBoat()" style="flex:1"><i class="fas fa-plus"></i> สร้าง Add-on (รายการหลัก)</button>
      <button type="button" class="btn-sm btn-sec" onclick="addBoatAddonInline(${isEdit})" style="flex:1"><i class="fas fa-bolt"></i> สร้างแบบเร็ว</button>
    </div>
  </div>`;

  const d = document.createElement('div');
  d.id = 'boatModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto';
  d.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:480px;width:100%;margin:auto">
    <h3 style="margin-bottom:16px">${isEdit?'แก้ไข':'เพิ่ม'} เรือ/ทัวร์</h3>
    <div class="fg"><label>ชื่อเรือ/ทัวร์ *</label><input type="text" id="boatName" value="${esc(boat?.name||'')}" placeholder="เช่น ล่องเรือชมพระอาทิตย์ตก" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>พื้นที่ให้บริการ *</label><select id="boatProvince" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px">${provOpts}</select></div>
    <div class="fg"><label>ประเภทเรือ</label><select id="boatType" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px">${typeOpts}</select></div>
    <div class="fg"><label>ความจุ (คน)</label><input type="number" id="boatCap" value="${boat?.capacity||20}" min="1" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>ระยะเวลา</label><div style="display:flex;gap:12px;align-items:center">
      <div style="flex:1"><label style="font-size:11px;color:var(--mu);display:block;margin-bottom:4px">ชั่วโมง</label><input type="number" id="boatDurH" value="${Math.floor((boat?.duration||120)/60)}" min="0" max="24" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
      <div style="flex:1"><label style="font-size:11px;color:var(--mu);display:block;margin-bottom:4px">นาที</label><input type="number" id="boatDurM" value="${(boat?.duration||120)%60}" min="0" max="59" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    </div></div>
    <div class="fg"><label>ราคา (฿) *</label><input type="number" id="boatPrice" value="${boat?.price||0}" min="0" step="0.01" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg" style="padding-top:12px;border-top:1px solid var(--bd)">
      <label style="margin-bottom:8px;display:block">รอบเวลาการให้บริการ</label>
      <p style="font-size:11px;color:var(--mu);margin-bottom:8px">กำหนดเวลาที่ลูกค้าสามารถจองได้ (เช่น 09:00, 13:00, 16:00)</p>
      <div id="boatTimeSlotsList" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">${formatBoatTimeSlots(boat)}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="time" id="boatTimeSlotInput" style="height:40px;border:2px solid var(--bd);border-radius:8px;padding:0 10px;font-size:14px">
        <button type="button" class="btn-sm btn-sec" onclick="addBoatTimeSlot()"><i class="fas fa-plus"></i> เพิ่มรอบ</button>
      </div>
    </div>
    <div class="fg"><label>รายละเอียด</label><textarea id="boatDesc" rows="2" style="width:100%;border:2px solid var(--bd);border-radius:10px;padding:10px 14px">${esc(boat?.description||'')}</textarea></div>
    ${imgSection}
    ${addonSection}
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn-sm btn-pri" onclick="saveBoat()" style="flex:1">บันทึก</button>
      <button class="btn-sm btn-sec" onclick="closeBoatModal()">ยกเลิก</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  if (!isEdit) renderBoatImagesTemp();
}

async function addBoatAddonInline(isEdit) {
  const name = prompt('ชื่อ Add-on (เช่น อาหารว่าง, น้ำดื่ม):');
  if (!name || !name.trim()) return;
  const priceStr = prompt('ราคา (฿):', '0');
  const price = parseFloat(priceStr) || 0;
  const r = await api('POST', '/operator/addon-templates', { name_th: name.trim(), name_en: name.trim(), price });
  if (!r || r.success === false) { toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err'); return; }
  const tid = r.data && r.data.id ? r.data.id : r.id;
  if (isEdit && editingBoatId && tid) {
    const r2 = await api('POST', '/operator/boats/' + editingBoatId + '/addons', { addon_template_id: tid });
    if (r2 && r2.success !== false) { toast('สร้างและเพิ่ม Add-on แล้ว'); refreshBoatModalAddons(); }
    else toast((r2 && r2.message) || 'เกิดข้อผิดพลาด', 'err');
  } else if (tid) {
    boatModalAddonsTemp.push({ template_id: tid, name: name.trim(), price });
    refreshBoatModalAddonOptions();
    toast('สร้าง Add-on แล้ว');
  }
}

async function refreshBoatModalAddons() {
  if (!editingBoatId) return;
  const addonsR = await fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(token));
  const allAddons = addonsR.ok ? await addonsR.json() : [];
  const list = (allAddons || []).filter(a => a.boat_id == editingBoatId);
  const c = document.getElementById('boatAddonsList');
  if (c) {
    c.innerHTML = list.length === 0 ? '<p style="color:var(--mu);font-size:12px">ยังไม่มี Add-on — เลือกจากรายการด้านล่าง</p>' : list.map(a => `<div class="boat-addon-row" data-id="${a.id}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px">
      <input type="checkbox" ${a.is_active?'checked':''} onchange="toggleBoatAddonActive(${a.id},this.checked)" style="width:18px;height:18px;cursor:pointer" title="เปิด/ปิดใช้งาน">
      <span style="flex:1;font-size:13px">${esc(a.name_th||a.name_en||'')}</span>
      <span style="font-weight:600;color:var(--pri-d)">${fmt(a.price)}</span>
      <button type="button" class="btn-sm" style="background:#fee2e2;color:#991b1b;padding:4px 8px" onclick="removeBoatAddonFromModal(${a.id})">ลบ</button>
    </div>`).join('');
  }
  const selList = document.getElementById('boatAddonSelectList');
  if (selList) selList.querySelectorAll('input[type=checkbox]').forEach(cb => {
    const tid = parseInt(cb.dataset.id, 10);
    cb.checked = list.some(a => a.addon_template_id == tid) || boatModalAddonsTemp.some(a => a.template_id == tid);
  });
}

function refreshBoatModalAddonsTemp() {
  const list = document.getElementById('boatAddonsList');
  if (list) {
    list.innerHTML = boatModalAddonsTemp.map((a,i) => `<div class="boat-addon-temp" data-idx="${i}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px">
      <span style="flex:1;font-size:13px">${esc(a.name||'')}</span>
      <span style="font-weight:600;color:var(--pri-d)">${fmt(a.price)}</span>
      <button type="button" class="btn-sm" style="background:#fee2e2;color:#991b1b;padding:4px 8px" onclick="removeBoatAddonTemp(${i})">ลบ</button>
    </div>`).join('') || '<p style="color:var(--mu);font-size:12px">ยังไม่มี Add-on — เลือกจากรายการด้านล่าง</p>';
  }
  const selList = document.getElementById('boatAddonSelectList');
  if (selList) selList.querySelectorAll('input[type=checkbox]').forEach(cb => {
    const tid = parseInt(cb.dataset.id, 10);
    cb.checked = boatModalAddonsTemp.some(a => a.template_id == tid);
  });
}

function removeBoatAddonTemp(idx) {
  boatModalAddonsTemp.splice(idx, 1);
  refreshBoatModalAddonsTemp();
}

function toggleSelectAddonTemplate(el) {
  const id = parseInt(el.dataset.id, 10);
  const name = el.dataset.name || '';
  const price = parseFloat(el.dataset.price) || 0;
  if (el.checked) {
    if (editingBoatId) {
      api('POST', '/operator/boats/' + editingBoatId + '/addons', { addon_template_id: id }).then(r => {
        if (r && r.success !== false) { toast('เพิ่ม Add-on แล้ว'); refreshBoatModalAddons(); }
        else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
      });
    } else {
      boatModalAddonsTemp.push({ template_id: id, name, price });
    }
  } else {
    if (editingBoatId) {
      const addonsR = fetch(API + '/operator-data.php?action=addons&token=' + encodeURIComponent(token)).then(r => r.json());
      addonsR.then(allAddons => {
        const a = (allAddons || []).find(x => x.boat_id == editingBoatId && x.addon_template_id == id);
        if (a) api('DELETE', '/addons/' + a.id).then(r => { if (r && r.success !== false) { toast('ลบ Add-on แล้ว'); refreshBoatModalAddons(); } });
      });
    } else {
      const idx = boatModalAddonsTemp.findIndex(a => a.template_id == id);
      if (idx >= 0) boatModalAddonsTemp.splice(idx, 1);
    }
  }
  if (!editingBoatId) refreshBoatModalAddonsTemp();
}

async function showAddonModalForBoat() {
  showAddonModal();
}

async function toggleBoatAddonActive(id, checked) {
  const r = await api('PUT', '/addons/' + id, { is_active: checked ? 1 : 0 });
  if (r.success) toast(checked ? 'เปิดใช้งาน Add-on' : 'ปิดใช้งาน Add-on');
  else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
}

async function removeBoatAddonFromModal(id) {
  if (!confirm('ลบ Add-on นี้?')) return;
  const r = await api('DELETE', '/addons/' + id);
  if (r.success) { toast('ลบแล้ว'); refreshBoatModalAddons(); }
  else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
}

async function uploadBoatImages(files) {
  if (!editingBoatId || !files || !files.length) return;
  for (let i = 0; i < files.length; i++) {
    const fd = new FormData();
    fd.append('image', files[i]);
    const r = await fetch(API + '/operator/boats/' + editingBoatId + '/images', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: fd
    });
    const res = await r.json();
    if (!res.success) { toast(res.message || 'อัปโหลดไม่สำเร็จ', 'err'); break; }
  }
  toast('อัปโหลดรูปสำเร็จ');
  refreshBoatModalImages();
}

async function removeBoatImage(id) {
  if (!confirm('ลบรูปนี้?')) return;
  const r = await api('DELETE', '/operator/boats/' + editingBoatId + '/images/' + id);
  if (r.success) { toast('ลบรูปแล้ว'); refreshBoatModalImages(); }
  else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
}

async function setBoatImagePrimary(id) {
  const r = await api('PUT', '/operator/boats/' + editingBoatId + '/images/' + id, { is_primary: true });
  if (r.success) { toast('ตั้งเป็นรูปหลักแล้ว'); refreshBoatModalImages(); }
  else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
}

async function refreshBoatModalImages() {
  if (!editingBoatId) return;
  try {
    const imgR = await api('GET', '/operator/boats/' + editingBoatId + '/images');
    const boatImages = Array.isArray(imgR?.data) ? imgR.data : (Array.isArray(imgR) ? imgR : []);
    const c = document.getElementById('boatImagesGrid');
    if (!c) return;
    const imgUrl = (url) => (url||'').startsWith('http') ? url : (window.location.origin + (url||''));
    c.innerHTML = boatImages.map((img,i) => `<div class="boat-img-thumb" data-id="${img.id}" style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#f1f5f9">
      <img src="${imgUrl(img.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=color:var(--mu);font-size:11px>โหลดไม่สำเร็จ</span>'">
      ${i===0?'<span style="position:absolute;top:4px;left:4px;background:var(--pri);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px">หลัก</span>':''}
      <button type="button" onclick="removeBoatImage(${img.id})" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;background:rgba(0,0,0,.6);color:#fff;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-times"></i></button>
      ${i!==0?`<button type="button" onclick="setBoatImagePrimary(${img.id})" style="position:absolute;bottom:4px;left:4px;font-size:10px;padding:2px 6px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:4px;cursor:pointer">ตั้งเป็นหลัก</button>`:''}
    </div>`).join('');
    const fg = c.closest('.fg');
    const after = c.nextElementSibling;
    const next = after?.nextElementSibling;
    const addArea = after && next ? [after, next] : (after ? [after] : []);
    const addHtml = boatImages.length < 8
      ? `<input type="file" id="boatImageInput" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" onchange="uploadBoatImages(this.files)">
        <button type="button" class="btn-sm btn-sec" onclick="document.getElementById('boatImageInput').click()" style="width:100%"><i class="fas fa-camera"></i> อัปโหลดรูป (${boatImages.length}/8)</button>`
      : '<p style="font-size:12px;color:var(--mu)">ครบ 8 รูปแล้ว</p>';
    addArea.forEach(el => el.remove());
    c.insertAdjacentHTML('afterend', addHtml);
  } catch (e) {}
}

function closeBoatModal() {
  const m = document.getElementById('boatModal');
  if (m) m.remove();
  editingBoatId = null;
  boatModalAddonsTemp = [];
  boatModalImagesTemp.forEach(item => { if (item && item.url) URL.revokeObjectURL(item.url); });
  boatModalImagesTemp = [];
}

function addBoatImagesTemp(files) {
  if (!files || !files.length) return;
  for (let i = 0; i < files.length; i++) {
    if (boatModalImagesTemp.length >= 8) break;
    boatModalImagesTemp.push({ file: files[i], url: URL.createObjectURL(files[i]) });
  }
  renderBoatImagesTemp();
}

function removeBoatImageTemp(idx) {
  if (boatModalImagesTemp[idx] && boatModalImagesTemp[idx].url) URL.revokeObjectURL(boatModalImagesTemp[idx].url);
  boatModalImagesTemp.splice(idx, 1);
  renderBoatImagesTemp();
}

function renderBoatImagesTemp() {
  const c = document.getElementById('boatImagesGrid');
  const addBtn = document.getElementById('boatImageAddBtn');
  if (!c) return;
  c.innerHTML = boatModalImagesTemp.map((item, i) => `<div style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#f1f5f9">
    <img src="${item.url}" alt="" style="width:100%;height:100%;object-fit:cover">
    <button type="button" onclick="removeBoatImageTemp(${i})" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;background:rgba(239,68,68,.9);color:#fff;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-times"></i></button>
  </div>`).join('');
  if (addBtn) { addBtn.innerHTML = `<i class="fas fa-camera"></i> เพิ่มรูป (${boatModalImagesTemp.length}/8)`; addBtn.style.display = boatModalImagesTemp.length >= 8 ? 'none' : ''; }
}

function getBoatTimeSlots() {
  const list = document.getElementById('boatTimeSlotsList');
  if (!list) return [];
  return Array.from(list.querySelectorAll('.boat-time-slot-badge')).map(el => el.dataset.slot || '').filter(Boolean);
}

function addBoatTimeSlot() {
  const inp = document.getElementById('boatTimeSlotInput');
  const list = document.getElementById('boatTimeSlotsList');
  if (!inp || !list) return;
  let val = inp.value;
  if (!val) { toast('กรุณาเลือกเวลา', 'err'); return; }
  if (val.length === 5) val = val; else if (val.length === 8) val = val.substring(0, 5);
  if (list.querySelector(`[data-slot="${val}"]`)) { toast('มีรอบนี้แล้ว', 'err'); return; }
  const span = document.createElement('span');
  span.className = 'boat-time-slot-badge';
  span.dataset.slot = val;
  span.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:#eff6ff;color:#1e40af;border-radius:8px;font-size:13px;font-weight:600';
  span.innerHTML = `<i class="fas fa-clock"></i> ${esc(val)} <button type="button" onclick="removeBoatTimeSlot(this)" style="border:none;background:none;color:#64748b;cursor:pointer;padding:0 4px;font-size:12px" title="ลบ"><i class="fas fa-times"></i></button>`;
  list.appendChild(span);
  inp.value = '';
}

function removeBoatTimeSlot(btn) {
  const badge = btn && btn.closest ? btn.closest('.boat-time-slot-badge') : null;
  if (badge) badge.remove();
}

let saveBoatInProgress = false;
async function saveBoat() {
  if (saveBoatInProgress) return;
  const name = document.getElementById('boatName')?.value?.trim();
  const province = document.getElementById('boatProvince')?.value?.trim();
  const price = parseFloat(document.getElementById('boatPrice')?.value) || 0;
  if (!name) { toast('กรุณากรอกชื่อเรือ/ทัวร์', 'err'); return; }
  if (!province) { toast('กรุณาเลือกพื้นที่ให้บริการ (จังหวัด)', 'err'); return; }
  if (price <= 0) { toast('กรุณากรอกราคา', 'err'); return; }
  const timeSlots = getBoatTimeSlots();
  const body = {
    name, province, boat_type: document.getElementById('boatType')?.value || 'longtail',
    capacity: parseInt(document.getElementById('boatCap')?.value, 10) || 20,
    duration: (parseInt(document.getElementById('boatDurH')?.value, 10) || 0) * 60 + (parseInt(document.getElementById('boatDurM')?.value, 10) || 0) || 120,
    price, description: document.getElementById('boatDesc')?.value || '',
    default_time_slots: timeSlots.length > 0 ? timeSlots.sort() : ['09:00', '13:00', '16:00']
  };
  const isEdit = !!editingBoatId;
  if (isEdit) {
    saveBoatInProgress = true;
    const r = await api('PUT', '/operator/boats/' + editingBoatId, body);
    saveBoatInProgress = false;
    if (r && r.success !== false) { toast('อัปเดตแล้ว'); closeBoatModal(); loadBoats(); loadDashboardData(); }
    else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
  } else {
    saveBoatInProgress = true;
    const r = await api('POST', '/operator/boats', body);
    saveBoatInProgress = false;
    if (r && r.success !== false) {
      const newBoatId = r.data?.id;
      const hadAddons = newBoatId && boatModalAddonsTemp.length > 0;
      if (hadAddons) {
        for (const a of boatModalAddonsTemp) {
          if (a.template_id) await api('POST', '/operator/boats/' + newBoatId + '/addons', { addon_template_id: a.template_id });
        }
        boatModalAddonsTemp = [];
      }
      const hadImages = newBoatId && boatModalImagesTemp.length > 0;
      if (hadImages) {
        for (const item of boatModalImagesTemp) {
          if (item && item.file) {
            const fd = new FormData();
            fd.append('image', item.file);
            try {
              const imgR = await fetch(API + '/operator/boats/' + newBoatId + '/images', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: fd
              });
              const imgJ = await imgR.json();
              if (imgJ.success === false) toast(imgJ.message || 'อัปโหลดรูปไม่สำเร็จ', 'err');
            } catch (e) { toast('อัปโหลดรูปไม่สำเร็จ', 'err'); }
            if (item.url) URL.revokeObjectURL(item.url);
          }
        }
        boatModalImagesTemp = [];
      }
      toast('เพิ่มเรือ/ทัวร์สำเร็จ' + (hadAddons ? ' พร้อม Add-on' : '') + (hadImages ? ' พร้อมรูปภาพ' : ''));
      loadBoats();
      loadDashboardData();
      if (hadAddons) loadAddons();
      const newBoat = { id: newBoatId, name, province, boat_type: body.boat_type, capacity: body.capacity, duration: body.duration, price: body.price, description: body.description };
      closeBoatModal();
      if (!hadImages) setTimeout(() => showBoatModal(newBoat), 300);
    } else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
  }
}

function editBoat(id) {
  const b = boatsData.find(x => x.id == id);
  if (b) showBoatModal(b);
}

async function deactivateBoat(id, name) {
  if (!confirm('ปิดการขาย "' + name + '"?')) return;
  const r = await api('DELETE', '/operator/boats/' + id);
  if (r && r.success !== false) { if (editingBoatId == id) closeBoatModal(); toast('ปิดการขายแล้ว'); loadBoats(); loadDashboardData(); }
  else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
}

async function reactivateBoat(id) {
  const r = await api('PUT', '/operator/boats/' + id, { status: 'active' });
  if (r && r.success !== false) { toast('เปิดขายอีกครั้งแล้ว'); loadBoats(); loadDashboardData(); }
  else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
}

async function permanentDeleteBoat(id, name) {
  if (!confirm('ลบเรือ "' + name + '" ถาวร? ไม่สามารถกู้คืนได้')) return;
  const r = await api('DELETE', '/operator/boats/' + id + '?permanent=1');
  if (r && r.success !== false) { if (editingBoatId == id) closeBoatModal(); toast('ลบเรือถาวรแล้ว'); loadBoats(); loadDashboardData(); }
  else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
}

let allBookingsData = [];
async function loadAllBookings() {
  const r = await fetch(API + '/operator-data.php?action=bookings&token=' + encodeURIComponent(token));
  let data; try { data = await r.json(); } catch(e) { data = []; }
  allBookingsData = Array.isArray(data) ? data : [];
  const tb = document.getElementById('allBookings');
  if (allBookingsData.length === 0) { tb.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--mu)">ไม่มีรายการ</td></tr>'; return; }
  tb.innerHTML = allBookingsData.map(b => `<tr>
    <td style="vertical-align:top;min-width:80px"><button type="button" onclick="toggleBookingPin(${b.id},${b.is_pinned?0:1},this)" title="${b.is_pinned?'ยกเลิกปักหมุด':'ปักหมุด'}" style="border:none;background:none;cursor:pointer;padding:4px;color:${b.is_pinned?'#f59e0b':'#94a3b8'}"><i class="fas fa-thumbtack"></i></button>${(b.partner_note||'').trim()?` <i class="fas fa-sticky-note" style="color:#64748b;font-size:11px" title="${escAttr((b.partner_note||'').substring(0,100) + ((b.partner_note||'').length>100?'...':''))}"></i>`:''}${(b.partner_note||'').trim()?`<div style="font-size:11px;color:#78716c;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px" title="${escAttr(b.partner_note)}">${esc((b.partner_note||'').substring(0,25))}${(b.partner_note||'').length>25?'...':''}</div>`:''}</td>
    <td><strong>${esc(b.booking_ref||'')}</strong></td>
    <td>${esc(b.display_name||b.customer_name||'')}</td>
    <td>${esc(b.boat_name||'')}</td>
    <td>${b.booking_date||''}</td>
    <td>${b.time_slot||''}</td>
    <td>${b.passengers||0}</td>
    <td>${fmt(b.total_amount)}</td>
    <td><span class="badge ${b.status==='confirmed'||b.status==='pending'?'badge-warn':b.status==='completed'?'badge-ok':b.status==='rescheduled'?'badge-err':'badge-err'}">${(function(){const m={pending:'รอดำเนินการ',confirmed:'รอดำเนินการ',completed:'งานสำเร็จ',rescheduled:'เลื่อนกำหนด',cancelled:'ยกเลิก'};return m[b.status]||b.status;})()}</span></td>
    <td>${b.status==='pending'?`<button class="btn-sm btn-pri" onclick="confirmBooking(${b.id})">ยืนยัน</button> `:''}<button class="btn-sm btn-sec" onclick="showBookingDetail(${b.id})"><i class="fas fa-eye"></i> ดูรายละเอียด</button></td>
  </tr>`).join('');
}

let recentBookingsData = [];
function showBookingDetail(bookingId) {
  const b = allBookingsData.find(x => x.id == bookingId) || recentBookingsData.find(x => x.id == bookingId);
  if (!b) { toast('ไม่พบข้อมูลการจอง', 'err'); return; }
  const statusLabel = { pending:'รอดำเนินการ', confirmed:'รอดำเนินการ', completed:'งานสำเร็จ', rescheduled:'เลื่อนกำหนด', cancelled:'ยกเลิก' };
  const statusBadge = b.status==='confirmed'||b.status==='pending'?'badge-warn':b.status==='completed'?'badge-ok':b.status==='rescheduled'?'badge-err':'badge-err';
  const d = document.createElement('div');
  d.id = 'bookingDetailModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto';
  d.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:480px;width:100%;margin:auto">
    <h3 style="margin-bottom:16px;display:flex;align-items:center;gap:8px">รายละเอียดการจอง <span class="badge ${statusBadge}">${statusLabel[b.status]||b.status}</span>
      <button type="button" onclick="toggleBookingPinInModal(${b.id},${b.is_pinned?0:1})" title="${b.is_pinned?'ยกเลิกปักหมุด':'ปักหมุด'}" style="border:none;background:none;cursor:pointer;padding:4px;color:${b.is_pinned?'#f59e0b':'#94a3b8'};margin-left:auto"><i class="fas fa-thumbtack"></i></button>
    </h3>
    <div style="display:grid;gap:12px;font-size:14px">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">Ref</span><strong>${esc(b.booking_ref||'-')}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">ลูกค้า</span><span>${esc(b.display_name||b.customer_name||'-')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">อีเมล</span>${(b.customer_email||'').trim()?`<a href="mailto:${escAttr(b.customer_email)}" style="color:var(--pri);text-decoration:none"><i class="fas fa-envelope" style="margin-right:4px"></i>${esc(b.customer_email)}</a>`:'<span>-</span>'}</div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">โทรศัพท์</span>${(b.customer_phone||'').trim()?`<a href="tel:${escAttr(b.customer_phone)}" style="color:var(--pri);text-decoration:none"><i class="fas fa-phone" style="margin-right:4px"></i>${esc(b.customer_phone)}</a>`:'<span>-</span>'}</div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">สถานที่รับ/ส่ง</span><span>${esc((b.pickup_location||'').trim()||b.pier_name_th||b.pier_name||'-')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">เรือ/ทัวร์</span><span>${esc(b.boat_name||'-')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">วันที่</span><span>${b.booking_date||'-'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">เวลา</span><span>${b.time_slot||'-'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">จำนวนคน</span><span>${b.passengers||0} คน</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">ยอดรวม</span><strong style="color:var(--pri-d)">${fmt(b.total_amount)}</strong></div>
      ${(b.pay_status) ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">สถานะชำระเงิน</span><span style="font-weight:600;color:${b.pay_status==='paid'?'#22c55e':'#eab308'}">${b.pay_status==='paid'?'ชำระแล้ว':'รอชำระ'}</span></div>` : ''}
      ${(b.transaction_ref||'').trim() ? `<div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="color:var(--mu)">Ref โอนเงิน</span><code style="font-size:12px;font-weight:600;color:var(--pri);letter-spacing:0.5px">${esc(b.transaction_ref)}</code></div>` : ''}
      ${(b.special_request||'').trim() ? `<div style="margin-top:8px;padding:12px;background:#f8fafc;border-radius:8px"><span style="color:var(--mu);font-size:12px">ข้อความพิเศษ</span><p style="margin-top:4px">${esc(b.special_request)}</p></div>` : ''}
    </div>
    <div class="fg" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd)">
      <label style="display:block;margin-bottom:6px;font-size:13px;color:var(--mu)"><i class="fas fa-sticky-note" style="margin-right:6px"></i>โน็ตส่วนตัว (พาร์ทเนอร์)</label>
      <textarea id="bookingPartnerNote" data-booking-id="${b.id}" rows="3" placeholder="บันทึกเตือนความจำ... (บันทึกอัตโนมัติ)" style="width:100%;border:2px solid var(--bd);border-radius:8px;padding:10px 12px;font-size:13px">${esc(b.partner_note||'')}</textarea>
    </div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bd)"><label style="display:block;margin-bottom:8px;font-size:13px;color:var(--mu)">กำหนดสถานะการทำงาน (กดเลือก)</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-sm" style="background:${(b.status==='confirmed'||b.status==='pending')?'#fef9c3':'#f1f5f9'};color:${(b.status==='confirmed'||b.status==='pending')?'#a16207':'#64748b'};border:2px solid ${(b.status==='confirmed'||b.status==='pending')?'#eab308':'#e2e8f0'}" onclick="setBookingStatus(${b.id},'confirmed')"><i class="fas fa-clock" style="margin-right:4px"></i>รอดำเนินการ</button><button class="btn-sm" style="background:${(b.status==='in_progress')?'#dbeafe':'#f1f5f9'};color:${(b.status==='in_progress')?'#1d4ed8':'#64748b'};border:2px solid ${(b.status==='in_progress')?'#3b82f6':'#e2e8f0'}" onclick="setBookingStatus(${b.id},'in_progress')"><i class="fas fa-ship" style="margin-right:4px"></i>เริ่มทริป</button><button class="btn-sm" style="background:${b.status==='completed'?'#dcfce7':'#f1f5f9'};color:${b.status==='completed'?'#15803d':'#64748b'};border:2px solid ${b.status==='completed'?'#22c55e':'#e2e8f0'}" onclick="setBookingStatus(${b.id},'completed')"><i class="fas fa-flag-checkered" style="margin-right:4px"></i>งานสำเร็จ</button><button class="btn-sm" style="background:${b.status==='rescheduled'?'#fee2e2':'#f1f5f9'};color:${b.status==='rescheduled'?'#b91c1c':'#64748b'};border:2px solid ${b.status==='rescheduled'?'#ef4444':'#e2e8f0'}" onclick="setBookingStatus(${b.id},'rescheduled')"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>เลื่อนกำหนด</button></div></div>
    ${(b.status==='confirmed'||b.status==='in_progress') ? `<div style="margin-top:12px;padding:12px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd"><a href="${APP_PATH_PREFIX}/pages/captain/track.html" target="_blank" style="font-size:13px;color:#0284c7;font-weight:600;text-decoration:none"><i class="fas fa-location-dot" style="margin-right:6px"></i>ส่งตำแหน่งเรือ (Live Tracking)</a><span style="font-size:11px;color:#64748b;display:block;margin-top:4px">เปิดลิงก์บนมือถือคนเรือ ใส่เลขจอง ${b.id} แล้วกดเริ่ม</span></div>` : ''}
    <div style="display:flex;gap:8px;margin-top:20px">
      ${b.status==='pending' ? `<button class="btn-sm btn-pri" onclick="(async function(){await confirmBooking(${b.id});document.getElementById('bookingDetailModal').remove();loadAllBookings();loadDashboardData();})()"><i class="fas fa-check"></i> ยืนยันการจอง</button>` : ''}
      <button class="btn-sm btn-pri" onclick="(async function(){await saveBookingNote(${b.id});var m=document.getElementById('bookingDetailModal');if(m)m.remove();})()"><i class="fas fa-save" style="margin-right:4px"></i>บันทึก</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  const ta = document.getElementById('bookingPartnerNote');
  if (ta) {
    let debounceTimer;
    ta.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => saveBookingNote(b.id, true), 600);
    });
  }
}

async function confirmBooking(id) {
  const r = await fetch(API + '/operator-data.php?action=confirm&id='+id+'&token='+encodeURIComponent(token));
  toast('ยืนยันการจองแล้ว');
  loadAllBookings();
  loadDashboardData();
}

async function setBookingStatus(id, status) {
  const r = await fetch(API + '/operator-data.php?action=booking-status&id='+id+'&status='+encodeURIComponent(status)+'&token='+encodeURIComponent(token));
  const data = await r.json().catch(() => ({}));
  if (data && data.success !== false) {
    const msg = status === 'completed' ? 'งานสำเร็จ' : (status === 'rescheduled' ? 'เลื่อนกำหนด' : (status === 'in_progress' ? 'เริ่มทริปแล้ว' : 'รอดำเนินการ'));
    toast(msg);
    const b = allBookingsData.find(x => x.id == id) || recentBookingsData.find(x => x.id == id);
    if (b) b.status = status;
    document.getElementById('bookingDetailModal')?.remove();
    loadAllBookings();
    loadDashboardData();
  } else toast(data?.message || 'เกิดข้อผิดพลาด', 'err');
}

async function acknowledgeBookingsFull() {
  try {
    const r = await fetch(API + '/operator-data.php?action=acknowledge-bookings&token=' + encodeURIComponent(token));
    const j = await r.json();
    if (j && j.success !== false) {
      toast('ยืนยันรับรู้แล้ว');
      const opBadge = document.getElementById('opBookingNewBadgeFull');
      if (opBadge) opBadge.style.display = 'none';
      const opAckBar = document.getElementById('opBookingsAckBarFull');
      if (opAckBar) opAckBar.style.display = 'none';
      loadDashboardData();
    } else toast(j?.message || 'ไม่สำเร็จ', 'err');
  } catch (e) { toast('ไม่สำเร็จ', 'err'); }
}

async function toggleBookingPin(id, pinned, btnEl) {
  const r = await fetch(API + '/operator-data.php?action=booking-pin&id='+id+'&pinned='+(pinned?1:0)+'&token='+encodeURIComponent(token));
  const data = await r.json().catch(() => ({}));
  if (data.success !== false) {
    toast(pinned ? 'ปักหมุดแล้ว' : 'ยกเลิกปักหมุดแล้ว');
    if (btnEl) { btnEl.style.color = pinned ? '#f59e0b' : '#94a3b8'; btnEl.title = pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'; btnEl.onclick = function(){ toggleBookingPin(id, pinned?0:1, btnEl); }; }
    const b = allBookingsData.find(x => x.id == id); if (b) b.is_pinned = pinned ? 1 : 0;
    loadAllBookings();
    loadDashboardData();
  } else toast(data.message || 'เกิดข้อผิดพลาด', 'err');
}

async function toggleBookingPinInModal(id, pinned) {
  const r = await fetch(API + '/operator-data.php?action=booking-pin&id='+id+'&pinned='+(pinned?1:0)+'&token='+encodeURIComponent(token));
  const data = await r.json().catch(() => ({}));
  if (data.success !== false) {
    toast(pinned ? 'ปักหมุดแล้ว' : 'ยกเลิกปักหมุดแล้ว');
    const b = allBookingsData.find(x => x.id == id); if (b) b.is_pinned = pinned ? 1 : 0;
    const btn = document.querySelector('#bookingDetailModal button[onclick*="toggleBookingPinInModal"]');
    if (btn) { btn.style.color = pinned ? '#f59e0b' : '#94a3b8'; btn.title = pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'; btn.setAttribute('onclick', 'toggleBookingPinInModal('+id+','+(pinned?0:1)+')'); }
    loadAllBookings();
    loadDashboardData();
  } else toast(data.message || 'เกิดข้อผิดพลาด', 'err');
}

async function saveBookingNote(id, silent) {
  const note = (document.getElementById('bookingPartnerNote') || {}).value || '';
  const b = allBookingsData.find(x => x.id == id) || recentBookingsData.find(x => x.id == id);
  const fd = new FormData();
  fd.append('id', id);
  fd.append('note', note);
  if (b && b.booking_ref) fd.append('booking_ref', b.booking_ref);
  const r = await fetch(API + '/operator-data.php?action=booking-note&id='+id+'&token='+encodeURIComponent(token), {
    method: 'POST',
    body: fd
  });
  const data = await r.json().catch(() => ({}));
  if (data && data.success !== false && !data.error) {
    if (!silent) toast('บันทึกโน็ตแล้ว');
    const b = allBookingsData.find(x => x.id == id) || recentBookingsData.find(x => x.id == id);
    if (b) b.partner_note = note.trim();
    const ta = document.getElementById('bookingPartnerNote');
    if (ta) ta.value = note.trim();
    loadAllBookings();
    loadDashboardData();
  } else if (!silent) toast(data?.message || data?.error || 'เกิดข้อผิดพลาด', 'err');
}

let addonTemplatesData = [];
let editingAddonTemplateId = null;

async function loadAddons() {
  const r = await fetch(API + '/operator-data.php?action=addon-templates&token=' + encodeURIComponent(token));
  let data; try { data = await r.json(); } catch(e) { data = []; }
  if (Array.isArray(data) === false) data = [];
  addonTemplatesData = data;
  const tb = document.getElementById('addonsTable');
  if (data.length === 0) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mu)">ยังไม่มีเสริมบริการ — สร้าง Add-on ในรายการก่อน แล้วเลือกใช้กับเรือตอนเพิ่ม/แก้ไขทัวร์</td></tr>'; return; }
  tb.innerHTML = data.map(a => `<tr>
    <td>${esc(a.name_th||a.name_en||'')}</td>
    <td>${fmt(a.price)}</td>
    <td style="font-size:12px;color:var(--mu)">${esc((a.boat_names||'').replace(/,/g, ', ')||'-')}</td>
    <td><span class="badge ${a.is_active?'badge-ok':'badge-warn'}">${a.is_active?'เปิด':'ปิด'}</span></td>
    <td>
      <button class="btn-sm btn-sec" onclick="editAddonTemplate(${a.id})" style="margin-right:4px">แก้ไข</button>
      <button class="btn-sm" style="background:#fee2e2;color:#991b1b" onclick="delAddonTemplate(${a.id},'${escAttr(a.name_th||a.name_en||'')}')">ลบ</button>
    </td>
  </tr>`).join('');
}

function escAttr(s) { return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

async function showAddonModal(addon) {
  const isEdit = !!addon;
  editingAddonTemplateId = addon ? addon.id : null;
  const d = document.createElement('div');
  d.id = 'addonModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  d.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%">
    <h3 style="margin-bottom:16px">${isEdit?'แก้ไข':'เพิ่ม'} Add-on (รายการหลัก)</h3>
    <p style="font-size:12px;color:var(--mu);margin-bottom:12px">สร้างรายการ Add-on ก่อน แล้วเลือกใช้กับเรือตอนเพิ่ม/แก้ไขทัวร์</p>
    <div class="fg"><label>ชื่อ (ไทย) *</label><input type="text" id="addonNameTh" placeholder="เช่น น้ำเปล่า, อาหารสัตว์" value="${esc(addon?.name_th||'')}" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>ชื่อ (EN)</label><input type="text" id="addonNameEn" placeholder="e.g. Drinking water" value="${esc(addon?.name_en||'')}" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>ราคา (฿) *</label><input type="number" id="addonPrice" value="${addon?.price||0}" min="0" step="0.01" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label><input type="checkbox" id="addonActive" ${(addon?.is_active!==0)?'checked':''}> เปิดใช้งาน</label></div>
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn-sm btn-pri" onclick="saveAddonTemplate()" style="flex:1">บันทึก</button>
      <button class="btn-sm btn-sec" onclick="closeAddonModal()">ยกเลิก</button>
    </div>
  </div>`;
  document.body.appendChild(d);
}

function closeAddonModal() {
  const m = document.getElementById('addonModal');
  if (m) m.remove();
  editingAddonTemplateId = null;
}

async function saveAddonTemplate() {
  const nameTh = document.getElementById('addonNameTh').value.trim();
  const nameEn = document.getElementById('addonNameEn').value.trim();
  const price = parseFloat(document.getElementById('addonPrice').value) || 0;
  const isActive = document.getElementById('addonActive').checked ? 1 : 0;
  if (!nameTh) { toast('กรุณากรอกชื่อ (ไทย)', 'err'); return; }
  const name = nameTh || nameEn || '';
  if (!name) { toast('กรุณากรอกชื่อ', 'err'); return; }
  const url = editingAddonTemplateId ? '/operator/addon-templates/' + editingAddonTemplateId : '/operator/addon-templates';
  const method = editingAddonTemplateId ? 'PUT' : 'POST';
  const body = editingAddonTemplateId
    ? { name_th: nameTh, name_en: nameEn, price, is_active: isActive }
    : { name_th: nameTh, name_en: nameEn, price };
  const r = await api(method, url, body);
  if (r && r.success !== false) { toast('บันทึกแล้ว'); closeAddonModal(); loadAddons(); refreshBoatModalAddonOptions(); }
  else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
}

async function refreshBoatModalAddonOptions() {
  const section = document.getElementById('boatAddonSelectSection');
  if (!section || !document.getElementById('boatModal')) return;
  const r = await fetch(API + '/operator-data.php?action=addon-templates&token=' + encodeURIComponent(token));
  let allTemplates = []; try { allTemplates = await r.json(); } catch(e) {}
  if (!Array.isArray(allTemplates)) allTemplates = [];
  addonTemplatesData = allTemplates;
  section.innerHTML = allTemplates.length > 0
    ? `<div style="margin-top:8px;padding:8px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af">
        <strong>เลือกจาก Add-on ที่มีอยู่:</strong>
        <div id="boatAddonSelectList" style="max-height:120px;overflow-y:auto;margin-top:6px">${allTemplates.map(t => `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer">
          <input type="checkbox" data-id="${t.id}" data-name="${escAttr(t.name_th||t.name_en||'')}" data-price="${t.price}" onchange="toggleSelectAddonTemplate(this)">
          <span>${esc(t.name_th||t.name_en||'')} ${fmt(t.price)}</span>
        </label>`).join('')}</div>
      </div>`
    : '<p style="font-size:12px;color:var(--mu);margin-top:8px">ยังไม่มี Add-on — สร้างใหม่ด้านล่างหรือไปที่เมนูเสริมบริการ</p>';
  if (editingBoatId) refreshBoatModalAddons(); else refreshBoatModalAddonsTemp();
}

function editAddonTemplate(id) {
  const a = addonTemplatesData.find(x => x.id == id);
  if (a) showAddonModal(a);
}

async function delAddonTemplate(id, name) {
  if (!confirm('ลบ "' + name + '"? จะถูกลบออกจากเรือทั้งหมดที่ใช้ Add-on นี้')) return;
  const r = await api('DELETE', '/operator/addon-templates/' + id);
  if (r && r.success !== false) { toast('ลบแล้ว'); loadAddons(); }
  else toast((r && r.message) || 'เกิดข้อผิดพลาด', 'err');
}

let reviewsData = [];
async function loadReviews() {
  const r = await fetch(API + '/operator-data.php?action=reviews&token=' + encodeURIComponent(token));
  let data; try { data = await r.json(); } catch(e) { data = []; }
  reviewsData = Array.isArray(data) ? data : [];
  const tb = document.getElementById('reviewsTable');
  if (!reviewsData.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--mu)">ยังไม่มีรีวิวจากลูกค้า</td></tr>'; return; }
  tb.innerHTML = reviewsData.map(rv => {
    const stars = '★'.repeat(rv.rating||0) + '☆'.repeat(5-(rv.rating||0));
    const commentShort = (rv.comment||'').substring(0,60) + ((rv.comment||'').length>60?'...':'');
    return `<tr>
      <td>${esc(rv.customer_name||'-')}</td>
      <td>${esc(rv.boat_name||'')}</td>
      <td><span style="color:#f59e0b">${stars}</span></td>
      <td>${esc(commentShort)}</td>
      <td>${rv.created_at||''}</td>
      <td><button class="btn-sm btn-sec" onclick="showReviewDetail(${rv.id})"><i class="fas fa-eye"></i> ดูทั้งหมด</button></td>
    </tr>`;
  }).join('');
}

function showReviewDetail(reviewId) {
  const rv = reviewsData.find(x => x.id == reviewId);
  if (!rv) return;
  const stars = '★'.repeat(rv.rating||0) + '☆'.repeat(5-(rv.rating||0));
  const imgUrl = (url) => (url||'').startsWith('http') ? url : (window.location.origin + (url||''));
  const imgsHtml = (rv.images||[]).length > 0
    ? `<div style="margin-top:12px"><label style="font-size:12px;color:var(--mu);display:block;margin-bottom:8px">รูปจากลูกค้า</label><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">${(rv.images||[]).map(u => `<a href="${imgUrl(u)}" target="_blank" rel="noopener" style="display:block;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#f1f5f9"><img src="${imgUrl(u)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=font-size:11px;color:var(--mu);padding:8px'>โหลดไม่สำเร็จ</span>'"></a>`).join('')}</div></div>`
    : '';
  const d = document.createElement('div');
  d.id = 'reviewDetailModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto';
  d.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:520px;width:100%;margin:auto">
    <h3 style="margin-bottom:16px">รายละเอียดรีวิว</h3>
    <div style="display:grid;gap:10px;font-size:14px">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">ลูกค้า</span><span>${esc(rv.customer_name||'-')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">เรือ</span><span>${esc(rv.boat_name||'')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">คะแนน</span><span style="color:#f59e0b">${stars}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--mu)">วันที่</span><span>${rv.created_at||''}</span></div>
      <div style="margin-top:8px;padding:12px;background:#f8fafc;border-radius:8px"><label style="font-size:12px;color:var(--mu);display:block;margin-bottom:6px">ความคิดเห็น</label><p style="white-space:pre-wrap;margin:0;line-height:1.5">${esc(rv.comment||'-')}</p></div>
      ${imgsHtml}
    </div>
    <button class="btn-sm btn-sec" style="margin-top:20px" onclick="document.getElementById('reviewDetailModal').remove()">ปิด</button>
  </div>`;
  document.body.appendChild(d);
}

async function loadTips() {
  const r = await fetch(API + '/operator-data.php?action=tips&token=' + encodeURIComponent(token));
  let data; try { data = await r.json(); } catch(e) { data = []; }
  const tb = document.getElementById('tipsTable');
  const total = data.reduce((s,t) => s + parseFloat(t.amount||0), 0);
  document.getElementById('tipsTotal').textContent = fmt(total);

  const reportRes = await api('GET', '/tip/report');
  if (reportRes.success && reportRes.data) {
    const d = reportRes.data;
    document.getElementById('tipsToday').textContent = fmt(d.today_total || 0);
    document.getElementById('tipsTopBoat').textContent = (d.top_boat && d.top_boat.name) ? esc(d.top_boat.name) : '-';
    const chartEl = document.getElementById('tipsChart');
    const daily = d.daily_chart || [];
    if (daily.length) {
      const maxVal = Math.max(...daily.map(x => x.total), 1);
      chartEl.innerHTML = daily.map(x => {
        const pct = (x.total / maxVal) * 100;
        const label = x.date ? new Date(x.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px" title="${label}: ฿${x.total}">
          <div style="width:100%;height:80px;background:#f1f5f9;border-radius:8px;overflow:hidden;display:flex;align-items:flex-end">
            <div style="width:100%;height:${pct}%;background:linear-gradient(180deg,#a855f7,#7c3aed);border-radius:8px 8px 0 0;transition:height .3s"></div>
          </div>
          <span style="font-size:11px;color:var(--mu)">${label}</span>
        </div>`;
      }).join('');
    } else {
      chartEl.innerHTML = '<p style="text-align:center;color:var(--mu);width:100%">ยังไม่มีข้อมูลทิป 7 วันล่าสุด</p>';
    }
  } else {
    document.getElementById('tipsToday').textContent = '฿0';
    document.getElementById('tipsTopBoat').textContent = '-';
    document.getElementById('tipsChart').innerHTML = '<p style="text-align:center;color:var(--mu);width:100%">โหลดไม่สำเร็จ</p>';
  }

  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--mu)">ยังไม่มีทิปจากลูกค้า</td></tr>';
    loadTipPromptPay();
    return;
  }
  tb.innerHTML = data.map(t => `<tr>
    <td><strong>${esc(t.booking_ref||'')}</strong></td>
    <td>${esc(t.customer_name||'-')}</td>
    <td>${esc(t.boat_name||'')}</td>
    <td>${fmt(t.amount)}</td>
    <td>${esc((t.message||'').substring(0,50))}</td>
    <td>${t.created_at||''}</td>
  </tr>`).join('');
  loadTipPromptPay();
}

async function exportTipsCsv() {
  try {
    const r = await fetch(API + '/operator-data.php?action=tips&limit=500&token=' + encodeURIComponent(token));
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) {
      toast('ไม่มีข้อมูลทิปสำหรับ Export', 'err');
      return;
    }
    const BOM = '\uFEFF';
    const headers = ['Ref', 'ลูกค้า', 'เรือ', 'จำนวน (บาท)', 'ข้อความ', 'วันที่'];
    const escapeCsv = (v) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s + '"' : s;
    };
    const rows = data.map(t => [
      escapeCsv(t.booking_ref),
      escapeCsv(t.customer_name),
      escapeCsv(t.boat_name),
      escapeCsv(t.amount),
      escapeCsv((t.message || '').substring(0, 200)),
      escapeCsv(t.created_at)
    ].join(','));
    const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tips-report-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('ดาวน์โหลด CSV แล้ว');
  } catch (e) {
    toast('Export ไม่สำเร็จ: ' + (e.message || 'Error'), 'err');
  }
}

async function loadTipPromptPay() {
  try {
    const j = await api('GET', '/tip/operator-qr');
    const phone = (j.data && j.data.promptpay_phone) || '';
    const inp = document.getElementById('tipPromptPayInput');
    if (inp) inp.value = phone;
    const st = document.getElementById('tipPromptPayStatus');
    if (st) st.textContent = phone ? 'บันทึกเบอร์ PromptPay สำหรับรับทิปแล้ว' : '';
  } catch (e) {}
}

async function saveTipPromptPay() {
  const inp = document.getElementById('tipPromptPayInput');
  const phone = (inp && inp.value || '').replace(/[^0-9]/g, '');
  if (phone.length < 10) { toast('กรุณาระบุเบอร์ PromptPay 10-13 หลัก', 'err'); return; }
  try {
    const j = await api('PUT', '/tip/operator-qr', { promptpay_phone: phone });
    if (j.success) {
      toast('บันทึกแล้ว');
      const st = document.getElementById('tipPromptPayStatus');
      if (st) st.textContent = 'บันทึกเบอร์ PromptPay สำหรับรับทิปแล้ว';
    } else {
      toast(j.message || 'เกิดข้อผิดพลาด', 'err');
    }
  } catch (e) {
    toast('เกิดข้อผิดพลาด: ' + (e.message || 'Network failed'), 'err');
  }
}

async function loadNotifications() {
  const r = await api('GET', '/operator/notifications');
  let data = r.data || r;
  if (!Array.isArray(data)) data = [];
  const list = document.getElementById('notificationsList');
  if (!data.length) { list.innerHTML = '<p style="text-align:center;color:var(--mu)">ยังไม่มีการแจ้งเตือน</p>'; return; }
  list.innerHTML = data.map(n => `<div style="padding:14px;border-bottom:1px solid var(--bd);display:flex;align-items:flex-start;gap:12px;background:${n.is_read?'transparent':'#f0f9ff'}">
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:8px">
        ${n.is_pinned?'<i class="fas fa-thumbtack" style="color:var(--acc)"></i>':''}
        <strong>${esc(n.title||'')}</strong>
        ${n.status?`<span class="badge badge-info">${esc(n.status)}</span>`:''}
      </div>
      ${n.message?`<p style="font-size:12px;color:var(--mu);margin-top:4px">${esc(n.message)}</p>`:''}
      <div style="font-size:11px;color:var(--mu);margin-top:4px">${n.created_at||''}</div>
    </div>
    <div style="display:flex;gap:4px">
      <button class="btn-sm btn-sec" onclick="toggleNotifPin(${n.id},${n.is_pinned?0:1})" title="${n.is_pinned?'ยกเลิกปักหมุด':'ปักหมุด'}"><i class="fas fa-thumbtack"></i></button>
      <button class="btn-sm btn-sec" onclick="markNotifRead(${n.id},1)"><i class="fas fa-check"></i></button>
    </div>
  </div>`).join('');
}

async function toggleNotifPin(id, pin) {
  await api('PUT', '/operator/notifications/' + id, { is_pinned: pin });
  loadNotifications();
  loadDashboardData();
}

async function markNotifRead(id, read) {
  await api('PUT', '/operator/notifications/' + id, { is_read: read });
  loadNotifications();
  loadDashboardData();
}

let documentsData = [];

async function loadDocuments() {
  const r = await api('GET', '/operator/documents');
  let data = r.data || r;
  if (!Array.isArray(data)) data = [];
  documentsData = data;
  const expR = await fetch(API + '/operator-data.php?action=documents-expiring&token=' + encodeURIComponent(token));
  let expiring; try { expiring = await expR.json(); } catch(e) { expiring = []; }
  const expDiv = document.getElementById('documentsExpiring');
  if (expiring.length === 0) expDiv.innerHTML = '<p style="text-align:center;color:var(--mu)">ไม่มีเอกสารใกล้หมดอายุ</p>';
  else expDiv.innerHTML = expiring.map(d => {
    const days = d.days_to_expiry ?? (d.expiry_date ? Math.ceil((new Date(d.expiry_date) - new Date())/86400000) : 0);
    const warn = days <= 30 ? 'badge-err' : 'badge-warn';
    return `<div style="padding:10px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">
      <span>${esc(d.doc_name||d.doc_type)} ${d.boat_name?'('+d.boat_name+')':''}</span>
      <span class="badge ${warn}">หมดอายุใน ${days} วัน</span>
    </div>`;
  }).join('');

  const tb = document.getElementById('documentsTable');
  if (!data.length) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mu)">ยังไม่มีเอกสาร — กดปุ่มเพิ่มเอกสาร</td></tr>'; return; }
  tb.innerHTML = data.map(d => {
    const days = d.days_to_expiry;
    let expiryBadge = '';
    if (d.expiry_date) {
      if (days !== null && days <= 30) expiryBadge = `<span class="badge badge-err">${days} วัน</span>`;
      else if (days !== null && days <= 60) expiryBadge = `<span class="badge badge-warn">${days} วัน</span>`;
      else expiryBadge = `<span class="badge badge-info">${d.expiry_date}</span>`;
    } else expiryBadge = '-';
    return `<tr>
      <td>${esc(d.doc_type)}</td>
      <td>${esc(d.boat_name||'-')}</td>
      <td>${esc(d.doc_name||'-')}</td>
      <td>${expiryBadge}</td>
      <td><button class="btn-sm btn-sec" onclick="editDocument(${d.id})">แก้ไข</button> <button class="btn-sm" style="background:#fee2e2;color:#991b1b" onclick="delDocument(${d.id})">ลบ</button></td>
    </tr>`;
  }).join('');
}

let editingDocId = null;
async function showDocumentModal(doc) {
  editingDocId = doc ? doc.id : null;
  if (!boatsData.length) {
    const br = await api('GET', '/operator/boats');
    boatsData = br.data || br || [];
  }
  const isEdit = !!doc;
  const boatsOpts = boatsData.length ? boatsData.map(b => `<option value="${b.id}" ${doc?.boat_id==b.id?'selected':''}>${esc(b.name)}</option>`).join('') : '<option value="">ไม่ระบุเรือ</option>';
  const d = document.createElement('div');
  d.id = 'docModal';
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  d.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%">
    <h3 style="margin-bottom:16px">${isEdit?'แก้ไข':'เพิ่ม'} เอกสาร</h3>
    <div class="fg"><label>ประเภทเอกสาร</label><select id="docType" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px">
      <option value="boat_license" ${(doc?.doc_type||'')==='boat_license'?'selected':''}>ใบอนุญาตเรือ</option>
      <option value="insurance" ${(doc?.doc_type||'')==='insurance'?'selected':''}>ประกัน</option>
      <option value="permit" ${(doc?.doc_type||'')==='permit'?'selected':''}>ใบอนุญาต</option>
      <option value="other" ${(doc?.doc_type||'')==='other'?'selected':''}>อื่นๆ</option>
    </select></div>
    <div class="fg"><label>เรือ (ถ้ามี)</label><select id="docBoat" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px">${boatsOpts}</select></div>
    <div class="fg"><label>ชื่อเอกสาร</label><input type="text" id="docName" value="${esc(doc?.doc_name||'')}" placeholder="เช่น ใบอนุญาตเรือ XYZ" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>วันหมดอายุ (สำหรับแจ้งเตือนต่ออายุ)</label><input type="date" id="docExpiry" value="${doc?.expiry_date||''}" style="width:100%;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px"></div>
    <div class="fg"><label>ไฟล์เอกสาร</label><div style="display:flex;gap:8px;align-items:center">
      <input type="text" id="docPath" value="${esc(doc?.file_path||'')}" placeholder="อัปโหลดไฟล์หรือใส่ URL" style="flex:1;height:44px;border:2px solid var(--bd);border-radius:10px;padding:0 14px">
      <input type="file" id="docFileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style="display:none" onchange="uploadDocFile(this)">
      <button type="button" class="btn-sm btn-pri" onclick="document.getElementById('docFileInput').click()"><i class="fas fa-upload"></i> อัปโหลด</button>
    </div></div>
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn-sm btn-pri" onclick="saveDocument()" style="flex:1">บันทึก</button>
      <button class="btn-sm btn-sec" onclick="document.getElementById('docModal').remove()">ยกเลิก</button>
    </div>
  </div>`;
  document.body.appendChild(d);
}

async function uploadDocFile(input) {
  if (!input?.files?.length) return;
  const fd = new FormData();
  fd.append('file', input.files[0]);
  try {
    const r = await fetch(API + '/operator/documents/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: fd
    });
    const res = await r.json();
    if (res.success && res.data?.path) {
      document.getElementById('docPath').value = res.data.path;
      toast('อัปโหลดสำเร็จ');
    } else {
      toast(res.message || 'อัปโหลดไม่สำเร็จ', 'err');
    }
  } catch (e) {
    toast('เกิดข้อผิดพลาด', 'err');
  }
  input.value = '';
}

async function saveDocument() {
  const docType = document.getElementById('docType')?.value || 'other';
  const filePath = document.getElementById('docPath')?.value?.trim();
  const docName = document.getElementById('docName')?.value?.trim();
  const expiryDate = document.getElementById('docExpiry')?.value || null;
  const boatId = parseInt(document.getElementById('docBoat')?.value, 10) || null;
  if (!filePath) { toast('กรุณาระบุ path ไฟล์หรืออัปโหลด', 'err'); return; }
  const body = { doc_type: docType, file_path: filePath, doc_name: docName, expiry_date: expiryDate, boat_id: boatId };
  if (editingDocId) {
    const putBody = { doc_name: docName, expiry_date: expiryDate };
    if (filePath) putBody.file_path = filePath;
    const r = await api('PUT', '/operator/documents/' + editingDocId, putBody);
    if (r.success) { toast('อัปเดตแล้ว'); document.getElementById('docModal').remove(); editingDocId = null; loadDocuments(); }
    else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
  } else {
    const r = await api('POST', '/operator/documents', body);
    if (r.success) { toast('บันทึกเอกสารแล้ว'); document.getElementById('docModal').remove(); loadDocuments(); }
    else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
  }
}

function editDocument(id) {
  const d = documentsData.find(x => x.id == id);
  if (d) showDocumentModal(d);
}

async function delDocument(id) {
  if (!confirm('ลบเอกสารนี้?')) return;
  const r = await api('DELETE', '/operator/documents/' + id);
  if (r.success) { toast('ลบแล้ว'); loadDocuments(); }
  else toast(r.message || 'เกิดข้อผิดพลาด', 'err');
}

async function loadRevenue() {
  const r = await fetch(API + '/operator-data.php?action=revenue&token=' + encodeURIComponent(token));
  let data; try { data = await r.json(); } catch(e) { data = {total:0,month:0,pending:0,items:[]}; }
  document.getElementById('rvTotal').textContent = fmt(data.total);
  document.getElementById('rvMonth').textContent = fmt(data.month);
  document.getElementById('rvPending').textContent = fmt(data.pending);
  const tb = document.getElementById('revTable');
  if (data.items && data.items.length > 0) {
    tb.innerHTML = data.items.map(i => `<tr>
      <td>${esc(i.booking_ref||'')}</td><td>${esc(i.boat_name||'')}</td><td>${i.booking_date||''}</td>
      <td>${fmt(i.total_amount)}</td><td><span class="badge ${i.pay_status==='paid'?'badge-ok':'badge-warn'}">${i.pay_status||'pending'}</span></td>
    </tr>`).join('');
  } else {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mu)">ไม่มีรายการ</td></tr>';
  }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// Init - ถ้ามี token จากแอปหลัก (bh_token) และเป็น operator ให้ sync และข้ามหน้า login
if (token && opUser && (opUser.role === 'operator' || opUser.role === 'admin')) {
  localStorage.setItem('bh_operator_token', token);
  localStorage.setItem('bh_operator_user', JSON.stringify(opUser));
  document.getElementById('loginWrap').classList.add('hidden');
  initDashboard();
}
</script>
</body>
</html>
