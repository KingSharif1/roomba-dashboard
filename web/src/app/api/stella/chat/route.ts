import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Stella, a voice-controlled robot (iRobot Create 2 based) with a dashboard at stella.kingsharif.com. You have a Jarvis-like personality — helpful, a bit witty, concise.

Your capabilities (return as JSON):
- drive: {"action": "drive", "direction": "forward|back|left|right|stop"}
- twerk: {"action": "twerk"} (dance sequence)
- dance_party: {"action": "dance_party", "song": "song name", "room": "optional room name"}
- roku: {"action": "roku", "app": "spotify|youtube|netflix|hulu|disney"}
- spotify: {"action": "spotify", "song": "song name", "room": "optional"}
- dock: {"action": "dock"}
- status: {"action": "status"}

The user has 3 TVs: '75 Living' (living room, default), 'ds twin' (PC setup), 'sharif d ace' (by window).

Respond with JSON: {"reply": "your spoken response (1-2 sentences, natural)", "commands": [...]}

Examples:
- "twerk" → {"reply": "Let's get it! Twerking to Sexy Red!", "commands": [{"action": "dance_party", "song": "sexy red"}]}
- "play youngboy" → {"reply": "Playing YoungBoy on the living room TV.", "commands": [{"action": "spotify", "song": "youngboy"}]}
- "twerk and play youngboy on bedroom" → {"reply": "Dance party in the bedroom!", "commands": [{"action": "dance_party", "song": "youngboy", "room": "bedroom"}]}
- "how are you" → {"reply": "All systems nominal and ready for commands.", "commands": []}
- "open netflix" → {"reply": "Opening Netflix.", "commands": [{"action": "roku", "app": "netflix"}]}

Keep replies short and fun. You're a robot, not a chatbot — if they ask something you can't do, say so briefly.`;

export async function POST(req: Request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured. Add ANTHROPIC_API_KEY to Vercel env vars." },
      { status: 500 }
    );
  }

  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    // Debug: if empty, return what Claude actually sent
    if (!text && !data.content) {
      return NextResponse.json({
        reply: "",
        commands: [],
        _debug: { status: res.status, error: data.error?.message || JSON.stringify(data).slice(0, 200) }
      });
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(text);
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
