# BOATLY — Figma Design System (สเปกเต็ม)

เอกสารนี้ใช้เป็น **blueprint** สำหรับสร้างไฟล์ Figma — โครงสร้างโฟลเดอร์, Design Tokens, Components และรายการหน้าจอ (20+)

ดูรายละเอียด wireframe เดิมได้ที่ [`UI-WIREFRAME.md`](./UI-WIREFRAME.md)

---

## A. โครงสร้างไฟล์ Figma (แนะนำ)

```
📁 Boat Platform Design System
├── 🎨 Design System          ← Variables, Styles, Grid
├── 🧩 Components             ← คอมโพเนนต์ที่ reuse ได้
├── 📱 Mobile Screens         ← 375 / 390 / 428 (เลือก device frame หลัก 1 ขนาด)
└── 💻 Web Screens (Optional) ← 1280+ สำหรับแอดมิน / desktop
```

**การตั้งชื่อเพจใน Figma**

| เพจ | เนื้อหา |
|-----|--------|
| `00 — Cover` | ชื่อโปรเจกต์, เวอร์ชัน, owner |
| `01 — Tokens` | Color / Type / Spacing (หรือใช้ Variables อย่างเดียว) |
| `02 — Components` | คอมโพเนนต์ทั้งหมด |
| `03 — Mobile Flows` | หน้าจอลูกค้า |
| `04 — Partner` | Partner / Operator |
| `05 — Admin` | แอดมิน |

---

## B. Design System (สร้างก่อน — ใช้ Figma Variables)

### Color Styles

| Token / ชื่อ | Hex | ใช้กับ |
|---------------|-----|--------|
| Primary / 500 | `#0EA5E9` | ปุ่มหลัก, ลิงก์, โฟกัส |
| Primary / 600 | `#0284C7` | Hover / pressed ปุ่มหลัก |
| Success | `#22C55E` | สถานะสำเร็จ, ยืนยัน |
| Danger | `#EF4444` | ข้อผิดพลาด, ลบ, เตือน |
| Dark | `#0F172A` | หัวข้อ, ข้อความหลัก |
| Gray (surface) | `#F1F5F9` | พื้นหลังการ์ดเบา, divider เบา |

> **หมายเหตุ BOATLY ปัจจุบัน:** แอปเว็บใช้โทน ocean (`#023e8a`, `#0077b6` ฯลฯ) — ถ้าต้องการ **align กับโค้ดจริง** ให้เพิ่มชุดสี “Legacy Ocean” เป็นอีกหนึ่งธีมใน Variables

### Typography

| Style | ขนาด / น้ำหนัก | ใช้กับ |
|-------|----------------|--------|
| H1 | 24 / Bold | หัวข้อหน้าหลัก |
| H2 | 20 / SemiBold | หัวข้อส่วน |
| Body | 16 / Regular | เนื้อหาหลัก |
| Caption | 12 / Regular หรือ Light | คำอธิบายรอง, helper text |

**ฟอนต์:** แนะนำ **Inter** หรือ **Noto Sans Thai** (รองรับไทย + ละติน)

### Spacing System

ใช้ scale คงที่: **4 / 8 / 12 / 16 / 24 / 32** (px)

- ระยะภายในการ์ด: 12–16  
- ระหว่างบล็อก: 24–32  
- Padding หน้าจอมือถือ: 16 (ซ้าย–ขวา)

### Grid (Mobile)

- Columns: **4**  
- Margin: **16**  
- Gutter: **8**

---

## C. Components (สร้างเป็น Component + Variants)

| Component | Variants / สถานะ |
|-------------|------------------|
| **Button** | Primary / Secondary / Ghost; Default / Hover / Disabled / Loading |
| **Card — Trip** | รูป, ชื่อ, ราคา, rating, badge |
| **Card — Boat** | แกลเลอรีย่อ, capacity, ราคาเริ่มต้น |
| **Card — Booking** | สถานะ, วันที่, ref, ปุ่มดำเนินการ |
| **Bottom Navigation** | 4–5 แท็บ, active state, icon + label |
| **Input Field** | Default / Focus / Error / Disabled + helper text |
| **Tag / Badge** | neutral / success / warning / promo |
| **Timeline Item** | Planner — เวลา, ชื่อกิจกรรม, icon |

**Auto layout:** เปิดทุกคอมโพเนนต์หลักเพื่อให้ responsive ใน Figma

---

## D. Screens — รายการ 20+ หน้า (Mobile เป็นหลัก)

ใช้เป็น **checklist** ตอนวาดเฟรม — แต่ละหน้า = 1 Frame (หรือ 1 Flow)

| # | หน้า | องค์ประกอบหลัก |
|---|------|----------------|
| 1 | **Dashboard (Home)** | Search, Quick menu 4 ปุ่ม, AI banner, Popular trips (horizontal scroll), Promotions |
| 2 | **Explore** | Map view, filter (ราคา / จำนวนคน), list เรือ |
| 3 | **Planner** | Timeline แนวตั้ง, ปุ่ม Add activity, ปุ่ม AI Generate |
| 4 | **AI Generate** | Location, Date, People, Budget, Interests, ปุ่ม Generate |
| 5 | **Boat Detail** | รูป, ราคา, rating, คำอธิบาย, เลือกเวลา |
| 6 | **Booking** | Date picker, time slot, จำนวนคน, special request |
| 7 | **Payment** | QR, บัตร, COD (ตามที่รองรับจริง) |
| 8 | **Booking Summary** | รายละเอียดทริป, **ไม่แสดงราคา** (ตาม requirement), ปุ่ม Share |
| 9 | **Live Tracking** | แผนที่, ตำแหน่งเรือ |
| 10 | **Chat** | แชทแบบเรียลไทม์, ปุ่มโทร |
| 11 | **Review** | ดาว, อัปโหลดรูปได้สูงสุด 5 รูป |
| 12 | **Tip** | จำนวนแนะนำ, กรอกเอง, QR จ่าย |
| 13 | **Profile** | แก้ข้อมูล, รายการโปรด, ภาษา |
| 14 | **Favorite** | ทริปที่บันทึก |
| 15 | **Language** | ไทย 🇹🇭, EN 🇬🇧, 中文 🇨🇳, 한국 🇰🇷 |
| 16 | **Orders** | กำลังมาถึง / ประวัติ |
| 17 | **Partner Dashboard** | รายการจอง, รายได้ย่อ |
| 18 | **Revenue Dashboard** | Commission, Tip, Subscription |
| 19 | **Subscription** | เลือกแพ็กเกจ |
| 20 | **Admin Panel** | อนุมัติรีวิว, จัดการเรือ, แบนเนอร์โปรโมชัน |

**เพิ่มเติมที่มีใน [`UI-WIREFRAME.md`](./UI-WIREFRAME.md):** Calendar, Time slot แยกเฟรม, Notifications, Settings ฯลฯ — รวมแล้วครอบคลุม 20+ ได้

---

## Export & Handoff

- **Dev Mode:** เปิดใช้ spacing/token ตรงกับตารางด้านบน  
- **Assets:** SVG icons (24px grid), รูป placeholder ใช้ ratio คงที่ (เช่น 16:9 สำหรับ hero)

---

## Implementation (เว็บลูกค้า)

แอปใช้โทน **ocean เดิม** (`--ocean-*`: เช่น `#0077b6`, `#023e8a`, `#00b4d8`) ใน `index.html` — เอกสารสเปก Figma ด้านบนเป็นแนวทาง ไม่ได้บังคับให้จอตรงทุกพิกเซล

## เวอร์ชัน

| เวอร์ชัน | วันที่ | หมายเหตุ |
|---------|--------|----------|
| 1.0 | 2026-03 | สเปกเริ่มต้นตาม brief |
| 1.1 | 2026-03 | ใส่ implementation note — หน้าแรกลูกค้าใน `index.html` |
| 1.2 | 2026-03 | ย้อนโทนสีในแอปกลับ ocean เดิม (ไม่ใช้ sky ramp) |
