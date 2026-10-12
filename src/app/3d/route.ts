import { readFile } from "fs/promises";

// Serves the v3c 3D exploded-view demo as-is at /3d.
// Source: ARK projects/roomba-dashboard/design/v3c/v3c-3d-demo.html
export async function GET() {
  const html = await readFile(new URL("./v3c-3d-demo.html", import.meta.url), "utf-8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
