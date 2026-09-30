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
                    │  │ (simulated) │    │ (Tailscale  │        │
                    │  │             │    │  HTTPS/WSS) │        │
                    │  └─────────────┘    └──────┬──────┘        │
                    │       MOCK                 │ LIVE           │
                    └────────────────────────────┼────────────────┘
                                                 ▼
                    FastAPI/rclpy → ROS 2 /cmd_vel + /odom
                    → create_driver → USB MEGA passthrough
                    → Roomba OI (serial 115200)
```

## Key Files

### Data Layer (`src/lib/`)

- **`types.ts`** — TypeScript interfaces for all data shapes
- **`robot.ts`** — Main API layer, switches between mock and real based on `NEXT_PUBLIC_ROBOT_URL`
- **`mockRobot.ts`** — Simulated robot behavior with realistic state changes
- **`utils.ts`** — Formatting helpers (time, duration, etc.)
- **`src/hooks/use-robot-mode.ts`** — `useSyncExternalStore`-backed mock/live mode; hydration-safe read of the localStorage robot URL

### Supabase (`src/lib/supabase/`)

- **`client.ts`** — Browser-side Supabase client
- **`server.ts`** — Server-side Supabase client
- **`middleware.ts`** — Auth session management

### Components

- **`components/ui/`** — Reusable UI primitives (Button, Card, etc.)
- **`components/dashboard/`** — Dashboard-specific components
- **`components/dashboard/drive-pad.tsx`** — Manual Drive pad (hold-to-drive buttons, WASD/arrows keyboard, speed slider, dead-man stop)
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
NEXT_PUBLIC_ROBOT_URL     # "mock" or private Tailscale URL (e.g., https://roomba.<tailnet>.ts.net)
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
POST /drive               → Manual velocity command (`{ linear, angular }`)
GET  /map                 → Current SLAM map
GET  /pose                → Robot position
GET  /sessions            → Cleaning history
GET  /camera/stream       → MJPEG video feed
WS   /live                → Real-time status updates
```

## Manual Drive Flow

```text
Pointer/keyboard input → DrivePad → robot.drive(linear, angular)
→ POST /drive → Pi velocity clamping → ROS /cmd_vel → create_driver → Roomba
```

The dashboard sends a command every 100 ms while a direction is held and sends zero velocity when released, cancelled, blurred, disconnected, or unmounted. Controls are disabled in mock mode and while the robot is offline. The ROS driver's 0.2-second command latch acts as a dead-man stop if commands stop arriving.

## Connection Semantics

- **Active Mode LIVE** is configuration only — it means the live API URL is selected, not that anything is reachable.
- **API reachable** means the Pi's HTTP API responded; `/status` can return 200 while the robot reports `connected: false`.
- **Robot connected** (`RobotStatus.connected === true`) requires fresh `/odom` data seen by the Pi within the last 2 seconds.
- An unexpected `/live` WebSocket close marks the UI disconnected (`connected: false`, `state: "error"`) without a console error overlay; cleanup-initiated closes do not.

## Initialization and Offline Behavior

- The dashboard fires `/status`, `/zones`, and `/sessions` together with `Promise.allSettled`; fulfilled results are kept even if others fail.
- All `fetchApi` calls carry a default 5-second `AbortSignal.timeout` (caller-provided signals are preserved).
- If `/status` fails, the dashboard marks the robot disconnected and renders the offline UI — no infinite `INITIALIZING SYSTEMS` spinner.

## Private Mobile Access

- The Pi API is tailnet-only: the viewing device (Android/iOS) must run Tailscale on the same tailnet with the VPN enabled.
- Opening `<robot-url>/status` directly in the device browser is the fastest diagnostic.
- CORS origins on the Pi are the production domain plus localhost.
- `Failed to fetch` in the browser generally means there is no tailnet route to the Pi — not an auth problem.

## Live Runtime and Startup

No systemd/boot services exist yet — powering on the Pi alone does not bring the API up. Manual order:

```bash
# Physical: press Clean twice to wake the Roomba
source ~/robot_ws/install/setup.bash
ros2 launch create_bringup create_2.launch config:=/home/king/roomba.yaml
```

Separate terminal:

```bash
source ~/robot_ws/install/setup.bash
python3 ~/robot_api.py
```

Verify with `ros2 topic hz /odom` (~10 Hz) and GET `https://roomba.<tailnet>.ts.net/status` (`connected: true`).

## Mock Mode Behavior

When `NEXT_PUBLIC_ROBOT_URL` is "mock" or unset:

- Battery drains during cleaning (~0.1%/sec)
- Battery charges while docked (~0.2%/sec)
- Robot position jitters during cleaning
- Auto-returns to dock at 15% battery
- Sessions are recorded when cleaning stops

## Authentication Status

`src/middleware.ts` currently sets `AUTH_ENABLED = false`, so route protection is bypassed. The `/login` UI (Supabase email/password and magic link) exists, and session helpers live in `src/lib/supabase/`, but no guard runs today.

Before enabling:

1. Set real `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` values
2. Configure the Supabase redirect URL for the deployed domain
3. Set `AUTH_ENABLED = true` in `src/middleware.ts`
4. Test cookie persistence and the magic-link flow, including on mobile

## Known Operational Notes

- `Unknown mode detected` from create_driver is a known noisy firmware/driver mismatch — cosmetic while `/odom` streams ~10 Hz and driving works.
- `failed to receive data from Create` is fatal: the serial OI is not answering — wake the Roomba and relaunch the driver.
- Serial layout: MEGA passthrough on `/dev/ttyACM0`, RPLIDAR on `/dev/ttyUSB0`.
- Full mode disables cliff/lift safety — only drive on open floor away from stairs.
- The Network/Tailscale row in Settings is static and informational; Robot Connection is the real API result.

## Future: Supabase Tables (not applied)

These tables are planned and do not exist yet.

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
