/**
 * Thin wrappers over the Slack Web API using the global `fetch`. No SDK
 * dependency.
 */

import type { SlackThreadMessage } from "./events";

const SLACK_API = "https://slack.com/api";

export interface PostSlackMessageArgs {
  token: string;
  channel: string;
  text: string;
  /** When set, posts the reply inside this thread. */
  threadTs?: string;
}

/**
 * Post a message via chat.postMessage. Throws if Slack reports `ok: false`.
 */
export async function postSlackMessage({
  token,
  channel,
  text,
  threadTs,
}: PostSlackMessageArgs): Promise<void> {
  const response = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel,
      text,
      thread_ts: threadTs,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`chat.postMessage failed: ${data.error ?? "unknown_error"}`);
  }
}

export interface FetchThreadRepliesArgs {
  token: string;
  channel: string;
  threadTs: string;
  limit?: number;
}

/**
 * Fetch replies in a thread via conversations.replies. Returns the `messages`
 * array (oldest first). On any failure returns `[]` so callers can fall back to
 * the single triggering message.
 */
export async function fetchThreadReplies({
  token,
  channel,
  threadTs,
  limit = 50,
}: FetchThreadRepliesArgs): Promise<SlackThreadMessage[]> {
  try {
    const params = new URLSearchParams({
      channel,
      ts: threadTs,
      limit: String(limit),
    });
    const response = await fetch(
      `${SLACK_API}/conversations.replies?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = (await response.json()) as {
      ok?: boolean;
      messages?: SlackThreadMessage[];
    };
    if (!data.ok || !Array.isArray(data.messages)) {
      return [];
    }
    return data.messages;
  } catch {
    return [];
  }
}
