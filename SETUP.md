# OffPlan — Complete Setup & Run Guide

This guide covers everything needed to run all three apps locally from scratch.

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | comes with Node.js |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Expo Go (phone) | latest | App Store / Google Play |

Verify installations:
```bash
node -v        # should print v20.x.x
npm -v         # should print 10.x.x
docker -v      # should print Docker version 24.x.x
```

---

## Folder Structure

```
offplan/
├── backend/       ← NestJS API         → runs on http://localhost:3000
├── admin/         ← SvelteKit Admin     → runs on http://localhost:5173
├── mobile/        ← Expo React Native   → scan QR with phone
├── .env           ← shared env vars
└── docker compose.yml
```

---

## Step 1 — Configure Environment

The `.env` file is already created at the project root. It is pre-filled with working defaults for local development. No changes needed to get started.

```
offplan/.env   ✅ already configured
```

> If you want to double-check, open `.env` and confirm these values match:
> ```
> POSTGRES_USER=postgress
> POSTGRES_DB=Postgress123
> MINIO_ENDPOINT=http://localhost:9000
> ```

---

## Step 2 — Start Infrastructure (Docker)

> `docker-compose.yml` only starts infrastructure (Postgres + MinIO).
> Backend and Admin are run locally — **not** inside Docker during development.

From the project root (`offplan/`), run:

```bash
docker compose up -d
```

This starts 2 services in the background:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Main database |
| MinIO | 9000 | Local file storage (S3-compatible) |
| MinIO Console | 9001 | Web UI to browse uploaded files |

Verify all containers are running:
```bash
docker compose ps
```

Both should show **running** status.

### Create MinIO bucket (first time only)

1. Open http://localhost:9001 in your browser
2. Login: `minioadmin` / `minioadmin`
3. Click **Buckets** → **Create Bucket**
4. Name it: `offplan-assets`
5. Click **Create Bucket**

---

## Step 3 — Backend (NestJS API)

Open a new terminal tab.

```bash
cd offplan/backend
```

### Install dependencies
```bash
npm install
```

### Copy environment file
```bash
cp ../.env .env
```

### Run database migrations
```bash
npx prisma migrate dev --name init
```

> If asked for a migration name, type `init` and press Enter.

### Generate Prisma client
```bash
npx prisma generate
```

### Seed the database (demo data)
```bash
npm run seed
```

This creates:
- **Admin account:** `admin@offplan.com` / `Admin@123`
- **Investor account:** `investor@offplan.com` / `User@123`
- **3 sample properties** (Downtown Dubai, Palm Jumeirah, Creek Harbour)
- **1 sample investment** with payment schedule

### Start the backend
```bash
npm run start:dev
```

**Backend is ready when you see:**
```
Backend running on http://localhost:3000/api/v1
```

### Test it's working
Open in browser: http://localhost:3000/api/v1/properties

You should see a JSON response with properties.

---

## Step 4 — Admin Panel (SvelteKit)

Open a **new terminal tab** (keep backend running).

```bash
cd offplan/admin
```

### Install dependencies
```bash
npm install
```

### Start the admin panel
```bash
npm run dev
```

**Admin is ready when you see:**
```
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

**Login with:**
- Email: `admin@offplan.com`
- Password: `Admin@123`

### Admin Panel Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | /dashboard | Stats & recent investments |
| Properties | /properties | List, search, delete |
| Create Property | /properties/create | Add new property with payment plan |
| Bulk Import | /properties/bulk | Upload CSV to import multiple properties |
| Investments | /investments | View all, approve or reject |

---

## Step 5 — Mobile App (Expo)

Open a **new terminal tab** (keep backend and admin running).

```bash
cd offplan/mobile
```

### Install dependencies
```bash
npm install
```

### Find your computer's local IP address

**Mac:**
```bash
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
# look for IPv4 Address under your WiFi adapter
```

Example output: `192.168.1.5`

### Update mobile API URL

Open `offplan/.env` and change:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
```

> Replace `192.168.1.5` with your actual IP.
> Your phone and computer must be on the **same WiFi network**.

### Start Expo
```bash
npx expo start
```

A QR code will appear in the terminal.

### Run on your phone
1. Install **Expo Go** from the App Store or Google Play
2. Open Expo Go on your phone
3. Scan the QR code in the terminal

**Or run in simulator:**
- iOS: Press `i` in the terminal (requires Xcode on Mac)
- Android: Press `a` in the terminal (requires Android Studio)

**Login with:**
- Email: `investor@offplan.com`
- Password: `User@123`

---

## All Services Summary

Once everything is running, you will have:

| App | URL / Access | Credentials |
|-----|-------------|-------------|
| Backend API | http://localhost:3000/api/v1 | — |
| Admin Panel | http://localhost:5173 | admin@offplan.com / Admin@123 |
| Mobile App | Scan QR with Expo Go | investor@offplan.com / User@123 |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Prisma Studio | http://localhost:5555 | run `npx prisma studio` in backend/ |
| PostgreSQL | localhost:5432 | postgress / offplan_secret |

---

## Useful Commands

### Backend
```bash
# Start in development (auto-reload)
npm run start:dev

# View database in browser UI
npx prisma studio

# Reset database and re-seed
npx prisma migrate reset
npm run seed

# Re-run migrations after schema change
npx prisma migrate dev --name <change_name>
```

### Admin Panel
```bash
# Development
npm run dev

# Build for production
npm run build
npm run preview
```

### Mobile
```bash
# Start Expo dev server
npx expo start

# Clear cache if something breaks
npx expo start --clear

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Docker
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for one service
docker compose logs -f postgres

# Reset all data (destructive)
docker compose down -v
```

---

## Bulk Import — CSV Format

Download the sample CSV: `admin/static/sample-import.csv`

Required columns:
```
title, description, location, totalPrice, totalShares, roi, images, paymentPlanJSON
```

Example row:
```
Marina Heights,"Stunning marina views",Dubai Marina UAE,3500000,100,8.2,https://example.com/img.jpg,"{""downPayment"":20,""installments"":[{""name"":""On Handover"",""percentage"":80,""dueType"":""milestone"",""dueValue"":""handover""}]}"
```

Payment plan JSON must be valid and all percentages (downPayment + installments) must sum to **100**.

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check if postgres container is running
docker compose ps

# Restart it
docker compose restart postgres
```

### "prisma migrate failed"
```bash
# Make sure DATABASE_URL in backend/.env matches docker compose values
# POSTGRES_USER=postgress, POSTGRES_DB=Postgress123

cat backend/.env | grep DATABASE_URL
# Should be: postgresql://postgress:offplan_secret@localhost:5432/Postgress123
```

### "Port 3000 already in use"
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### "Expo QR not working on phone"
- Make sure phone and laptop are on the same WiFi
- Use your machine's IP, not `localhost`
- Try switching from `Tunnel` to `LAN` mode in Expo

### "npm install fails"
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

### Admin panel login shows "Connection error"
- Make sure backend is running on port 3000 first
- Check `API_URL=http://localhost:3000` in `admin/.env`

---

## Development Workflow

```
Terminal 1  →  docker compose up -d          (infrastructure)
Terminal 2  →  cd backend && npm run start:dev (API)
Terminal 3  →  cd admin && npm run dev         (admin panel)
Terminal 4  →  cd mobile && npx expo start     (mobile app)
```

Keep all four terminals open while developing.
