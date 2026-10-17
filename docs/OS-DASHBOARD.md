# Stella OS dashboard (`/demo`)

The approved interactive mock, ported into the real app. Home = live map + one control card + app grid; every
app (Camera/LiDAR, Map, Parts 3D, Logs, TV, Climate, Settings, Voice) opens full screen.

## Where things live
| Path | What |
|---|---|
| `web/src/app/demo/page.tsx` | Route. Client-only (`ssr:false`) so clocks / LiDAR don't cause hydration mismatches |
| `web/src/components/os/template.tsx` | **Generated** from the mock (markup). Change markup here |
| `web/src/components/os/os.css` | Mock styles (scoped under `.sf`) |
| `web/src/components/os/stella-os-impl.tsx` | Behaviour: simulator (demo) + live bridge. `@ts-nocheck` on purpose (ported sim) |
| `web/src/components/os/stella-os.tsx` | Hooks the OS to `useV3Robot()` (connection, battery, mode, clean/dock/wake/motors, voice) |
| `web/src/app/demo/classic/page.tsx` | The previous Design F dashboard, kept at `/demo/classic` |
| `pi/stella_ext_router.py` | New Pi endpoints (see below). **Not deployed or tested on the Pi yet** |

## Demo vs live
* `connection === "live"` (Pi WebSocket opened → on the tailnet): header shows **King**; the simulator's motion is off;
  battery / mode come from WS `/ws` state frames; every control calls the Pi.
* Otherwise: header shows **Demo** and the built-in simulator runs everything (this is what a Vercel preview shows).
* Demo-only things (state simulator chips, "Simulate no internet") are hidden when live.

## Control → endpoint map (live)
| UI | Call |
|---|---|
| Clean | `POST /control/start` (+ `POST /clean` motors on) — *the store did not send start before; fixed* |
| Stop | `POST /control/stop` + `POST /drive {0,0}` |
| Dock | `POST /control/dock` (UI shows "returning" until the Pi reports `docked`) |
| Wake | `POST /wake` |
| Vacuum / brushes | `POST /clean {vacuum, main_brush, side_brush}` |
| Stick / pad | `POST /drive {linear, angular}` ≤ 7 Hz (0.3 m/s, 1.2 rad/s × speed %), zero on release |
| Go to room | `POST /navigate {target, zones}` — **501 until Nav2 exists**; UI says "can't navigate yet" |
| No-go zones | `GET/POST /zones` `{zones:[{x,y,w,h,n}]}` (labels = `n`) |
| Settings / suction / brain | `GET/POST /settings` |
| Logs | `GET /logs?since=<ms>` → `{logs:[{ts,t,src,lv,m}]}` |
| TV remote | `POST /roku/key {key, tv}`, `POST /roku/launch {app, tv}`, `GET /tv/status` (existing) |
| Climate | `GET/POST /climate {set, mode, eco, units}` — stub; **Nest link not built** (Matter or Google SDM) |
| Pose | `GET /pose` → `{x,y,theta}` metres; mapped to the floor plan at 50 u/m from the dock — needs calibration |
| Voice | Browser SpeechRecognition → `/api/stella/chat` (Claude) → `runCommand()` for TV/drive/dock; falls back to on-device intents; replies via browser TTS |

Settings, zones, room names, theme, brain and thermostat choices are also kept in `localStorage["stella-os"]`.

## Known gaps (honest list)
* Floor plan / rooms / walls are still the mock's apartment; real LiDAR map + room detection is not wired.
* Camera tab says "No camera connected" (Pi Camera isn't detected). LiDAR view is simulated until `/scan` exists.
* Parts panel numbers (CPU temp, volts, currents) are static text, not telemetry.
* Pi endpoints in `pi/stella_ext_router.py` are untested on hardware. Nest, Nav2 and object labelling are not built.
* Vercel preview shows Demo mode (no tailnet). MCP read access to the Vercel project returned 403 for the team scope.

## Dev notes
`npm run build` needs network for Google Fonts (Geist, Schibsted, JetBrains Mono). Regenerating the template: the
converter lived outside the repo; edit `template.tsx` directly from now on.
