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

```env
# Robot API URL
# Set to "mock" for demo mode with simulated data
# Set to the private Tailscale HTTPS URL when robot is live
# e.g. https://roomba.<tailnet>.ts.net (not a plain IP)
NEXT_PUBLIC_ROBOT_URL=mock

# Supabase (get from project settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Access Modes

**Mock** — when `NEXT_PUBLIC_ROBOT_URL` is "mock" or unset:
- Simulated battery drain/charge
- Robot position jitters during cleaning
- Auto-return to dock at low battery
- Session history recorded

**Live Robot** — when the Pi API URL is selected via `NEXT_PUBLIC_ROBOT_URL` or Settings (stored in localStorage `roomba_robot_url`):
- Saved URLs are trimmed and trailing slashes stripped on save/load
- The Active Mode **LIVE** badge means live API mode is selected — it is configuration, not proof of physical connectivity
- Robot Connection in Settings reports the actual `/status` result

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
- Drive controls are disabled in mock mode and while the robot is offline

## Mobile Access

- Install the Tailscale app (Android/iOS), sign into the same tailnet, and enable the VPN
- Test `<robot-url>/status` directly in the phone browser first
- `Failed to fetch` means the browser cannot reach the private Pi — almost always a missing Tailscale route, not a wrong dashboard password
- The dashboard times out API calls after 5 seconds and renders the robot offline rather than spinning forever
- The green Network/Tailscale row in Settings is static and informational; Robot Connection is the actual API result

## Authentication

`src/middleware.ts` currently sets `AUTH_ENABLED = false`, so routes are not protected. The login UI supports Supabase email/password and magic link, but no password is stored in this repo. To enable auth later: set the flag to `true`, configure real Supabase env values, and set the redirect URL.

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
