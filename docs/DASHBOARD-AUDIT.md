# Stella Dashboard Audit — `/dashboard` (v3)

**Date:** 2026-10-12
**Scope:** `src/app/dashboard/page.tsx` + `src/components/v3/*` + `src/lib/v3/*`
**Method:** Full code read of every file in the render path. No guessing.

---

## 1. Every interactive element — does it work?

### Top bar (`top-bar.tsx`)
| Element | Works? | What it does |
|---|---|---|
| Mic button | ✅ | Toggles voice demo loop: idle → listening (2.5s) → speaking (3.2s, hardcoded line) → idle. Logo animates per state. No real mic/STT. |
| Battery % display | ✅ (display) | Shows live `battery` from store; border/color changes when docked. Not a button. |
| Settings button | ✅ | Switches view to Settings. |
| Status light + LIVE/Demo pill | ✅ (display) | Green pulsing + LIVE pill when `connection==="live"`; amber + "Demo" badge otherwise. |

### Navigation (`side-nav.tsx`)
| Element | Works? |
|---|---|
| Home / History / Learning / Settings (desktop rail + mobile bottom nav) | ✅ All four switch `view` state and render the matching view. Learning tab has a hardcoded badge "2". |

### Map section (`page.tsx` MapSection + `floor-map.tsx`)
| Element | Works? | Notes |
|---|---|---|
| Mobile collapse header ("Floor plan") | ✅ | Toggles map visibility on mobile only; desktop map always open. |
| Zoom in / out / recenter | ✅ | `zoom` state 0.6–2.0, recenter resets to 1. Pan is NOT reset by recenter (minor). |
| Drag-to-pan | ✅ | Pointer events, scaled to viewBox units. |
| Bird's-eye / First-person toggle | ⚠️ **STUB** | Button highlights, but the SVG render does **not** change — `view` state is never used in the drawing code. First-person POV does not exist. |
| 3D link | ✅ | Navigates to `/3d`. |
| Voice status chip | ✅ (display) | Appears while listening/speaking with animated dots + transcript line. |
| Camera thumbnail (bottom-right) | ⚠️ **Fake** | CSS-only animated color bars (`v3-cam-drift`), "live" label. No real frames. Expand icon is decorative (no onClick). |

### Clean panel (`clean-panel.tsx`)
| Element | Works? |
|---|---|
| All rooms / Stop / Dock | ✅ All call `cleanMode()` → updates mode, location, telemetry. |
| 6 room buttons (Living, Kitchen, Dining, Setup Room, Bedroom, Hallway) | ✅ Toggle `targetRooms`, set location, set mode=cleaning. Tapping **Kitchen** fires the door-blocked toast (only path). |

### Drive panel (`drive-panel.tsx`)
| Element | Works? |
|---|---|
| Pad / Stick toggle | ✅ Switches control UI. |
| D-pad: Forward/Left/Stop/Right/Back | ✅ Call `drive(dir)` → mode=cleaning, heading updates, `dx`/`dy` marker offset moves on map (clamped ±48). |
| Joystick ("stick" mode) | ⚠️ **Visual only** | Knob position reflects `dx`/`dy` from d-pad use, but the stick itself is **not draggable** — no pointer handlers. |
| Speed slider | ✅ | Sets speed 0–100, gradient fill updates. |
| Speed presets 25/50/75/100 | ✅ |

### Battery panel (`battery-panel.tsx`)
Collapsible ✅. Content is **display-only** (no buttons): ring gauge with %, charging/discharging label, sparkline from `demoBatteryHistory`, and detail rows — Status, Voltage (16.4V), Runtime (time left / time to full), Health 92% · 214 cycles, Last full charge. Matches the requested expanded details. Data is **hardcoded** in `demo.ts` (`demoBatteryDetail`) except the % ring which follows live `battery` state.

### Timeline panel (`timeline-panel.tsx`)
| Element | Works? |
|---|---|
| Per-event dismiss (X) | ✅ | Adds id to `timelineHidden`. |
| Event action buttons ("Keep away", "Ignore") | ✅ | Both just dismiss the event (same handler). |
| Ambient events | ✅ | While cleaning, a new event is prepended every 75s (capped at 8). |

### Door toast (`door-toast.tsx`)
✅ Renders only when `doorEvent` is set (Kitchen tap while its door is closed). Dismiss button works. **Does not fire on initial load** — confirmed, `doorEvent` initializes to `null`.

### Settings view (`settings-view.tsx`)
5 toggles. **Sound-triggered recording** is wired to the store (default OFF ✅). The other 4 (Auto schedule, Quiet hours, Door-blocked alerts, Learning) are **local `useState` only** — they toggle visually but don't persist and don't affect anything.

### History view (`history-view.tsx`)
Stats row (hardcoded: 5 runs, 3h10m, 152m²) + 5 run rows. **Run rows are `<button>`s with no `onClick`** — dead. Visual only.

### Learning view (`learning-view.tsx`)
Fully static content (3 hardcoded insight cards). No interactivity.

### Connection bar (`connection-bar.tsx`, mobile only)
Display only. Shows Tailscale / Pi / Link with dot + label (`ok`/`…`/`off`/`demo`). Fixed above the mobile bottom nav.

---

## 2. Voice mode

**Exists as UI simulation, not a real pipeline.**

- `VoiceState = "idle" | "listening" | "speaking"` in `types.ts`.
- Mic button → `toggleListening()` in `store.tsx`: timers drive listening (2.5s) → speaking (3.2s, shows hardcoded line *"On it — finishing the living room, then the kitchen."*) → idle. Tapping mid-cycle cancels.
- Logo reacts: `v3-logo-listen` / `v3-logo-speak` CSS animations; also `v3-logo-clean` (pulse while cleaning) and `v3-logo-charge` (breathe while docked) — the requested logo reactions exist.
- Voice chip on the map shows listening/speaking states.
- Sound-triggered recording toggle: default **OFF** ✅, wired to store, explicitly labeled "no audio is captured yet (UI preview)".
- **Missing for real:** mic stream capture, STT (faster-whisper), intent routing, TTS (piper). The store has a comment block marking exactly where these hook in (`startListening → open mic stream → STT; onTranscript → intent router → speak() → TTS`), and the state transitions are designed to stay identical when the Pi arrives.

## 3. Camera

**No real camera path in the v3 dashboard.**

- The only camera surface is the map's bottom-right thumbnail: a CSS `v3-cam-drift` animation over colored divs with a "live" label. No `<img>`, no `<video>`, no WebSocket, no polling.
- `src/components/dashboard/camera-view.tsx` (old dashboard) has a `CameraView` with `streamUrl?` prop and LIVE/OFFLINE states, but it is **not imported anywhere in the v3 demo** — dead code path.
- **For the Pi:** needs a new component. Recommended path per prior research: MediaMTX on Pi → WHEP in browser (`<video>` element), MJPEG snapshot as fallback. The thumbnail slot in `floor-map.tsx` is the natural mount point; the "Expand" icon there currently does nothing and should open a fullscreen camera view.

## 4. Lidar / map data

- **Map geometry is 100% hardcoded**: `zones` array in `floor-map.tsx` (8 rects, SVG units, `viewBox="0 0 400 320"`). No occupancy grid, no scan points, no `/scan` ingestion.
- **No LaserScan pipeline exists.** There is no code that accepts `sensor_msgs/LaserScan`, downsamples to bins, or renders points. The store's WS `onmessage` handles only `type: "state"` and `type: "door_blocked"`.
- **First-person POV: not implemented.** The Bird's-eye/First-person toggle is a visual stub (see §1). A real FP view would need either (a) a projected "robot's-eye" SVG transform, or (b) the actual camera stream — neither exists.
- The cleaning path, room highlight, and marker are all decorative/demo-driven, not derived from sensor data.

## 5. Data flow — demo/live interchangeability

**This is the strongest part of the architecture. It already does what was asked.**

```
demo.ts (hardcoded seeds) ─┐
                           ├→ store.tsx (V3RobotProvider: THE single source of truth)
Pi WebSocket ──────────────┘         │
  {"type":"state",...} patches       ├→ all components via useV3Robot()
  {"type":"door_blocked",...}        │
                                     └→ logTelemetry() → POST /api/v3/telemetry → Supabase
```

- **Demo = hardcoded values through the same pipeline as live.** Components never know which mode they're in; they read `state` from context.
- **Hot-swap:** WS `onmessage` calls the same setters (`setBattery`, `setMode`, …) → React re-renders, no refresh. `connection` flips `"connecting" → "live" | "demo"`.
- **Commands:** `sendRobotCommand()` sends JSON over the open WS when live; no-ops in demo (local state was already updated by the action). Pi contract is documented in `docs/TAILSCALE.md`.
- **Liveness in demo:** marker glides along waypoints (700ms tick, only when cleaning), battery drains 1%/45s (only when cleaning, not in live), ambient timeline events every 75s. Feels alive without a backend.
- **Telemetry:** every run/drive/dock/door/voice/timeline action fires `logTelemetry` → Supabase `stella_telemetry` via service-role key server-side; fire-and-forget, never blocks UI. The "gold data" store exists.

## 6. Map component

- **Rendered as SVG** (`viewBox="0 0 400 320"`, `preserveAspectRatio="xMidYMid slice"`).
- **Mobile:** wrapper is `h-[80dvh]` — the requested ~80% viewport centerpiece ✅. Overlays are compacted on mobile (status card shrinks, voice chip drops below it, view toggle moves to `top-[68px]`, camera thumbnail shrinks to 80×56, Stella/Route/Dock chips hidden on mobile).
- **Desktop:** `md:h-auto` — natural height from the SVG aspect ratio.
- Zoom 0.6–2.0, drag pan, recenter. Touch: `touch-none` on SVG so pointer events own the gesture.
- **Gap:** `preserveAspectRatio="slice"` crops rather than letterboxes — on very wide/narrow containers edges can clip. `meet` would be safer for "fit the screen".

## 7. Cards — collapsible behavior

All four panels (Clean, Drive, Battery, Timeline) use `V3Collapsible`:

- **Collapsed = icon + title + one-line summary** (e.g. "3 rooms · cleaning", "50% · NE", "61%", "4 events") with a chevron. This matches the requested "collapsed state uses a relevant icon".
- **What collapses:** only the content `<div>` is removed; the card shell (border, gradient, header row) **stays rendered**. On desktop the collapsed card still occupies its grid cell with full card chrome — it does NOT shrink to a bare icon strip.
- The user's ask ("on web… the whole card not just the content part") is **not yet implemented** — collapsing hides content but the card frame remains.

## 8. Connection / Tailscale

- **Detection exists:** on mount, if `NEXT_PUBLIC_ROBOT_URL` is set, opens `wss://<host>/ws` with a **5s timeout** → `live`, else `demo`. No login, no password — reachability is auth, per `docs/TAILSCALE.md`.
- **UI:** top-bar status light (green LIVE / amber DEMO) + pill; mobile `V3ConnectionBar` strip above bottom nav (Tailscale / Pi / Link).
- **Gaps vs. the request:**
  - Probe runs **once on mount** — if the user enables Tailscale *after* loading, nothing re-probes; they'd need a refresh. No background re-check loop.
  - No "switch to live data?" toast/prompt when the Pi becomes reachable.
  - `NEXT_PUBLIC_ROBOT_URL` is **not set** in the repo env (must be configured in Vercel) — without it the probe is skipped and the dashboard is demo-only.
  - Pi-side socket server doesn't exist yet (Pi arrives tomorrow).

## 9. Layout

- **Structure:** `flex-col` app shell → top bar (h-16) → toast → `flex-row` (desktop icon rail w-16 / mobile fixed bottom nav) + scrollable `main` → connection bar (mobile fixed) → status bar (h-10).
- **Home view:** map section, then `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3`.
- **Density:** spacious, not dense. `p-3/md:p-4`, `gap-3`, panels have `px-4 pb-4` with `gap-3` between children. No strict spacing scale or grid system for content density; each panel lays out its own children with ad-hoc flex/grid. There is no progressive disclosure beyond the card collapse (no tabs/accordions inside panels).
- **Theme:** dark "Midnight Tokyo" (`--v3-*` CSS vars in `globals.css`); the paper/blueprint theme toggle lives on the landing page and 3D viewer, not in this dashboard.

---

## Gaps checklist (what's not done vs. the requirements)

| Requirement | Status |
|---|---|
| Demo loads immediately, background live-probe | ✅ |
| Hot-swap to live without refresh | ✅ (code path exists, untested against real Pi) |
| No login; Tailscale = auth | ✅ |
| Amber DEMO / green LIVE lights | ✅ |
| Mobile connection strip (Tailscale/Pi/link) | ✅ |
| Collapsible cards with icon + summary | ✅ |
| Battery expanded details (%/charging/time/voltage/health/cycles/history) | ✅ |
| Mobile map ~80% viewport, zoom/pan | ✅ |
| Door toast not on load | ✅ |
| Hallway / Setup Room naming | ✅ |
| Voice UI (mic, listening/speaking, sound-trigger OFF) | ✅ UI only |
| Logo reacts to status | ✅ |
| Supabase telemetry | ✅ |
| **Whole-card collapse on desktop** (not just content) | ❌ |
| **Dense grid layout / progressive disclosure** | ❌ (spacious, ad-hoc) |
| **First-person POV that works** | ❌ (toggle is a stub) |
| **Real camera stream** (MediaMTX/WHEP) | ❌ (animated placeholder) |
| **Live lidar scan ingestion** | ❌ (hardcoded SVG zones) |
| **Background re-probe / "go live" toast** | ❌ (probe once on mount) |
| Drive joystick draggable | ❌ (reflects d-pad only) |
| History run rows clickable | ❌ (no onClick) |
| Settings toggles persist / do anything | ❌ (4 of 5 are local state) |

## Recommended next steps (for Pi arrival)

1. **Pi WebSocket server** (`/ws`): emit `{"type":"state", battery, mode, location, …}` patches + `door_blocked` events per `docs/TAILSCALE.md`. Dashboard needs zero changes.
2. **Camera:** replace the map thumbnail's drift divs with a `<video>` WHEP player pointed at MediaMTX; wire Expand → fullscreen view.
3. **Lidar:** add a `{"type":"scan", points:[…]}` WS message; render as SVG/canvas overlay on the map. Then implement FP toggle as a real transform (or camera-based).
4. **Re-probe:** interval or `online`/visibility-based re-check of the WS when in demo mode + a "Stella is on your tailnet — go live?" toast.
5. **Layout pass:** tighten to a denser card grid, make collapsed cards shrink to icon strips on desktop, add tabs inside Battery/Timeline for secondary detail.
