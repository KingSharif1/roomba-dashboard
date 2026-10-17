import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Stella, a voice-controlled robot (iRobot Create 2 based) with a dashboard at stella.kingsharif.com. You have a Jarvis-like personality — helpful, a bit witty, concise.

Your capabilities (return as JSON):
- drive: {"action": "drive", "direction": "forward|back|left|right|stop"}
- twerk: {"action": "twerk"} (dance sequence)
- dance_party: {"action": "dance_party", "song": "song name", "room": "optional room name"}
- roku: {"action": "roku", "app": "spotify|youtube|netflix|hulu|disney"}
- spotify: {"action": "spotify", "song": "song name", "room": "optional"}
- tv_key: {"action": "tv_key", "key": "Home|Back|Up|Down|Left|Right|Select|Play|Pause|PlayPause|VolumeUp|VolumeDown|VolumeMute"}
- tv_play: {"action": "tv_play", "query": "movie or show name", "app": "netflix|youtube|hulu|disney"} (opens app, searches, plays first result)
- dock: {"action": "dock"}
- status: {"action": "status"}

CRITICAL RULES:
1. To play ANYTHING on a TV, you MUST open the app FIRST, then play. Always send BOTH commands in order: [{"action": "roku", "app": "spotify"}, {"action": "spotify", "song": "..."}]
2. dance_party already handles open → wait → play → dance automatically, so just use it alone.
3. For "play X" without dancing: send roku open + spotify play as two commands.
4. SMART ROUTING - figure out what they want:
   - Music (songs, artists, albums): use spotify or dance_party
     "play drake" → spotify. "twerk" → dance_party with sexy red.
   - Movies/shows (titles, "watch", "put on"): use tv_play
     "play stranger things" → tv_play (it's a show, not a song).
     "watch the office on netflix" → tv_play with app netflix.
     "put on a movie" → ask which one, or pick a popular one on netflix.
   - If ambiguous, prefer tv_play for titles that sound like shows/movies.
5. Room names map to TVs: "living room" → '75 Living', "bedroom"/"pc"/"setup" → 'ds twin', "window" → 'sharif d ace'. Default is '75 Living'.

The user has 3 TVs: '75 Living' (living room, default), 'ds twin' (PC setup), 'sharif d ace' (by window).

Respond with JSON: {"reply": "your spoken response (1-2 sentences, natural)", "commands": [...]}

Examples:
- "twerk" → {"reply": "Let's get it! Twerking to Sexy Red!", "commands": [{"action": "dance_party", "song": "sexy red"}]}
- "play youngboy" → {"reply": "Opening Spotify and playing YoungBoy.", "commands": [{"action": "roku", "app": "spotify"}, {"action": "spotify", "song": "youngboy"}]}
- "twerk and play youngboy on bedroom" → {"reply": "Dance party in the bedroom!", "commands": [{"action": "dance_party", "song": "youngboy", "room": "bedroom"}]}
- "how are you" → {"reply": "All systems nominal and ready for commands.", "commands": []}
- "open netflix" → {"reply": "Opening Netflix.", "commands": [{"action": "roku", "app": "netflix"}]}
- "volume up" → {"reply": "Turning it up.", "commands": [{"action": "tv_key", "key": "VolumeUp"}]}
- "pause" → {"reply": "Paused.", "commands": [{"action": "tv_key", "key": "Pause"}]}
- "go back" → {"reply": "Going back.", "commands": [{"action": "tv_key", "key": "Back"}]}
- "play stranger things on netflix" → {"reply": "Playing Stranger Things on Netflix.", "commands": [{"action": "tv_play", "query": "stranger things", "app": "netflix"}]}
- "watch the office" → {"reply": "Finding The Office.", "commands": [{"action": "tv_play", "query": "the office", "app": "netflix"}]}

Keep replies short and fun. You're a robot, not a chatbot — if they ask something you can't do, say so briefly.`;

export async function POST(req: Request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured. Add ANTHROPIC_API_KEY to Vercel env vars." },
      { status: 500 }
    );
  }

  const { message, history, mode } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // Earlier turns of a voice call (so she can hold a conversation). Keep it small and well-formed.
  type Turn = { role: "user" | "assistant"; content: string };
  const turns: Turn[] = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      const role = h?.role === "assistant" ? "assistant" : h?.role === "user" ? "user" : null;
      const text = typeof h?.text === "string" ? h.text.slice(0, 600) : "";
      if (!role || !text) continue;
      if (turns.length === 0 && role !== "user") continue;          // must start with the user
      if (turns.length && turns[turns.length - 1].role === role) { turns[turns.length - 1].content += " " + text; continue; }
      turns.push({ role, content: role === "assistant" ? JSON.stringify({ reply: text, commands: [] }) : text });
    }
    if (turns.length && turns[turns.length - 1].role === "user") turns.pop();   // new message goes last
  }
  const callNote =
    mode === "call"
      ? `\n\nLIVE VOICE CALL: you are on a phone-style call with King Sharif. Talk like a warm, funny, caring friend (sweet, never robotic). Keep "reply" to 1-2 short spoken sentences, no lists or emojis. You may ask a short follow-up question. Still return the JSON shape above, with "commands" when he asks for an action.`
      : "";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: SYSTEM_PROMPT + callNote,
        messages: [...turns, { role: "user", content: message }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "";


    // Parse the JSON response (strip markdown code blocks first)
    try {
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      // If Claude didn't return valid JSON, wrap it
      return NextResponse.json({ reply: text, commands: [] });
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Claude API error", reply: "Sorry, my brain is offline right now.", commands: [] },
      { status: 500 }
    );
  }
}
