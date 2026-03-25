# OffPlan — Fractional Off-Plan Property Investment Platform

A full-stack, production-ready platform for fractional real estate investment.

## Architecture

```
offplan/
├── backend/          # NestJS API + Prisma ORM
├── admin/            # SvelteKit 5 Admin Panel
├── mobile/           # Expo React Native App
└── docker-compose.yml
```

---

## Quick Start

### 1. Clone & configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000
- Admin Panel on port 5173

### 3. Seed the database

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
```

**Demo accounts:**
- Admin: `admin@offplan.com` / `Admin@123`
- Investor: `investor@offplan.com` / `User@123`

---

## Backend (NestJS)

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

API available at: `http://localhost:3000/api/v1`

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register investor |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh JWT |
| GET | /properties | List properties (public) |
| GET | /properties/:id | Property details (auth) |
| POST | /investments | Create investment |
| GET | /investments/my | My investments |
| GET | /payments/upcoming | Upcoming payments |
| GET | /admin/dashboard | Admin stats |
| POST | /admin/properties | Create property |
| POST | /admin/properties/bulk | Parse bulk import |
| POST | /admin/properties/bulk/confirm | Confirm bulk insert |
| PATCH | /admin/investments/:id/status | Approve/reject |

---

## Admin Panel (SvelteKit 5)

```bash
cd admin
npm install
npm run dev
```

Admin at: `http://localhost:5173`

### Features
- **Dashboard** — Stats overview, recent investments
- **Properties** — CRUD with payment plan builder
- **Bulk Import** — Upload CSV/Excel, preview, confirm
- **Investments** — View all, filter, approve/reject

---

## Mobile App (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on iOS/Android.

### Screens
- Login / Register
- Property listings with filters & infinite scroll
- Property detail with image carousel + investment modal
- My investments dashboard
- Profile

---

## Payment Plan JSON Structure

```json
{
  "downPayment": 20,
  "installments": [
    {
      "name": "After 3 months",
      "percentage": 10,
      "dueType": "date",
      "dueValue": "2026-06-01"
    },
    {
      "name": "On Handover",
      "percentage": 70,
      "dueType": "milestone",
      "dueValue": "handover"
    }
  ]
}
```

All percentages must sum to 100%.

---

## Bulk Import CSV Format

```
title,description,location,totalPrice,totalShares,roi,images,paymentPlanJSON
```

See `admin/static/sample-import.csv` for an example.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret |
| `AWS_S3_BUCKET` | S3 bucket name |
| `EXPO_PUBLIC_API_URL` | Mobile app API URL |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, Prisma 5, PostgreSQL 16 |
| Admin | SvelteKit 5, TailwindCSS, Zod |
| Mobile | Expo 52, React Native, Zustand |
| Auth | JWT + Refresh Tokens, bcryptjs |
| Storage | AWS S3 SDK v3 |
| Infra | Docker, Docker Compose |

---

## Security

- JWT access tokens (15m expiry) + refresh tokens (7d)
- HTTP-only cookies for admin panel
- Role-based guards (USER / ADMIN / SUPER_ADMIN)
- Zod validation on all inputs
- NestJS throttling (rate limiting)
- Bcrypt password hashing (rounds: 12)
- Secure S3 uploads with ACL
