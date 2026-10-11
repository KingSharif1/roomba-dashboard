# Stella

Stella is King Sharif's robot dashboard.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Environment

Copy `.env.example` to `.env.local`. Do not commit real values.

- `ROBOT_URL` — Pi origin. Unset forces demo mode.
- `OWNER_EMAIL` — the one email allowed to control the robot.
- `NEXT_PUBLIC_SUPABASE_URL` — owner sign-in. With the anon key, required for login.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — owner sign-in.

## Docs

https://github.com/KingSharif1/ARK/tree/main/projects/roomba-dashboard
