# Roomba Robot Dashboard

Control dashboard for a DIY autonomous robot (converted Roomba 694, Raspberry Pi 4, RPLIDAR C1, ROS 2 Jazzy).

![Dashboard Preview](docs/preview.png)

## Features

- **Real-time Status** — Battery, state, connection status with live updates
- **Control Panel** — Start/Stop cleaning, Return to dock
- **Manual Drive** — Hold-to-drive arrows, STOP, adjustable speed, arrow/WASD keyboard control
- **Map View** — SLAM map with robot position, no-go zones, custom routes
- **Camera Feed** — Live MJPEG stream (placeholder in mock mode)
- **History** — Cleaning session logs with coverage stats
- **Learning System** — Object verification queue for robot learning
- **Settings** — Pi connection, behavior preferences

## Stack

- **Next.js 16.3.2** (App Router, React 19, TypeScript)
- **Tailwind CSS** — Dark cyberpunk theme
- **Supabase** — Auth UI + future data storage (route enforcement currently disabled)
- **Lucide Icons**

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env.local`. Do not commit real values.

```env
# Server-only Tailscale origin of the Pi. Not embedded in the client bundle.
# Example: https://roomba.<tailnet>.ts.net
# Leave unset to force demo mode.
ROBOT_URL=

# The one email allowed to control the real robot. Never hardcode this.
OWNER_EMAIL=

# Supabase (project settings → API). Required only for owner sign-in.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_ROBOT_URL` is no longer read. A URL saved in the browser (`localStorage`) cannot unlock the robot.

## Access Modes

**Demo** — the default for every visitor, and for the owner when `ROBOT_URL` is unset:
- Simulated battery drain while cleaning (~0.1%/s) and charge while docked (~0.2%/s)
- Drive commands move the pose (4 m room drawn in the existing 0–1 map)
- Sample sessions, zones, routes, and learning items
- The link drops on its own (and via "Simulate drop") so the label cycles Demo mode → Reconnecting… → Robot offline → Demo mode
- Auto-return to dock at 15% battery

**Live robot** — only when the server session email matches `OWNER_EMAIL` and `ROBOT_URL` is set:
- The server returns the robot URL after `supabase.auth.getUser()`. Visitors never receive it.
- The browser then opens the Pi directly, because the Pi is on a private tailnet the hosting server usually cannot reach.
- `POST /api/robot/*` is a second server-side gate and rejects non-owners with 403.
- Active mode is configuration plus that gate. The connection label is the actual link.

## Data layer for the visual redesign

The redesign should read state from `useRobot()` (`src/hooks/use-robot.ts`) inside `RobotProvider` (already mounted in the root layout). Do not open a second WebSocket.

```tsx
const {
  status,       // RobotStatus from src/lib/types.ts
  connection,   // { phase, label, linkUp, robotReady, attempt, demo }
  access,       // { role: "owner" | "visitor" | "unknown", email, demo, robotConfigured }
  zones, routes, sessions, learning,
  loading,
  mapUrl, cameraUrl,
  commands,     // { start, stop, dock, drive(linear, angular) }
  simulateDrop, // demo only
} = useRobot();
```

`connection.label` is the string to show: `Connected`, `Connecting…`, `Reconnecting…`, `Robot offline`, or `Demo mode`. `commands.stop()` is the emergency stop. It is safe while the link is down. `commands.drive(linear, angular)` uses m/s and rad/s. `ConnectionStatus` (`src/components/connection/connection-status.tsx`) is a small status row if you do not want to draw the label yourself.

`useRobotMode()` still returns `true` in demo mode for older components.

## Live Robot Runtime

The Pi only serves the API while its runtime chain is up. The viewing device must run Tailscale on the same tailnet; a phone browser should be able to open `<robot-url>/status` directly.

Required chain: Roomba awake → MEGA serial passthrough on `/dev/ttyACM0` at 115200 → ROS `create_driver` → `robot_api.py` → Tailscale Serve.

Startup order (manual — no boot services yet; powering the Pi alone is not enough):

```bash
# Physical: press Clean twice to wake the Roomba
source ~/robot_ws/install/setup.bash
ros2 launch create_bringup create_2.launch config:=/home/king/roomba.yaml
```

In a separate terminal:

```bash
source ~/robot_ws/install/setup.bash
python3 ~/robot_api.py
```

Verify with `ros2 topic hz /odom` (expect ~10 Hz) and a browser GET to `https://roomba.<tailnet>.ts.net/status` expecting `connected: true`.

## Manual Drive Safety

```text
Dashboard → POST /drive every 100 ms → Pi clamps ±0.30 m/s, ±1.5 rad/s → /cmd_vel → Roomba
```

- Zero velocity is sent on release, pointer cancellation, window blur, disconnect, or unmount
- The ROS driver's 0.2-second command latch is a dead-man stop if commands stop arriving
- Full mode disables cliff/lift safety — drive on open floor away from stairs
- Drive controls are paused while the link is down. STOP stays enabled, including in demo mode.

## Mobile Access

- Install the Tailscale app (Android/iOS), sign into the same tailnet, and enable the VPN
- Test `<robot-url>/status` directly in the phone browser first
- `Failed to fetch` means the browser cannot reach the private Pi — almost always a missing Tailscale route, not a wrong dashboard password
- The dashboard times out API calls after 5 seconds and renders the robot offline rather than spinning forever
- The green Network/Tailscale row in Settings is static and informational; Robot Connection is the actual API result

## Authentication

The dashboard stays open so visitors can use demo mode. Live controls require Supabase sign-in, and the server allows exactly `OWNER_EMAIL`.

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. In the Supabase dashboard, add `https://<your-domain>/auth/callback` as a redirect URL.
3. Set `OWNER_EMAIL` to that person's email and `ROBOT_URL` to the tailnet origin.
4. Sign in at `/login` (password or magic link). Any other email is signed out and stays on the demo.

`src/proxy.ts` only refreshes the Supabase cookie. It does not force a login. Authorization for the robot is `GET /api/access` and `POST /api/robot/*`, both of which call `supabase.auth.getUser()` on the server.

## Real Robot API

When connected to the Pi, expects these endpoints:

```
GET  /status              → Robot status
POST /control/start       → Start cleaning
POST /control/stop        → Stop cleaning  
POST /control/dock        → Return to dock
POST /drive               → Manual velocity command (`{ linear, angular }`)
GET  /map                 → SLAM map image
GET  /camera/stream       → MJPEG feed
GET  /zones               → No-go zones
GET  /routes              → Custom routes
GET  /learning            → Learning items
GET  /sessions            → Cleaning history
WS   /live                → Real-time updates
```

Collections not yet built on the Pi (`/zones`, `/routes`, `/learning`, `/sessions`) currently return empty arrays.

Connection semantics: HTTP 200 from `/status` means the API is reachable — the robot itself may still report `connected: false`. `RobotStatus.connected` is `true` only when the Pi has seen fresh `/odom` data within the last 2 seconds.

## Troubleshooting

| Symptom | Meaning / fix |
|---------|---------------|
| `INITIALIZING SYSTEMS` forever | Old behavior — current build times out after 5 s. Verify latest deployment / clear cache. |
| `Failed to fetch` on phone | Enable Tailscale on the device; test `/status` directly in the browser. |
| API reachable — robot offline | Wake the Roomba (Clean ×2) and relaunch `create_driver`. |
| `failed to receive data from Create` | Roomba asleep / serial OI not answering — wake and relaunch; verify MEGA on `/dev/ttyACM0` passthrough. |
| `Unknown mode detected` | Known noisy firmware/driver mismatch; cosmetic while `/odom` ~10 Hz and driving works. Investigate `/mode` later. |
| WebSocket disconnected | Verify Tailscale, the API process, and `/live`; the UI marks the robot offline without a dev overlay. |

## Project Structure

```
src/
├── app/                  # Next.js pages
│   ├── page.tsx          # Dashboard
│   ├── map/              # Map view
│   ├── camera/           # Camera view
│   ├── history/          # Session history
│   ├── learning/         # Object learning
│   ├── settings/         # Configuration
│   └── login/            # Authentication
├── components/
│   ├── ui/               # Reusable components
│   ├── dashboard/        # Dashboard widgets
│   └── layout/           # Layout components
└── lib/
    ├── robot.ts          # API layer (mock/real switch)
    ├── mockRobot.ts      # Simulated robot
    ├── types.ts          # TypeScript types
    └── supabase/         # Auth setup
```

## Deployment

Pushes to `master` auto-deploy via Vercel. Current shipped commits: `e6b171e` (Manual Drive) and `4a55f68` (mobile initialization fallback).

Or any platform supporting Next.js.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed data flow and design decisions.
