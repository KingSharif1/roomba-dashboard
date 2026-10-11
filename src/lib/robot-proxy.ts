import type { AccessDecision } from "./access";

const ALLOWED: Record<string, readonly string[]> = {
  GET: ["status", "sessions", "learning", "zones", "routes", "pose"],
  POST: ["control/stop", "control/start", "control/dock", "drive"],
};

export type ProxyDenial = { ok: false; status: number; error: string };
export type ProxyAllow = { ok: true; path: string };

export function authorizeRobotRequest(input: {
  decision: AccessDecision;
  method: string;
  pathSegments: string[];
}): ProxyDenial | ProxyAllow {
  if (input.decision.role !== "owner") {
    return { ok: false, status: 403, error: "Live robot controls are limited to the owner." };
  }
  if (input.decision.demo || !input.decision.robotUrl) {
    return { ok: false, status: 503, error: "Robot URL is not configured." };
  }
  if (
    input.pathSegments.length === 0 ||
    input.pathSegments.some((segment) => segment === "" || segment === "." || segment === ".." || segment.includes("\\"))
  ) {
    return { ok: false, status: 400, error: "Invalid path." };
  }

  const path = input.pathSegments.join("/");
  const allowed = ALLOWED[input.method.toUpperCase()] ?? [];
  if (!allowed.includes(path)) {
    return { ok: false, status: 404, error: "Unknown robot endpoint." };
  }
  return { ok: true, path };
}

export async function handleRobotProxy(input: {
  decision: AccessDecision;
  method: string;
  pathSegments: string[];
  body?: string;
  forward?: (url: string, init: RequestInit) => Promise<Response>;
}): Promise<Response> {
  const auth = authorizeRobotRequest(input);
  if (!auth.ok) {
    return Response.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const forward = input.forward ?? fetch;
  const method = input.method.toUpperCase();
  try {
    const res = await forward(`${input.decision.robotUrl}/${auth.path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: method === "GET" || method === "HEAD" ? undefined : (input.body ?? "{}"),
      signal: AbortSignal.timeout(5000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Robot unreachable";
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
