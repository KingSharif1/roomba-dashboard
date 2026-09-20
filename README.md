# Roomba Robot Dashboard

**Live ops dashboard for a DIY Roomba — dock, runs, map, camera, controls.**

Live: [roomba.kingsharif.com](https://roomba.kingsharif.com)

---

## Case study

| | |
|---|---|
| **Problem** | Hardware robot telemetry is useless without a clear operator UI. |
| **Built** | Next.js dashboard for dock status, run history, map/camera views, and controls over a ROS 2 / Raspberry Pi stack (Roomba 694, RPLIDAR C1). |
| **Result** | Deployed dashboard showing hardware-adjacent full-stack chops. |
| **Stack** | Next.js 15, TypeScript, Tailwind, Supabase, ROS 2 Jazzy |

---

## Features

- **Real-time Status** — Battery, state, connection
- **Control Panel** — Start/Stop cleaning, Return to dock
- **Map View** — SLAM map with robot position, no-go zones, routes
- **Camera Feed** — Live MJPEG stream (mock mode supported)
- **History** — Cleaning session logs with coverage stats
- **Learning System** — Object verification queue
- **Settings** — Pi connection, behavior preferences

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

```env
NEXT_PUBLIC_ROBOT_URL=mock
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Set `NEXT_PUBLIC_ROBOT_URL=mock` for simulated data, or a Tailscale IP when the robot is live.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data flow.
