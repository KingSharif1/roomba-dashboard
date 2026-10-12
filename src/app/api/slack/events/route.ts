import { after } from "next/server";
import { verifySlackSignature } from "@/lib/slack/verify";
import {
  buildClaudeMessages,
  shouldRespond,
  CLAUDE_SYSTEM_PROMPT,
  type SlackEvent,
  type SlackEventEnvelope,
  type SlackThreadMessage,
} from "@/lib/slack/events";
import { fetchThreadReplies, postSlackMessage } from "@/lib/slack/client";
import { generateReply } from "@/lib/claude";

// node:crypto (used by signature verification) requires the Node.js runtime.
export const runtime = "nodejs";
// This endpoint must never be statically cached.
export const dynamic = "force-dynamic";

/**
 * Convert the triggering event into the single-message fallback used when the
 * full thread cannot be fetched.
 */
function eventAsThreadMessage(event: SlackEvent): SlackThreadMessage {
  return {
    user: event.user,
    bot_id: event.bot_id,
    text: event.text,
    ts: event.ts,
    subtype: event.subtype,
    app_id: event.app_id,
  };
}

/**
 * Heavy work that runs AFTER the 200 ack: fetch the thread, ask Claude, and
 * post the reply back into the same thread. Never throws.
 */
async function handleEvent(event: SlackEvent): Promise<void> {
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const selfUserId = process.env.SLACK_BOT_USER_ID;
    if (!botToken) {
      console.error("[slack] SLACK_BOT_TOKEN is not set; skipping reply");
      return;
    }
    if (!event.channel) {
      console.error("[slack] event has no channel; skipping reply");
      return;
    }

    const threadTs = event.thread_ts ?? event.ts;

    let messages: SlackThreadMessage[] = [];
    if (threadTs) {
      messages = await fetchThreadReplies({
        token: botToken,
        channel: event.channel,
        threadTs,
      });
    }
    // Fall back to the single triggering message if the thread fetch was empty.
    if (messages.length === 0) {
      messages = [eventAsThreadMessage(event)];
    }

    const claudeMessages = buildClaudeMessages(messages, { selfUserId });
    if (claudeMessages.length === 0) {
      console.error("[slack] no user turns to send to Claude; skipping reply");
      return;
    }

    const reply = await generateReply({
      messages: claudeMessages,
      system: CLAUDE_SYSTEM_PROMPT,
    });

    if (!reply) {
      console.error("[slack] Claude returned an empty reply; skipping post");
      return;
    }

    await postSlackMessage({
      token: botToken,
      channel: event.channel,
      text: reply,
      threadTs,
    });
  } catch (error) {
    // Background work must never throw.
    console.error("[slack] failed to handle event:", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  // 1. Read the raw body first — needed verbatim for signature verification.
  const raw = await request.text();

  // 2. Dedup: Slack retries when our processing exceeds its ~3s window. Ack and
  //    do nothing so we don't post duplicate replies.
  if (request.headers.get("x-slack-retry-num")) {
    return Response.json({ ok: true });
  }

  // 3. Verify the request signature.
  const valid = verifySlackSignature({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    signature: request.headers.get("x-slack-signature"),
    timestamp: request.headers.get("x-slack-request-timestamp"),
    rawBody: raw,
  });
  if (!valid) {
    return new Response("invalid signature", { status: 401 });
  }

  // 4. Parse the (verified) body.
  let envelope: SlackEventEnvelope;
  try {
    envelope = JSON.parse(raw) as SlackEventEnvelope;
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  // URL verification handshake.
  if (envelope.type === "url_verification") {
    return Response.json({ challenge: envelope.challenge });
  }

  // 5. Schedule heavy work after the ack when we should respond.
  if (
    envelope.type === "event_callback" &&
    shouldRespond(envelope.event, {
      selfUserId: process.env.SLACK_BOT_USER_ID,
    })
  ) {
    const event = envelope.event as SlackEvent;
    // `after()` (next/server, stable since v15.1.0) runs the callback once the
    // response has been sent — on a Node.js server it keeps the invocation
    // alive until it settles. On some serverless platforms background work may
    // be cut off after the response unless a waitUntil primitive is provided.
    after(() => handleEvent(event));
  }

  // 6. Always ack quickly so Slack doesn't retry.
  return Response.json({ ok: true });
}
