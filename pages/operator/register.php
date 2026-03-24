<?php require_once __DIR__ . '/../../includes/base_path.php'; $BASE = app_base_path(); ?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>สมัครเป็นพาร์ทเนอร์ | BOATLY</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
:root{--sb:#0f172a;--pri:#0284c7;--pri-d:#0c4a6e;--ok:#10b981;--err:#ef4444;--bg:#f8fafc;--card:#fff;--tx:#1e293b;--mu:#64748b;--bd:#e2e8f0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans Thai',sans-serif;background:linear-gradient(135deg,#0f172a,#0c4a6e,#0284c7);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.reg-box{background:#fff;border-radius:20px;padding:40px 36px;max-width:440px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.25)}
.reg-box h1{font-size:22px;margin-bottom:4px;text-align:center}
.reg-box .sub{font-size:13px;color:var(--mu);margin-bottom:24px;text-align:center}
.reg-box .fg{margin-bottom:14px}
.reg-box label{font-size:12px;font-weight:600;color:var(--mu);display:block;margin-bottom:4px}
.reg-box input,.reg-box textarea{width:100%;border:2px solid var(--bd);border-radius:10px;padding:0 14px;font-size:14px;font-family:inherit;outline:none}
.reg-box input{height:44px}
.reg-box textarea{min-height:70px;padding:10px 14px;resize:vertical}
.reg-box input:focus,.reg-box textarea:focus{border-color:var(--pri)}
.reg-box .btn{width:100%;height:48px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--pri-d),var(--pri));color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;font-family:inherit}
.reg-box .btn:disabled{opacity:.7;cursor:not-allowed}
.reg-box .err{color:var(--err);font-size:12px;margin-top:8px;min-height:16px}
.reg-box .hint{font-size:12px;color:var(--mu);margin-top:20px;padding-top:16px;border-top:1px solid var(--bd);text-align:center}
.reg-box .hint a{color:var(--pri);text-decoration:none;font-weight:600}
.reg-box .hint a:hover{text-decoration:underline}
.icon-top{text-align:center;margin-bottom:16px}
.icon-top i{font-size:40px;color:var(--pri)}
.success-msg{background:#d1fae5;color:#065f46;padding:16px;border-radius:12px;font-size:14px;margin-bottom:16px;display:none}
.success-msg.show{display:block}
.lang-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.lang-btn{width:36px;height:36px;border:2px solid var(--bd);border-radius:10px;background:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.lang-btn:hover,.lang-btn.active{border-color:var(--pri);background:#eff6ff}
</style>
</head>
<body>
<div class="reg-box">
  <div class="icon-top"><i class="fas fa-ship"></i></div>
  <h1 data-t="opreg_title">สมัครเป็นพาร์ทเนอร์</h1>
  <p class="sub" data-t="opreg_sub">ลงทะเบียนเป็นเจ้าของเรือ/ผู้ให้บริการทัวร์เรือ</p>

  <div class="lang-row" id="langRow">
    <button class="lang-btn active" data-lang="th" onclick="setOpRegLang('th')" title="ไทย">🇹🇭</button>
    <button class="lang-btn" data-lang="en" onclick="setOpRegLang('en')" title="English">🇬🇧</button>
    <button class="lang-btn" data-lang="zh" onclick="setOpRegLang('zh')" title="中文">🇨🇳</button>
    <button class="lang-btn" data-lang="ko" onclick="setOpRegLang('ko')" title="한국어">🇰🇷</button>
    <button class="lang-btn" data-lang="fr" onclick="setOpRegLang('fr')" title="Français">🇫🇷</button>
  </div>

  <div class="success-msg" id="successMsg">
    <strong data-t="opreg_success_title">สมัครสำเร็จ!</strong><br>
    <span data-t="opreg_success_msg">บัญชีของคุณอยู่ในสถานะรออนุมัติ กรุณารอแอดมินตรวจสอบและอนุมัติก่อนเข้าสู่ระบบ</span>
  </div>

  <form id="regForm" onsubmit="return false">
    <div class="fg"><label data-t="opreg_name">ชื่อ-นามสกุล *</label><input type="text" id="rName" required data-t-placeholder="opreg_name_ph" placeholder="ชื่อผู้ติดต่อ"></div>
    <div class="fg"><label data-t="opreg_email">อีเมล *</label><input type="email" id="rEmail" required placeholder="your@email.com"></div>
    <div class="fg"><label data-t="opreg_phone">เบอร์โทร</label><input type="tel" id="rPhone" data-t-placeholder="opreg_phone_ph" placeholder="0812345678"></div>
    <div class="fg"><label data-t="opreg_company">ชื่อบริษัท/ร้านเรือ *</label><input type="text" id="rCompany" required data-t-placeholder="opreg_company_ph" placeholder="ชื่อธุรกิจ"></div>
    <div class="fg"><label data-t="opreg_desc">รายละเอียด (ไม่บังคับ)</label><textarea id="rDesc" data-t-placeholder="opreg_desc_ph" placeholder="อธิบายธุรกิจของคุณ"></textarea></div>
    <div class="fg"><label data-t="opreg_password">รหัสผ่าน *</label><input type="password" id="rPass" required minlength="6" data-t-placeholder="opreg_password_ph" placeholder="อย่างน้อย 6 ตัว"></div>
    <div class="err" id="rErr"></div>
    <button type="submit" class="btn" id="rBtn" onclick="doRegister()" data-t="opreg_submit">สมัครสมาชิก</button>
  </form>

  <div class="hint">
    <span data-t="opreg_has_account">มีบัญชีแล้ว?</span> <a href="<?= htmlspecialchars($BASE) ?>/operator" data-t="opreg_login">เข้าสู่ระบบ</a><br>
    <a href="<?= htmlspecialchars($BASE) ?>/" style="margin-top:8px;display:inline-block;font-size:11px" data-t="opreg_back_home">← กลับหน้าแรก</a>
  </div>
</div>

<script src="<?= htmlspecialchars($BASE) ?>/assets/i18n.js"></script>
<script>
var APP_PATH_PREFIX = <?= json_encode($BASE) ?>;
const API = APP_PATH_PREFIX + '/api';

function setOpRegLang(lang) {
  currentLang = lang;
  localStorage.setItem('bh_lang', lang);
  if (typeof setLang === 'function') setLang(lang);
  else if (typeof applyTranslations === 'function') applyTranslations();
  document.querySelectorAll('#langRow .lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('bh_lang') || 'th';
  if (typeof setLang === 'function') setLang(saved);
  document.querySelectorAll('#langRow .lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === saved));
});

async function doRegister() {
  const btn = document.getElementById('rBtn');
  const errEl = document.getElementById('rErr');
  const successEl = document.getElementById('successMsg');

  const data = {
    name: document.getElementById('rName').value.trim(),
    email: document.getElementById('rEmail').value.trim(),
    phone: document.getElementById('rPhone').value.trim(),
    company_name: document.getElementById('rCompany').value.trim(),
    description: document.getElementById('rDesc').value.trim(),
    password: document.getElementById('rPass').value
  };

  if (!data.name || !data.email || !data.company_name || !data.password) {
    errEl.textContent = typeof t === 'function' ? t('opreg_err_required') : 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ';
    return;
  }
  if (data.password.length < 6) {
    errEl.textContent = typeof t === 'function' ? t('opreg_err_password') : 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    return;
  }

  btn.disabled = true;
  btn.textContent = typeof t === 'function' ? t('opreg_submitting') : 'กำลังสมัคร...';
  errEl.textContent = '';
  successEl.classList.remove('show');

  try {
    const res = await fetch(API + '/auth/register-operator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (json.success) {
      document.getElementById('regForm').style.display = 'none';
      successEl.classList.add('show');
      if (typeof applyTranslations === 'function') applyTranslations();
      btn.textContent = typeof t === 'function' ? t('opreg_submit') : 'สมัครสมาชิก';
    } else {
      errEl.textContent = json.message || (typeof t === 'function' ? t('opreg_err_required') : 'เกิดข้อผิดพลาด');
      btn.disabled = false;
      btn.textContent = typeof t === 'function' ? t('opreg_submit') : 'สมัครสมาชิก';
    }
  } catch (e) {
    errEl.textContent = typeof t === 'function' ? t('opreg_err_network') : 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
    btn.disabled = false;
    btn.textContent = typeof t === 'function' ? t('opreg_submit') : 'สมัครสมาชิก';
  }
}
</script>
</body>
</html>
