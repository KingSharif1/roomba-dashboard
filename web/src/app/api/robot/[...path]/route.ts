import type { NextRequest } from "next/server";
import { readServerAccess } from "@/lib/access-server";
import { handleRobotProxy } from "@/lib/robot-proxy";

export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  return handleRobotProxy({
    decision: await readServerAccess(),
    method: request.method,
    pathSegments: path,
    body,
  });
}

export const GET = proxy;
export const POST = proxy;
