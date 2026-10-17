# Tailscale is the auth

Stella has **no login page, no passwords, no sessions**. Tailscale network
membership *is* the authentication.

## How it works

1. The dashboard (`/dashboard`) reads `NEXT_PUBLIC_ROBOT_URL` — the Pi's HTTPS
   address on the tailnet, e.g. `https://stella.tail12345.ts.net`.
2. On load it opens a WebSocket to `wss://<host>/ws`
   (path override: `NEXT_PUBLIC_ROBOT_WS_PATH`).
3. If the socket opens within ~5 seconds → **LIVE** mode (mint LIVE pill in
   the top bar). The browser is on the tailnet, so the Pi is reachable, so
   the viewer is trusted.
4. If it fails or times out → **DEMO** mode (subtle "Demo" badge). All panels
   run on local demo data; every control still works, nothing breaks.
5. If `NEXT_PUBLIC_ROBOT_URL` is unset, the dashboard skips the probe and
   goes straight to demo.

Anyone King adds to his tailnet gets live control. Everyone else — including
every LinkedIn visitor — gets the interactive demo. Nothing to log into,
nothing to leak.

## Pi setup

On the Raspberry Pi (running Tailscale):

```bash
# 1. Install + join the tailnet
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Serve the robot API over HTTPS with a valid cert.
#    This is what avoids mixed-content blocks: the dashboard is HTTPS,
#    so the WebSocket must be WSS with a browser-trusted certificate.
#    `tailscale serve https` terminates TLS with a Let's Encrypt cert
#    for <machine>.<tailnet>.ts.net and forwards to localhost.
sudo tailscale serve https / http://127.0.0.1:8000

# 3. Confirm the MagicDNS name
tailscale status
# → stella  100.x.y.z  stella.tail12345.ts.net
```

Then set in Vercel (project `stella`):

- `NEXT_PUBLIC_ROBOT_URL=https://stella.tail12345.ts.net`
- `NEXT_PUBLIC_ROBOT_WS_PATH=/ws` (only if the Pi serves the socket elsewhere)

## Pi WebSocket contract (when the API exists)

The dashboard's probe (`web/src/lib/v3/store.tsx`) opens the socket and listens
for JSON state patches. Suggested message shapes:

```jsonc
// Pi → dashboard (state patch, partial)
{ "type": "state", "battery": 61, "mode": "cleaning",
  "location": { "roomId": "living-room", "label": "Living room" } }

// Pi → dashboard (door blocked — message shown verbatim, deduped by id)
{ "type": "door_blocked", "id": "evt-...", "doorId": "kitchen-door",
  "roomId": "kitchen", "message": "Kitchen door closed, couldn't enter",
  "at": "2026-10-12T12:00:00Z" }

// Dashboard → Pi (commands; no-op unless socket is OPEN)
{ "type": "drive", "dir": "up", "speed": 50 }
{ "type": "clean", "rooms": ["living-room", "kitchen"] }
{ "type": "dock" }
{ "type": "stop" }
```

Wire the parsers into `ws.onmessage` in the store when the Pi side exists.
The demo data and all UI behavior stay exactly as-is until then.

## Why not a password?

A password on a public dashboard is a phishing target and a support burden.
The tailnet already provides identity (every device is a known node) and
encryption (WireGuard). If someone isn't on the tailnet, they can't reach
the Pi at all — the demo is all they'll ever see.
