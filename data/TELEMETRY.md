# Stella telemetry — the gold data

Every run, map event, door event, drive command, voice session, and audio
trigger is logged to Supabase. No login involved: the browser POSTs to
`/api/v3/telemetry`, which inserts with the service-role key server-side.

## Table

```sql
create table stella_telemetry (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  at timestamptz not null default now(),
  session text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index stella_telemetry_kind_at on stella_telemetry (kind, at desc);
create index stella_telemetry_session on stella_telemetry (session);
```

RLS: leave the table wide open to `service_role` only (the API route holds
the key). No anon-key access needed — the browser never talks to Supabase
directly.

## Env (Vercel, project `stella`)

- `NEXT_PUBLIC_SUPABASE_URL` — e.g. `https://xyz.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never exposed to the browser

If either is missing, the route returns `{ ok: false, reason: "unconfigured" }`
and the dashboard keeps working. Telemetry must never break the demo.

## Event kinds (`web/src/lib/v3/telemetry.ts`)

| kind | when | data |
|---|---|---|
| `run_start` | All-rooms / room clean tapped | `{ rooms }` |
| `run_stop` | Stop tapped | `{}` |
| `room_select` | room tapped | `{ roomId }` |
| `drive` | D-pad / speed | `{ dir, speed }` |
| `dock` | Dock tapped | `{}` |
| `door_blocked` | kitchen tapped w/ closed door | `{ doorId, roomId }` |
| `timeline_dismiss` | alert dismissed | `{ id }` |
| `voice_listen` / `voice_speak` | mic demo loop | `{}` |
| `audio_trigger` | sound-trigger fired (future Pi) | `{ db, classified }` |
| `battery_snapshot` | every 5 min in demo | `{ battery, voltage }` |

## Future training

Sessions group events (`session` = one dashboard visit). Join with run
history to learn: which rooms get cleaned when, door-block patterns,
drive-command sequences, and voice intents. That's the dataset the
on-device model trains on later.
