/**
 * Minimal client for the Anthropic Messages API using the global `fetch`
 * (no SDK dependency). See the Claude API reference for the request/response
 * shape: POST https://api.anthropic.com/v1/messages.
 */

import type { ClaudeMessage } from "./slack/events";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Default model: Claude Opus 4.8 (the session's configured model). This is the
 * exact public API model id — no date suffix. Overridable via CLAUDE_MODEL.
 */
const DEFAULT_MODEL = "claude-opus-4-8";

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

export interface GenerateReplyArgs {
  messages: ClaudeMessage[];
  /** Optional system prompt. */
  system?: string;
}

/**
 * Call the Messages API and return the concatenated, trimmed text of the
 * response. Reads ANTHROPIC_API_KEY and CLAUDE_MODEL from the environment.
 * Throws a clear error on a non-OK HTTP response or a missing API key.
 */
export async function generateReply({
  messages,
  system,
}: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Anthropic Messages API error ${response.status}: ${detail}`,
    );
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("")
    .trim();

  return text;
}
