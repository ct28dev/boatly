# BOATLY

### Thailand Boat Tourism Platform | แพลตฟอร์มท่องเที่ยวทางเรือของไทย

**BOATLY** is a comprehensive boat tourism platform connecting travelers with boat tour operators across Thailand. From island-hopping in the Andaman Sea to floating markets in the central plains, BOATLY makes discovering and booking boat tours seamless.

**BOATLY** คือแพลตฟอร์มท่องเที่ยวทางเรือแบบครบวงจร เชื่อมต่อนักท่องเที่ยวกับผู้ประกอบการทัวร์ทางเรือทั่วประเทศไทย ตั้งแต่การเที่ยวเกาะในทะเลอันดามัน ไปจนถึงตลาดน้ำในภาคกลาง

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo + npm workspaces |
| **Backend** | NestJS, TypeORM, PostgreSQL 16, Redis 7 |
| **Customer App** | Next.js 15, React 19, Tailwind CSS, Zustand, PWA |
| **Admin Dashboard** | Next.js 15, React 19, Tailwind CSS, Recharts |
| **Shared** | TypeScript 5, shared types & UI components |
| **Infrastructure** | Docker, Nginx, GitHub Actions CI/CD |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx (Reverse Proxy)                   │
│                    :80 / :443  — SSL termination                │
├──────────┬──────────────────┬───────────────────┬───────────────┤
│  /api/*  │     /admin/*     │    /ws            │     /*        │
│    ▼     │       ▼          │     ▼             │      ▼        │
│ Backend  │ Admin Dashboard  │  Backend WS       │ Customer PWA  │
│  :4000   │     :3001        │   :4000           │    :3000      │
├──────────┴──────────────────┴───────────────────┴───────────────┤
│                      Docker Network                             │
├──────────────────────┬──────────────────────────────────────────┤
│   PostgreSQL :5432   │             Redis :6379                  │
└──────────────────────┴──────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** 16
- **Redis** 7
- **Docker** & Docker Compose (for containerized setup)

## XAMPP (PHP main app)

หลังย้ายโฟลเดอร์เป็น `htdocs/boatly` ให้เปิด **`http://localhost/boatly/`** — รายละเอียด DB / OAuth ดู [`docs/MIGRATION-FOLDER-RENAME.md`](docs/MIGRATION-FOLDER-RENAME.md)

**สำรองฐานข้อมูล MySQL (macOS / XAMPP):** [`docs/BACKUP-MYSQL-XAMPP.md`](docs/BACKUP-MYSQL-XAMPP.md) — สคริปต์ `infrastructure/ci-cd/scripts/backup-mysql-xampp.sh` (รันด้วยมือหรือ cron)

**ดีไซน์ & API (สเปกเต็ม):**
- [`docs/FIGMA-DESIGN-SYSTEM.md`](docs/FIGMA-DESIGN-SYSTEM.md) — โครงสร้าง Figma, tokens, components, 20+ หน้าจอ
- [`docs/API-SPEC-PRODUCTION-MAPPING.md`](docs/API-SPEC-PRODUCTION-MAPPING.md) — รูปแบบ response, Base URL, แมป endpoint กับ `api/`, UAT flow

## Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/boatly.git
cd boatly

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# 4. Start the database & Redis (or use Docker)
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis

# 5. Run database migrations and seed data
npm run db:migrate
npm run db:seed

# 6. Start all services in development mode
npm run dev
```

Services will be available at:
- **Customer PWA:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **Backend API:** http://localhost:4000
- **API Documentation:** http://localhost:4000/api/docs

### Docker Quick Start

```bash
# Start everything with Docker Compose
cp infrastructure/docker/.env.docker .env
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Development mode (with hot reload, no nginx)
docker compose \
  -f infrastructure/docker/docker-compose.yml \
  -f infrastructure/docker/docker-compose.dev.yml \
  up -d
```

## Project Structure

```
boatly/
├── apps/
│   ├── backend-api/          # NestJS API server
│   │   └── src/
│   │       └── modules/      # Auth, Tours, Bookings, Payments, etc.
│   ├── customer-pwa/         # Next.js customer-facing PWA
│   │   └── src/
│   │       ├── app/          # App router pages
│   │       ├── services/     # API client services
│   │       ├── store/        # Zustand state management
│   │       └── hooks/        # Custom React hooks
│   └── admin-dashboard/      # Next.js admin panel
│       └── src/
├── packages/
│   ├── shared-types/         # Shared TypeScript types & interfaces
│   └── ui-components/        # Shared UI component library
├── database/
│   ├── migrations/           # Database migrations (Knex)
│   └── seeds/                # Seed data
├── infrastructure/
│   ├── docker/               # Docker Compose & Dockerfiles
│   ├── nginx/                # Nginx reverse proxy config
│   └── ci-cd/                # GitHub Actions & deployment scripts
├── package.json              # Root workspace config
├── turbo.json                # Turborepo pipeline config
└── tsconfig.base.json        # Shared TypeScript config
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps for production |
| `npm run lint` | Lint all workspaces |
| `npm run test` | Run tests across all workspaces |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset database (rollback + migrate + seed) |
| `npm run docker:up` | Start Docker Compose stack |
| `npm run docker:down` | Stop Docker Compose stack |

## API Documentation

The backend API is documented with Swagger/OpenAPI. Once the backend is running, visit:

**http://localhost:4000/api/docs**

Key API endpoints:
- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/login` — User login
- `GET /api/v1/tours` — List boat tours
- `GET /api/v1/tours/:id` — Tour details
- `POST /api/v1/bookings` — Create booking
- `GET /api/v1/bookings/:id` — Booking status
- `POST /api/v1/payments` — Process payment

## Deployment

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

1. **CI** (`ci.yml`) — Lint, test, build, and push Docker images on every push/PR
2. **Deploy** (`deploy.yml`) — Automatic staging deployment, manual production approval

Supported deployment targets:
- **AWS EC2** — Docker Compose via SSH
- **AWS ECS** — Container orchestration
- **Vercel** — Serverless frontend deployment

### Manual Deployment

```bash
# Deploy to staging
./infrastructure/ci-cd/scripts/deploy.sh staging

# Deploy to production
./infrastructure/ci-cd/scripts/deploy.sh production

# Backup database
./infrastructure/ci-cd/scripts/backup-db.sh --upload-s3
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Keep commits atomic and well-described
- Update API documentation for endpoint changes

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with care for Thailand's boat tourism industry.
