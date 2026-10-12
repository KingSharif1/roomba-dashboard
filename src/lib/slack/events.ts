/**
 * Pure helpers for interpreting Slack Events API payloads. No network access —
 * this module is the primary target of the unit tests.
 */

/** A single Slack event (the `event` field of an `event_callback` envelope). */
export interface SlackEvent {
  /** e.g. "app_mention", "message". */
  type: string;
  /** Message subtype, e.g. "bot_message", "message_changed", "message_deleted". */
  subtype?: string;
  /** The Slack user id of the author (absent for some bot messages). */
  user?: string;
  /** The bot id of the author when the message was posted by a bot. */
  bot_id?: string;
  /** Message text. */
  text?: string;
  /** Channel the event occurred in. */
  channel?: string;
  /** Timestamp of this message. */
  ts?: string;
  /** Thread timestamp, present when the message is inside a thread. */
  thread_ts?: string;
  /** The app id of the authoring app, when posted by an app. */
  app_id?: string;
}

/** The minimal Slack Events API envelope we consume. */
export interface SlackEventEnvelope {
  type: string;
  /** Present on url_verification requests. */
  challenge?: string;
  /** Present on event_callback requests. */
  event?: SlackEvent;
  /** Our own app id, if Slack provides it on the envelope. */
  api_app_id?: string;
}

/** A single message as returned by conversations.replies. */
export interface SlackThreadMessage {
  user?: string;
  bot_id?: string;
  text?: string;
  ts?: string;
  subtype?: string;
  app_id?: string;
}

/** A Claude Messages API turn. */
export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ShouldRespondOpts {
  /** The bot's own Slack user id (SLACK_BOT_USER_ID). */
  selfUserId?: string;
  /** The bot's own bot_id, if known. Optional. */
  selfBotId?: string;
}

/** Subtypes that represent edits/deletions rather than new messages. */
const IGNORED_SUBTYPES = new Set(["message_changed", "message_deleted"]);

/**
 * Decide whether the bot should respond to an event.
 *
 * Returns true for:
 *  - `app_mention` events, or
 *  - `message` events whose text @-mentions the bot (`<@SELF_USER_ID>`).
 *
 * Returns false when:
 *  - the message is authored by the bot itself (user or bot_id matches, or it is
 *    a bot_message authored by us),
 *  - the event is an edit/deletion (message_changed / message_deleted),
 *  - the message has no text.
 *
 * IMPORTANT: messages authored by OTHER bots (Muse, Grok, ...) still return
 * true — only the bot's own messages are filtered out.
 */
export function shouldRespond(
  event: SlackEvent | undefined,
  opts: ShouldRespondOpts,
): boolean {
  if (!event) {
    return false;
  }

  const { selfUserId, selfBotId } = opts;

  // Ignore edits/deletions.
  if (event.subtype && IGNORED_SUBTYPES.has(event.subtype)) {
    return false;
  }

  const text = event.text?.trim();
  if (!text) {
    return false;
  }

  // Loop protection: never respond to our own messages.
  if (selfUserId && event.user === selfUserId) {
    return false;
  }
  if (selfBotId && event.bot_id && event.bot_id === selfBotId) {
    return false;
  }

  if (event.type === "app_mention") {
    return true;
  }

  if (event.type === "message") {
    // Respond to plain channel messages only when they @-mention the bot.
    // (Messages from other bots reach here too — intentionally allowed.)
    if (selfUserId && text.includes(`<@${selfUserId}>`)) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Pick a human-readable author label for a thread message, so Claude knows who
 * spoke. Prefers the Slack user id, then the bot id, falling back to "unknown".
 */
function authorLabel(message: SlackThreadMessage): string {
  if (message.user) {
    return message.user;
  }
  if (message.bot_id) {
    return message.bot_id;
  }
  return "unknown";
}

/**
 * Map a thread's messages into Claude Messages API turns.
 *
 * - Messages authored by the bot itself (matching selfUserId/selfBotId) become
 *   `assistant` turns.
 * - Everyone else (humans and other bots) becomes a `user` turn, prefixed with
 *   the author's id/label, e.g. `"[Muse]: hello"`, so Claude can tell speakers
 *   apart.
 * - Consecutive same-role turns are collapsed into one (joined with newlines),
 *   because the Messages API requires alternating roles.
 * - A leading `assistant` turn is dropped and the array is trimmed so it ends on
 *   a `user` turn (the API requires the final turn to be from the user).
 */
export function buildClaudeMessages(
  threadMessages: SlackThreadMessage[],
  opts: { selfUserId?: string; selfBotId?: string },
): ClaudeMessage[] {
  const { selfUserId, selfBotId } = opts;

  const turns: ClaudeMessage[] = [];

  for (const message of threadMessages) {
    const text = message.text?.trim();
    if (!text) {
      continue;
    }
    if (message.subtype && IGNORED_SUBTYPES.has(message.subtype)) {
      continue;
    }

    const isSelf =
      (selfUserId !== undefined && message.user === selfUserId) ||
      (selfBotId !== undefined &&
        message.bot_id !== undefined &&
        message.bot_id === selfBotId);

    const role: "user" | "assistant" = isSelf ? "assistant" : "user";
    const content = isSelf ? text : `[${authorLabel(message)}]: ${text}`;

    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      // Collapse consecutive same-role turns.
      last.content = `${last.content}\n${content}`;
    } else {
      turns.push({ role, content });
    }
  }

  // The API requires the first turn to be a user turn: drop a leading assistant.
  while (turns.length > 0 && turns[0].role === "assistant") {
    turns.shift();
  }

  // The API requires the final turn to be a user turn: drop trailing assistant.
  while (turns.length > 0 && turns[turns.length - 1].role === "assistant") {
    turns.pop();
  }

  return turns;
}

/** System prompt describing the Claude bot persona. */
export const CLAUDE_SYSTEM_PROMPT =
  "You are Claude, a helpful AI agent participating in the Stella team's Slack. " +
  "You are talking in a shared channel alongside people and other bots (such as Muse and Grok); " +
  "each user turn is prefixed with the speaker's id in square brackets so you can tell who said what. " +
  "Reply concisely and conversationally. Use Slack-friendly formatting: short paragraphs, " +
  "*bold* with single asterisks, _italics_ with underscores, and `code` with backticks. " +
  "Do not prefix your own replies with a name.";
