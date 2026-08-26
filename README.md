

<p align="center">
  <img src="public/assests/white%20NSDC%20logo.png" alt="NSDC VCET Logo" width="120" />
</p>

<p align="center">
  <a href="https://github.com/vcet-nsdc/vcet-nsdc">
    <img alt="repo" src="https://img.shields.io/badge/repo-vcet--nsdc%2Fvcet--nsdc-111827" />
  </a>
  <a href="https://github.com/vcet-nsdc/vcet-nsdc/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/vcet-nsdc/vcet-nsdc/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="./LICENSE">
    <img alt="license" src="https://img.shields.io/badge/license-MIT-blue" />
  </a>
  <img alt="version" src="https://img.shields.io/badge/version-1.0.0-0ea5e9" />
</p>

# NSDC VCET Website

Official website for **National Students Data Corps (NSDC) – VCET**, a student-led data science community at **Vidyavardhini College of Engineering & Technology, Vasai**.

This repository powers the public site experience (home, team, events, socials, contact) plus operational flows like event registrations (with payment proof), an admin dashboard (with export), and certificate search/management.

**Live site:** https://vcet-nsdc.vercel.app  
**Repository:** https://github.com/vcet-nsdc/vcet-nsdc  
**Author (license holder):** Surajphirke3

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [API](#api)
- [Configuration](#configuration)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- Landing page sections (hero, about, highlights, quick links)
- Events: upcoming flagship events plus DB-driven past-event listing and per-event detail pages
- Team directory rendered server-side from the CMS (falls back to bundled static JSON when the CMS is empty)
- Contact form that stores messages in MongoDB
- Registration flow:
  - Team/squad registration with configurable dynamic form schemas
  - Payment screenshot upload (stored as base64 in MongoDB)
  - Transaction ID tracking with duplicate-payment protection
- Admin dashboard (`/admin`) protected by NextAuth v5 credentials auth with role-based access control (Faculty Admin / Developer Admin):
  - Registrations review/approval workflow with audit log
  - Excel export of registrations
  - Payment-screenshot viewer (session-authenticated, private cache headers)
  - CMS management for team members and content
  - Event & theme management, settings, users, system health
- Certificates API:
  - Public certificate verification lookup by email (rate-limited)
  - Admin-only create/update/delete via the `certificate:manage` permission

## Tech Stack

- **Next.js (App Router)** + **React**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **MongoDB** + **Mongoose**
- **NextAuth v5** (credentials provider, JWT sessions, RBAC)
- **React Hook Form** + **Zod** (forms & validation)
- **Framer Motion** (animation)
- **ExcelJS** (Excel export)
- **Nodemailer** + **Cloudinary** (email notifications & media)

## Prerequisites

- Node.js 20.9+ (enforced via `engines` in `package.json`)
- npm (comes with Node.js)
- A MongoDB instance (local or cloud)

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/vcet-nsdc/vcet-nsdc.git
   cd vcet-nsdc
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a local environment file (see `.env.example` for the full list)

   ```bash
   cp .env.example .env
   ```

   Minimum required values:

   ```bash
   # .env
   MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
   AUTH_SECRET="generate-with-openssl-rand-base64-32"

   # Optional
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   SMTP_HOST="" SMTP_USER="" SMTP_PASS="" SMTP_PORT=587
   CLOUDINARY_CLOUD_NAME="" CLOUDINARY_API_KEY="" CLOUDINARY_API_SECRET=""
   GOOGLE_SITE_VERIFICATION=""
   LOGGING_ENDPOINT=""
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open the app

   - http://localhost:3000

## Usage

### Common scripts

```bash
npm run dev            # start dev server (Turbopack)
npm run build          # production build
npm run start          # serve production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run format         # Prettier (write)
npm run format:check   # Prettier (CI check)

# Database utilities (all read .env, fail fast without it)
npm run seed:admin     # idempotently seed the first admin from SEED_ADMIN_* env vars
npm run create:user    # create or update an admin user
npm run migrate:events # import legacy events into MongoDB (add --force to overwrite edits)
npm run migrate:cms    # import CMS content
npm run migrate:proofs # move stored payment proofs to Cloudinary
```

### Registration (UI)

- Go to `/register`
- Fill in squad/team details
- Upload a payment screenshot
- Submit to create a registration entry in MongoDB

### Admin (UI & API)

The admin dashboard lives at `/admin` and requires signing in at `/admin/login`
with a seeded admin account (NextAuth v5 credentials provider, JWT sessions,
8-hour expiry, account lockout after repeated failures).

All `/api/admin/*` endpoints require an authenticated session with the
appropriate permission (see `src/config/permissions.ts`). Requests from the
dashboard automatically include the session cookie; external API consumers must
authenticate through the Auth.js credentials flow first.

## Screenshots

If you don’t have your own screenshots yet, you can start with the included assets:


Example embed:

## API

Base URL (local): `http://localhost:3000`  
Base path: `/api`

### POST /api/register

Creates a registration record from multipart form data.

Required form fields:

- `squadName` (string)
- `domain` (string)
- `leaderFullName` (string)
- `leaderEmail` (string)
- `leaderPhone` (string)
- `leaderCollege` (string)
- `transactionId` (string)
- `paymentScreenshot` (file, max 5MB)
- Optional members:
  - `member2FullName`, `member2Email`
  - `member3FullName`, `member3Email`

Example:

```bash
curl -X POST "http://localhost:3000/api/register" \
  -F "squadName=Team Alpha" \
  -F "domain=AI/ML" \
  -F "leaderFullName=Jane Doe" \
  -F "leaderEmail=jane@example.com" \
  -F "leaderPhone=9999999999" \
  -F "leaderCollege=VCET" \
  -F "transactionId=TXN123" \
  -F "paymentScreenshot=@./payment.jpeg"
```

### POST /api/contact

Stores a contact message in MongoDB.

Body (JSON):

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "contact": "9999999999",
  "message": "Hello NSDC!"
}
```

Example:

```bash
curl -X POST "http://localhost:3000/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","contact":"9999999999","message":"Hello NSDC!"}'
```

### GET /api/certificates?email=...

Searches the latest certificate by email.

Example:

```bash
curl "http://localhost:3000/api/certificates?email=jane@example.com"
```

### POST /api/certificates

Creates a new certificate.

Body (JSON):

```json
{
  "certificateNumber": "NSDC-2026-0001",
  "name": "Jane Doe",
  "product": "Techblitz",
  "email": "jane@example.com",
  "date": "2026-03-28"
}
```

### GET /api/certificates/:id

Fetches a certificate by MongoDB document ID. Admin-only (`certificate:manage`).

### PUT /api/certificates/:id

Updates a certificate (download/share tracking) and optionally stores `imageData`.
Admin-only; `imageData` must be a base64 image under 2MB.

Body (JSON):

```json
{ "action": "download" }
```

```json
{ "action": "share", "imageData": "data:image/png;base64,..." }
```



### GET /api/admin/registrations?domain=...

Returns registrations (excluding the screenshot blob). Requires an admin session with `registration:read`.

- `domain` (optional): domain name, or `all`

### GET /api/admin/export?domain=...

Downloads an Excel export of registrations (capped at 5000 rows). Requires `registration:export`.

### GET /api/admin/screenshot/:id

Serves the stored payment screenshot for a registration. Requires `registration:read`; responses are cached privately only.

## Configuration

Environment variables (see `.env.example` for the complete list):

- `MONGODB_URI` (required): MongoDB connection string
- `AUTH_SECRET` (required): Auth.js session signing secret (`openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` (optional): public app URL used for metadata/config
- `NEXT_PUBLIC_API_URL` (optional): API base URL (defaults to `/api`)
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_PORT` / `SMTP_FROM`: email notifications (optional; falls back to `EMAIL_SERVER_*`)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`: media uploads (optional until media migration is run)
- `GOOGLE_SITE_VERIFICATION` (optional): Google Search Console verification token
- `LOGGING_ENDPOINT` (optional): remote logging endpoint (used in production)
- `SKIP_ENV_VALIDATION` (optional): set to `1` for Docker/CI builds without secrets

## Folder Structure

```
.
├─ public/
│  ├─ assests/            # Images and logos
│  └─ staticdata/         # Fallback JSON data used by pages/components
├─ scripts/               # DB seed/migration utilities (.mjs)
├─ src/
│  ├─ app/                # Next.js App Router pages + API routes
│  ├─ components/         # UI and feature components
│  ├─ config/             # Roles & permissions catalogue
│  ├─ lib/                # Shared utilities (db, auth, sanitize, rate-limit)
│  ├─ models/             # Mongoose models
│  ├─ server/             # Services, validation schemas, HTTP helpers
│  └─ types/              # Shared TypeScript types
└─ package.json
```

## Roadmap

- Add integration tests for API routes (registration, admin export, certificates)
- Re-check admin session roles against the DB on each request (currently cached in the JWT for up to 8 hours)
- Admin UI improvements (search, pagination, export filters)

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, workflow, and guidelines.

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).

## Acknowledgements

- NSDC VCET community and contributors
- Vidyavardhini College of Engineering & Technology (VCET), Vasai
- Next.js, React, Tailwind CSS, and the open-source ecosystem powering the project
