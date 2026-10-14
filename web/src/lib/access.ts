export type AccessRole = "owner" | "visitor";

export type AccessDecision = {
  role: AccessRole;
  /** True unless this session is the owner AND a robot URL is configured. */
  demo: boolean;
  /** Present only for the owner when the server has a robot URL. Never sent to visitors. */
  robotUrl: string | null;
  email: string | null;
  robotConfigured: boolean;
};

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const email = value.trim().toLowerCase();
  if (!email.includes("@") || email.includes(" ")) return null;
  return email;
}

/** Accept only http(s) origins. "mock", blanks, and other schemes stay unset. */
export function normalizeRobotUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "mock") return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path === "" ? "" : path}`;
  } catch {
    return null;
  }
}

/**
 * Fail closed: nobody is the owner unless OWNER_EMAIL is set and matches.
 * A configured robot URL is still withheld from everyone else.
 */
export function decideAccess(input: {
  userEmail?: string | null;
  ownerEmail?: string | null;
  robotUrl?: string | null;
}): AccessDecision {
  const email = normalizeEmail(input.userEmail);
  const owner = normalizeEmail(input.ownerEmail);
  const robotUrl = normalizeRobotUrl(input.robotUrl);
  const isOwner = Boolean(owner && email && email === owner);
  return {
    role: isOwner ? "owner" : "visitor",
    demo: !isOwner || !robotUrl,
    robotUrl: isOwner && robotUrl ? robotUrl : null,
    email,
    robotConfigured: Boolean(robotUrl),
  };
}

/** Sanitize `/api/access` JSON. Demo stays on unless the server explicitly unlocked the owner. */
export function parseAccessPayload(body: unknown): AccessDecision {
  if (!body || typeof body !== "object") return decideAccess({});
  const record = body as Partial<AccessDecision>;
  const role = record.role === "owner" ? "owner" : "visitor";
  const robotUrl = role === "owner" && record.demo === false ? normalizeRobotUrl(record.robotUrl) : null;
  return {
    role,
    demo: !robotUrl,
    robotUrl,
    email: typeof record.email === "string" ? normalizeEmail(record.email) : null,
    robotConfigured: Boolean(record.robotConfigured),
  };
}
