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
  const { query, target } = await req.json();
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

  // His 3 TVs: '75 Living' (living room), 'ds twin' (PC setup), 'sharif d ace' (by window)
  const KNOWN_TVS = ["75 living", "ds twin", "sharif d ace"];
  const isTV = (d: any) => {
    const name = (d.name || "").toLowerCase();
    return (
      KNOWN_TVS.some((tv) => name.includes(tv)) ||
      /roku|tv|television/i.test(d.name || "")
    ) && !d.is_restricted;
  };
  const tvDevices = devices.filter(isTV);

  // If a target room was named, match it against TV names
  let targetDevice: any = null;
  if (target && tvDevices.length > 0) {
    targetDevice =
      tvDevices.find((d: any) =>
        d.name.toLowerCase().includes(target.toLowerCase())
      ) || null;
  }
  // Fallback: default to '75 Living' (living room), then most recently active TV,
  // then any TV, then active device, then first
  targetDevice =
    targetDevice ||
    tvDevices.find((d: any) => d.name.toLowerCase().includes("75 living")) ||
    tvDevices.find((d: any) => d.is_active) ||
    tvDevices[0] ||
    devices.find((d: any) => d.is_active) ||
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
