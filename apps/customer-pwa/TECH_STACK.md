# BOATLY Customer PWA — Tech Stack (ล็อก Production)

> **ห้ามเปลี่ยนสแต็กหลักโดยไม่มีเหตุผลทางเทคนิค / ทีม**

## Frontend
| เทคโนโลยี | หมายเหตุ |
|-----------|----------|
| **Next.js 15** (App Router) | React Server Components + Client Components |
| **React 19** | UI |
| **TypeScript** | ทั้งโปรเจกต์ |

## UI & Styling
| เทคโนโลยี | หมายเหตุ |
|-----------|----------|
| **Tailwind CSS 3** | Design tokens + `@apply` ใน `globals.css` |
| **Framer Motion** | แอนิเมชัน / micro-interaction |
| **lucide-react** | ไอคอน |

## State & Data
| เทคโนโลยี | หมายเหตุ |
|-----------|----------|
| **Zustand** | Global client state (`src/store/useStore.ts`) |
| **TanStack React Query** | Server state, cache, retry (`src/app/providers.tsx`) |
| **Axios** | HTTP client (`src/services/apiClient.ts` + `src/services/api.ts`) |

## PWA
| เทคโนโลยี | หมายเหตุ |
|-----------|----------|
| **next-pwa** | `next.config.ts` → `dest: 'public'`, disable ใน dev |

## โครงสร้างหลัก
```
src/
├── app/                 # App Router
│   ├── page.tsx         # Dashboard (Super App)
│   ├── planner/
│   ├── booking/
│   ├── explore/
│   ├── trips/
│   ├── home/            # legacy → redirect /
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── cards/
│   ├── navigation/
│   └── dashboard/
├── services/
│   ├── apiClient.ts     # axios + interceptors
│   └── api.ts           # helpers ต่อ backend
└── store/
    └── useStore.ts      # Zustand
```

## Design System (สีหลัก)
- **primary**: `#0EA5E9` (sky-500)
- **secondary**: `#22C55E` (green-500)
- **dark**: `#0F172A` (slate-900)

คลาสสากล: `.card` ใน `globals.css`

## UAT Checklist (ก่อน Production)
- [ ] Dashboard โหลด &lt; 2 วิ (LCP บนมือถือ)
- [ ] Booking flow ครบ end-to-end
- [ ] ไม่มี double booking (ฝั่ง API + UI state)
- [ ] Payment / QR ใช้งานได้
- [ ] Mobile scroll / touch ลื่น (ไม่มี layout shift รุนแรง)
- [ ] PWA: ติดตั้งได้ / offline shell ทำงาน
