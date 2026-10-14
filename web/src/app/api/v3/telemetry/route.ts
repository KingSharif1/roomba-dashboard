import { NextResponse } from "next/server";

/**
 * POST /api/v3/telemetry — append-only telemetry sink for Stella.
 * No auth (Tailscale membership is the auth for live; demo events are
 * anonymous). Uses the service-role key server-side so RLS never blocks
 * writes. Graceful no-op when Supabase isn't configured or the table
 * is missing — the dashboard must never depend on this.
 *
 * Expected table (see data/TELEMETRY.md):
 *   stella_telemetry(id uuid pk, kind text, at timestamptz,
 *                    session text, data jsonb, created_at timestamptz)
 */
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ ok: false, reason: "unconfigured" });

    let evt: unknown;
    try {
      evt = await request.json();
    } catch {
      return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
    }
    const e = evt as { kind?: string; at?: string; session?: string; data?: Record<string, unknown> };
    if (!e.kind) return NextResponse.json({ ok: false, reason: "missing-kind" }, { status: 400 });

    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/stella_telemetry`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        kind: e.kind,
        at: e.at || new Date().toISOString(),
        session: e.session || null,
        data: e.data || {},
      }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, reason: `supabase-${res.status}` });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "error" });
  }
}
