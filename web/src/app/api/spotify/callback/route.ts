import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = "https://stella.kingsharif.com/api/spotify/callback";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      "https://stella.kingsharif.com/dashboard?spotify=error"
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Spotify token exchange failed:", tokens);
    return NextResponse.redirect(
      "https://stella.kingsharif.com/dashboard?spotify=error"
    );
  }

  // Store tokens in HTTP-only cookies
  const cookieStore = await cookies();
  cookieStore.set("spotify_access_token", tokens.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: tokens.expires_in,
    path: "/",
  });
  cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return NextResponse.redirect(
    "https://stella.kingsharif.com/dashboard?spotify=connected"
  );
}
