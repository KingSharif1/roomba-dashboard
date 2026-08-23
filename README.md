# Roomba Robot Dashboard

Control dashboard for a DIY autonomous robot (converted Roomba 694, Raspberry Pi 4, RPLIDAR C1, ROS 2 Jazzy).

![Dashboard Preview](docs/preview.png)

## Features

- **Real-time Status** — Battery, state, connection status with live updates
- **Control Panel** — Start/Stop cleaning, Return to dock
- **Map View** — SLAM map with robot position, no-go zones, custom routes
- **Camera Feed** — Live MJPEG stream (placeholder in mock mode)
- **History** — Cleaning session logs with coverage stats
- **Learning System** — Object verification queue for robot learning
- **Settings** — Pi connection, behavior preferences

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** — Dark cyberpunk theme
- **Supabase** — Auth + future data storage
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
# Set to real Tailscale IP when robot is live
NEXT_PUBLIC_ROBOT_URL=mock

# Supabase (get from project settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Mock Mode

When `NEXT_PUBLIC_ROBOT_URL` is "mock" or unset:
- Simulated battery drain/charge
- Robot position jitters during cleaning
- Auto-return to dock at low battery
- Session history recorded

## Real Robot API

When connected to the Pi, expects these endpoints:

```
GET  /status              → Robot status
POST /control/start       → Start cleaning
POST /control/stop        → Stop cleaning  
POST /control/dock        → Return to dock
GET  /map                 → SLAM map image
GET  /camera/stream       → MJPEG feed
WS   /live                → Real-time updates
```

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

Deploy to Vercel:

```bash
vercel
```

Or any platform supporting Next.js.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed data flow and design decisions.
