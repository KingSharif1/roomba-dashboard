# Stella

## Overview

Architecture for Stella, King Sharif's robot dashboard (Roomba 694 + Raspberry Pi 4 + RPLIDAR C1 + ROS 2 Jazzy).

Detailed project docs: https://github.com/KingSharif1/ARK/tree/main/projects/roomba-dashboard

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

### Data Layer

Room, door, session, note, zone, and route seed lives in `data/` (`types.ts`, `demo.ts`, `catalog.ts`). The dashboard reads it through `web/src/lib/`.

### App code (`web/src/lib/`)

- **`types.ts`** — TypeScript interfaces for all data shapes
- **`robot.ts`** — Legacy facade over the shared session. Browser-saved URLs are ignored.
- **`robot-session.ts`** — One demo stream or one live socket for the whole app
- **`mockRobot.ts`** — Simulated robot: battery, drive odometry, sample collections, link drops
- **`access.ts`** — Owner-email gate. `OWNER_EMAIL` is compared on the server; the robot URL is omitted for everyone else.
- **`connection/`** — WebSocket reconnect (backoff + jitter, stale heartbeat, resume on visibility/online) and emergency stop
- **`web/src/hooks/use-robot.ts`** — Public state and commands for the UI
- **`utils.ts`** — Formatting helpers (time, duration, etc.)
- **`web/src/hooks/use-robot-mode.ts`** — `true` while the session is in demo mode

### Supabase (`web/src/lib/supabase/`)

- **`client.ts`** — Browser-side Supabase client
- **`server.ts`** — Server-side Supabase client
- **`middleware.ts`** — Auth session management

### Components (`web/src/components/`)

- **`ui/`** — Reusable UI primitives (Button, Card, etc.)
- **`dashboard/`** — Dashboard-specific components
- **`dashboard/drive-pad.tsx`** — Manual Drive pad (hold-to-drive buttons, WASD/arrows keyboard, speed slider, dead-man stop)
- **`layout/`** — Layout components (Header)

### Pages (`web/src/app/`)

- **`/`** — Main dashboard (status, controls, map, camera)
- **`/map`** — Full map view with no-go zones and route editing
- **`/camera`** — Camera feed view
- **`/history`** — Cleaning session history
- **`/learning`** — Object learning/verification queue
- **`/settings`** — Configuration (Pi address, preferences)
- **`/login`** — Authentication

## Environment Variables

```env
ROBOT_URL                      # server-only Tailscale origin; unset → demo
OWNER_EMAIL                    # the one email allowed to control the real robot
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL (owner sign-in)
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
```

`NEXT_PUBLIC_ROBOT_URL` is not read. Putting the tailnet host in a public env var would ship it to every visitor.

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

The dashboard sends a command every 100 ms while a direction is held and sends zero velocity when released or cancelled. Blur, unmount, and the STOP button call emergency stop. Drive is paused while the link is down. STOP stays enabled. The ROS driver's 0.2-second command latch acts as a dead-man stop if commands stop arriving.

## Connection Semantics

- **Active Mode LIVE** is configuration only — it means the live API URL is selected, not that anything is reachable.
- **API reachable** means the Pi's HTTP API responded; `/status` can return 200 while the robot reports `connected: false`.
- **Robot connected** (`RobotStatus.connected === true`) requires fresh `/odom` data seen by the Pi within the last 2 seconds.
- An unexpected `/live` WebSocket close marks the UI disconnected (`connected: false`, `state: "error"`) and schedules a reconnect with jittered backoff. Silence longer than 3 seconds (the Pi sends a frame every 0.5 seconds) is treated the same way. A handshake that does not open within 5 seconds is the same failure. After three failures the label reads "Robot offline" while retries continue. Tab visibility and the browser `online` event reconnect immediately. Cleanup-initiated closes do not.
- Live outages (Tailscale off, timeout, DNS, TLS, socket drop) raise one sticky toast: "Robot unreachable. Check Tailscale." It is not repeated for the same outage, and it clears on reconnect with a short "Reconnected" toast. Demo mode, including simulated drops, never shows that toast.
- The same toast stack carries command failures (including 403 and 401), "Stopped" after a confirmed stop, sign-in failure, session expiry, and a live robot error, low battery, or stuck flag when the link is up. Successes dismiss themselves. Errors stay until the cause clears or the visitor dismisses them.

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

When the visitor is not the owner, or `ROBOT_URL` is unset:

- Battery drains during cleaning (~0.1%/sec) and while driving (~0.08%/sec)
- Battery charges while docked (~0.2%/sec)
- Drive commands integrate odometry in a 4 meter room drawn in the 0–1 map frame
- Robot position jitters during cleaning when no drive command is held
- Auto-returns to dock at 15% battery
- Sessions are recorded when cleaning stops
- The link drops briefly on a timer, and `simulateDrop()` forces Reconnecting… then Robot offline

## Authentication Status

Visitors are not redirected to `/login`. Demo mode is the default.

Live control requires a Supabase session whose email matches `OWNER_EMAIL` (case-insensitive, server-side `getUser()`). The decision is `GET /api/access`. Mutating and status proxy calls go through `POST|GET /api/robot/*`, which returns 403 for non-owners and never forwards the request. The owner's browser still talks to the Pi directly after that check, because the Pi is tailnet-only and the hosting server usually cannot reach it.

`web/src/proxy.ts` refreshes the Supabase cookie when the project env is set. It does not gate pages.

## UI contract

`useRobot()` is the seam for the visual redesign. `connection.label` is `Connected`, `Connecting…`, `Reconnecting…`, `Robot offline`, or `Demo mode`. `commands.stop()` always fires immediately. See the README section "Data layer for the visual redesign".

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
