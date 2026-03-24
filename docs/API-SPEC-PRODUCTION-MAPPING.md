# BOATLY — API Spec (Production) + แมปกับโค้ดปัจจุบัน

รูปแบบ response มาตรฐาน (ทุก endpoint ที่ใช้ `helpers.php`):

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

ข้อผิดพลาด:

```json
{
  "success": false,
  "data": null,
  "message": "คำอธิบายข้อผิดพลาด"
}
```

---

## Base URL

| สภาพแวดล้อม | Base URL (ตัวอย่าง) |
|-------------|---------------------|
| Production (ที่คุณระบุ) | `https://api.yourplatform.com/v1` |
| BOATLY PHP (XAMPP / โฟลเดอร์ boatly) | `https://yourdomain/boatly/api` หรือ `https://yourdomain/api` (ขึ้นกับ virtual host) |
| Local XAMPP | `http://localhost/boatly/api` |

> **หมายเหตุ:** โค้ด PHP ปัจจุบัน **ไม่มี prefix `/v1`** — path คือ `/api/{handler}/...` ดูรายการ handler ใน `api/index.php`  
> ถ้าจะขึ้น production แบบ `.../v1` ต้องเพิ่ม rewrite หรือ gateway หน้า PHP

---

## แมป Endpoint (สเปกที่ต้องการ ↔ โค้ด BOATLY)

คอลัมน์ **Implemented** อ้างอิงไฟล์ใน `api/` (PHP)

### AUTH

| Method | Spec (คุณระบุ) | BOATLY (ปัจจุบัน) | หมายเหตุ |
|--------|----------------|-------------------|----------|
| POST | `/auth/register` | `POST /auth/register` | `auth.php` |
| POST | `/auth/login` | `POST /auth/login` | |
| POST | `/auth/google` | `POST /auth/google` | |
| POST | `/auth/facebook` | — | ยังไม่มี — ใช้ Google/Line เป็นหลัก |
| GET | `/auth/me` | `GET /auth/me` | |

### USER

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| GET/PUT | `/users/profile` | `GET/PUT /users/profile` หรือผ่าน `/users/...` | ตรวจ `users.php` |
| GET | `/users/favorites` | `GET /favorites` | ใช้ module `favorites.php` |
| POST | `/users/favorites` | `POST /favorites` (ตามที่ implement) | |

### BOATS / TOURS

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| GET | `/boats` | `GET /tours` | รายการเรือ/ทัวร์รวมใน tours |
| GET | `/boats/:id` | `GET /tours/:id` | |
| GET | `/boats/nearby` | `GET /tours?...` + geocode | อาจใช้ query + `geocode` |

### BOOKING

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/bookings` | `POST /bookings` | `bookings.php` |
| GET | `/bookings` | `GET /bookings` | |
| GET | `/bookings/:id` | `GET /bookings/:id` | |
| POST | `/bookings/confirm` | — | อาจรวมใน payment flow |

### AI / MATCHING

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/ai/recommend` | `POST /ai/...` | ดู `ai.php` |
| POST | `/match/boats` | `POST /match/...` | `match.php` |

### PAYMENT

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/payments/qr` | `POST /payments/...` | `payments.php` |
| POST | `/payments/card` | — | ขึ้นกับ gateway |
| POST | `/payments/cod` | — | ถ้ามีในระบบ |

### TRACKING / CHAT

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| GET | `/tracking/:booking_id` | — / บางส่วนใน booking | ต้องขยายตาม product |
| GET | `/chat/:booking_id` | — | ดูเอกสาร live chat ถ้ามี |

### REVIEW

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/reviews` | `POST /reviews` | |
| GET | `/reviews/:boat_id` | `GET /reviews?boat_id=...` | ตรวจพารามิเตอร์จริงใน `reviews.php` |

### TIP / REVENUE / SUBSCRIPTION

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/tips` | `POST /tip/...` | `tip.php` |
| GET | `/revenue/dashboard` | `GET /revenue/...` | `revenue.php` |
| GET/POST | `/subscription` | `GET/POST /subscription` | `subscription.php` |

### ADMIN

| Method | Spec | BOATLY | หมายเหตุ |
|--------|------|--------|----------|
| POST | `/admin/review/approve` | `admin.php` / workflow ใน admin | |
| POST | `/admin/promo` | `POST /promotions` | CRUD โปรโมชัน |

### PROMOTIONS (ลูกค้า)

| Method | Path | Implemented |
|--------|------|-------------|
| GET | `/promotions` | รายการที่ active + ช่วงวันที่ + limit |

---

## UAT Flow (ต้องผ่าน)

ลำดับทดสอบแบบ end-to-end:

```
User → AI → Planner → Matching → Booking → Payment → Tracking → Review → Tip
```

| ขั้น | สิ่งที่ตรวจ | เกณฑ์ผ่านเบื้องต้น |
|------|-------------|---------------------|
| 1 User | ลงทะเบียน / ล็อกอิน | token ได้, `/auth/me` ถูกต้อง |
| 2 AI | แนะนำทริปจากความสนใจ | response `success`, มีข้อมูลแสดงใน UI |
| 3 Planner | สร้างแผน / timeline | บันทึกได้ (ถ้ามี API itineraries) |
| 4 Matching | จับคู่เรือ | ได้รายการเรือสอดคล้อง filter |
| 5 Booking | สร้างการจอง | `POST /bookings` สำเร็จ, มี ref |
| 6 Payment | QR/ช่องทางที่เปิด | สถานะชำระเงินสอดคล้อง DB |
| 7 Tracking | (ถ้ามี) ตำแหน่ง/สถานะ | แสดงบนแผนที่หรือสถานะขั้นตอน |
| 8 Review | ส่งรีวิว + รูป | `POST /reviews` สำเร็จ |
| 9 Tip | ให้ทิป | `tip` endpoint สำเร็จ |

เอกสาร UAT เพิ่มเติมใน repo: [`UAT-PRODUCTION.md`](./UAT-PRODUCTION.md), [`UAT-TIP-SYSTEM.md`](./UAT-TIP-SYSTEM.md), [`UAT-LIVE-CHAT-PRICING.md`](./UAT-LIVE-CHAT-PRICING.md)

---

## แนวทางให้สอดคล้อง `https://api.../v1`

1. **Reverse proxy (Nginx):** `location /v1/ { proxy_pass http://php-backend/api/; }`  
2. **หรือ** เพิ่ม segment `v1` ใน `api/index.php` (ต้องแก้ router ทั้งชุด)

---

## เวอร์ชัน

| เวอร์ชัน | หมายเหตุ |
|---------|----------|
| 1.0 | แมปกับ BOATLY PHP + สเปกที่ต้องการ production |
