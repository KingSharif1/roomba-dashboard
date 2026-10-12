import { NextResponse, type NextRequest } from "next/server";

/**
 * Pass-through proxy. Auth model: Tailscale membership IS the authentication —
 * there is no login, no sessions, no password. The dashboard probes the Pi
 * over the tailnet (see docs/TAILSCALE.md); anyone on the tailnet gets LIVE,
 * everyone else gets DEMO.
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
