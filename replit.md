# Al-Noor Prayer Times PWA

## Overview

A full-featured Islamic Prayer Times Progressive Web App (Al-Noor / النور) built with React + Vite, Express backend, and Tailwind CSS. Supports offline mode, browser notifications, and is optimized for both mobile and 4K TV screens.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/al-noor)
- **Backend API**: Express 5 (artifacts/api-server)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Icons**: lucide-react
- **Animation**: framer-motion
- **Routing**: wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── al-noor/            # React + Vite PWA frontend (main app, served at /)
│   │   ├── public/
│   │   │   ├── manifest.json     # PWA manifest
│   │   │   ├── sw.js             # Service Worker (offline + notifications)
│   │   │   ├── favicon.svg       # Crescent moon + star icon
│   │   │   └── images/           # kaaba.png, pattern.png
│   │   └── src/
│   │       ├── context/
│   │       │   └── PrayerContext.tsx  # Global state (prayer data, countdown, lang, athan)
│   │       ├── pages/
│   │       │   ├── Home.tsx      # Main prayer times display
│   │       │   ├── Qibla.tsx     # Qibla compass (geolocation-based)
│   │       │   └── Admin.tsx     # Password-protected admin dashboard
│   │       ├── components/
│   │       │   ├── Layout.tsx    # Header, news ticker, azkar ticker
│   │       │   └── PrayerCard.tsx # Individual prayer time card
│   │       └── App.tsx           # Routes: /, /qibla, /admin
│   └── api-server/         # Express API server (served at /api)
│       └── src/
│           ├── data/
│           │   └── prayer_data.json  # Prayer times & content data store
│           └── routes/
│               └── prayer.ts         # /prayer-data, /admin/prayer-data, /admin/verify
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM (available if DB needed)
└── scripts/                # Utility scripts
```

## Features

- **Prayer Times**: 6 daily prayers displayed as cards (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
- **Real-time Countdown**: Live HH:MM:SS countdown to next prayer
- **Dynamic Backgrounds**: Background changes based on current prayer period
- **TV Mode**: Auto-scales for large 4K screens with toggle button
- **Audio Athan**: Toggle to play Athan sound at prayer time
- **Qibla Compass**: Uses Geolocation API to calculate Qibla direction
- **Hijri Calendar**: Shows current Hijri date via Intl.DateTimeFormat
- **Daily Azkar**: Scrolling ticker at bottom of screen
- **News Ticker**: Mosque announcements scrolling ticker
- **Language Toggle**: Arabic (RTL) / English (LTR) with persistent preference
- **Admin Dashboard**: Password-protected at /admin to update prayer data
- **PWA**: manifest.json + Service Worker for offline mode and notifications

## Admin Access

- URL: /admin
- Default password: `admin123`
- Change via `ADMIN_PASSWORD` environment variable

## API Endpoints

- `GET /api/prayer-data` — Returns all prayer data
- `PUT /api/admin/prayer-data` — Update prayer data (requires adminPassword in body)
- `POST /api/admin/verify` — Verify admin password

## Data

Prayer times and content are stored in `artifacts/api-server/src/data/prayer_data.json`. The admin dashboard allows editing this data through the UI.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- Root commands: `pnpm run build`, `pnpm run typecheck`
