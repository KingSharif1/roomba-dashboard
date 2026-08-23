# Roomba Dashboard Architecture

## Overview

A Next.js dashboard for controlling a DIY autonomous robot (Roomba 694 + Raspberry Pi 4 + RPLIDAR C1 + ROS 2 Jazzy).

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Pages     │───▶│  lib/robot  │───▶│ Mock/Real   │         │
│  │  (React)    │◀───│   (API)     │◀───│   Switch    │         │
│  └─────────────┘    └─────────────┘    └──────┬──────┘         │
│                                                │                 │
└────────────────────────────────────────────────┼─────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            ▼                │
                    │  ┌─────────────┐    ┌─────────────┐        │
                    │  │ mockRobot   │    │  Real Pi    │        │
                    │  │ (simulated) │    │  (HTTP/WS)  │        │
                    │  └─────────────┘    └─────────────┘        │
                    │       MOCK               LIVE               │
                    └─────────────────────────────────────────────┘
```

## Key Files

### Data Layer (`src/lib/`)

- **`types.ts`** — TypeScript interfaces for all data shapes
- **`robot.ts`** — Main API layer, switches between mock and real based on `NEXT_PUBLIC_ROBOT_URL`
- **`mockRobot.ts`** — Simulated robot behavior with realistic state changes
- **`utils.ts`** — Formatting helpers (time, duration, etc.)

### Supabase (`src/lib/supabase/`)

- **`client.ts`** — Browser-side Supabase client
- **`server.ts`** — Server-side Supabase client
- **`middleware.ts`** — Auth session management

### Components

- **`components/ui/`** — Reusable UI primitives (Button, Card, etc.)
- **`components/dashboard/`** — Dashboard-specific components
- **`components/layout/`** — Layout components (Header)

### Pages (`src/app/`)

- **`/`** — Main dashboard (status, controls, map, camera)
- **`/map`** — Full map view with no-go zones and route editing
- **`/camera`** — Camera feed view
- **`/history`** — Cleaning session history
- **`/learning`** — Object learning/verification queue
- **`/settings`** — Configuration (Pi address, preferences)
- **`/login`** — Authentication

## Environment Variables

```env
NEXT_PUBLIC_ROBOT_URL     # "mock" or real Pi URL (e.g., http://100.73.192.106:8000)
NEXT_PUBLIC_SUPABASE_URL  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
```

## Real Robot API Contract

When `NEXT_PUBLIC_ROBOT_URL` points to the Pi:

```
GET  /status              → RobotStatus
POST /control/start       → Start cleaning
POST /control/stop        → Stop cleaning
POST /control/dock        → Return to dock
GET  /map                 → Current SLAM map
GET  /pose                → Robot position
GET  /sessions            → Cleaning history
GET  /camera/stream       → MJPEG video feed
WS   /live                → Real-time status updates
```

## Mock Mode Behavior

When `NEXT_PUBLIC_ROBOT_URL` is "mock" or unset:

- Battery drains during cleaning (~0.1%/sec)
- Battery charges while docked (~0.2%/sec)
- Robot position jitters during cleaning
- Auto-returns to dock at 15% battery
- Sessions are recorded when cleaning stops

## Authentication Flow

1. User visits any page
2. Middleware checks Supabase session
3. No session → redirect to `/login`
4. Login via email/password or magic link
5. Session stored in cookies
6. Protected pages accessible

## Future: Supabase Tables

```sql
-- No-go zones
CREATE TABLE no_go_zones (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  points JSONB,  -- [{x, y}, ...]
  created_at TIMESTAMPTZ
);

-- Custom routes
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  waypoints JSONB,  -- [{id, x, y, order}, ...]
  created_at TIMESTAMPTZ
);

-- Learning items
CREATE TABLE learning_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  image_url TEXT,
  location JSONB,
  suggested_label TEXT,
  user_label TEXT,
  status TEXT,  -- pending, verified, dismissed
  detected_at TIMESTAMPTZ
);

-- Settings
CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  pi_address TEXT,
  auto_return BOOLEAN,
  low_battery_threshold INTEGER
);
```
