import { NextResponse } from "next/server";
import { readServerAccess } from "@/lib/access-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await readServerAccess();
  return NextResponse.json(access, {
    headers: { "Cache-Control": "no-store" },
  });
}
