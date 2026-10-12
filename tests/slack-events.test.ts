import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildClaudeMessages,
  shouldRespond,
  type SlackEvent,
  type SlackThreadMessage,
} from "../src/lib/slack/events.ts";

const SELF = "UBOT";

test("shouldRespond is true for an app_mention from a human", () => {
  const event: SlackEvent = {
    type: "app_mention",
    user: "UHUMAN",
    text: "<@UBOT> hello there",
    channel: "C1",
    ts: "1.1",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), true);
});

test("shouldRespond is true for a mention from another bot", () => {
  // A message authored by another bot (Muse/Grok): different bot_id, no user.
  const event: SlackEvent = {
    type: "message",
    bot_id: "BMUSE",
    subtype: "bot_message",
    text: "hey <@UBOT> what do you think?",
    channel: "C1",
    ts: "1.2",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), true);
});

test("shouldRespond is false for the bot's own message", () => {
  const event: SlackEvent = {
    type: "app_mention",
    user: SELF,
    text: "something I said",
    channel: "C1",
    ts: "1.3",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), false);
});

test("shouldRespond is false for message_changed", () => {
  const event: SlackEvent = {
    type: "message",
    subtype: "message_changed",
    text: "<@UBOT> edited",
    channel: "C1",
    ts: "1.4",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), false);
});

test("shouldRespond is false for empty text", () => {
  const event: SlackEvent = {
    type: "app_mention",
    user: "UHUMAN",
    text: "   ",
    channel: "C1",
    ts: "1.5",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), false);
});

test("shouldRespond is false for a plain message without a mention", () => {
  const event: SlackEvent = {
    type: "message",
    user: "UHUMAN",
    text: "just chatting, no mention",
    channel: "C1",
    ts: "1.6",
  };
  assert.equal(shouldRespond(event, { selfUserId: SELF }), false);
});

test("buildClaudeMessages maps self to assistant, others to prefixed user, ending on a user turn", () => {
  const thread: SlackThreadMessage[] = [
    { user: "UHUMAN", text: "hi Claude", ts: "1" },
    { user: SELF, text: "hello! how can I help?", ts: "2" },
    { bot_id: "BMUSE", text: "I think X", ts: "3" },
    { user: "UHUMAN", text: "and what about Y?", ts: "4" },
  ];

  const messages = buildClaudeMessages(thread, { selfUserId: SELF });

  assert.deepEqual(messages, [
    { role: "user", content: "[UHUMAN]: hi Claude" },
    { role: "assistant", content: "hello! how can I help?" },
    { role: "user", content: "[BMUSE]: I think X\n[UHUMAN]: and what about Y?" },
  ]);

  // Final turn must be a user turn.
  assert.equal(messages[messages.length - 1].role, "user");
});

test("buildClaudeMessages drops a trailing assistant turn so it ends on user", () => {
  const thread: SlackThreadMessage[] = [
    { user: "UHUMAN", text: "question", ts: "1" },
    { user: SELF, text: "answer", ts: "2" },
  ];
  const messages = buildClaudeMessages(thread, { selfUserId: SELF });
  assert.deepEqual(messages, [{ role: "user", content: "[UHUMAN]: question" }]);
});
