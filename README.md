# Roomba Robot Dashboard

Control dashboard for a DIY autonomous robot (converted Roomba 694, Raspberry Pi 4, RPLIDAR C1, ROS 2 Jazzy).

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** — auth only (single user)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```env
# Robot API URL - set to "mock" or leave unset for mock mode
# Set to real Tailscale IP when robot is live, e.g. http://100.73.192.106:8000
NEXT_PUBLIC_ROBOT_URL=mock

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Features

- Real-time robot status (battery, state, connection)
- Control buttons (Start / Stop / Dock)
- Map view with robot position
- Camera feed placeholder
- Cleaning session history
- Settings for Pi connection

## Mock Mode

When `NEXT_PUBLIC_ROBOT_URL` is unset or set to `"mock"`, the app runs against simulated data with realistic behavior (battery drain, pose jitter, state transitions).
