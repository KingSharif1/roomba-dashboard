import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return res.json();
}

async function spotifyFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
) {
  return fetch(`https://api.spotify.com/v1${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("spotify_access_token")?.value;
  // Fallback to env var for cross-device support (set after first OAuth)
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value || process.env.SPOTIFY_REFRESH_TOKEN;

  if (!accessToken && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    if (tokens.access_token) {
      accessToken = tokens.access_token as string;
      cookieStore.set("spotify_access_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: tokens.expires_in,
        path: "/",
      });
    }
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Spotify. Visit /api/spotify/login first." },
      { status: 401 }
    );
  }

  const { query } = await req.json();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Search for the track
  const searchRes = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    accessToken
  );
  const searchData = await searchRes.json();
  const track = searchData.tracks?.items?.[0];

  if (!track) {
    return NextResponse.json(
      { error: `No results for "${query}"` },
      { status: 404 }
    );
  }

  // Get available devices
  const devicesRes = await spotifyFetch("/me/player/devices", accessToken);
  const devicesData = await devicesRes.json();
  const devices = devicesData.devices || [];

  // Prefer Roku/TV, otherwise use any active device
  const targetDevice =
    devices.find((d: any) => d.is_active) ||
    devices.find((d: any) => /roku|tv/i.test(d.name)) ||
    devices[0];

  if (!targetDevice) {
    return NextResponse.json(
      {
        error:
          "No Spotify devices found. Open Spotify on your Roku first, then try again.",
      },
      { status: 404 }
    );
  }

  // Play the track on the target device
  const playRes = await spotifyFetch(
    `/me/player/play?device_id=${targetDevice.id}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ uris: [track.uri] }),
    }
  );

  if (!playRes.ok && playRes.status !== 204) {
    const err = await playRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Failed to start playback", detail: err },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    track: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    device: targetDevice.name,
  });
}
