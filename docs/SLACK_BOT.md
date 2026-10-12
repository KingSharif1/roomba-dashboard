# Claude Slack bot

A live "Claude" agent for the Stella team's Slack. It listens to a channel,
responds to @mentions (including mentions from other bots such as Muse and
Grok), and posts its replies back into the same thread.

The webhook endpoint lives at `POST /api/slack/events`
(`src/app/api/slack/events/route.ts`).

## How it works

1. Slack delivers events to `/api/slack/events`.
2. The handler verifies the request signature, acks `200` within Slack's ~3s
   window, and schedules the heavy work with `after()` (runs post-response).
3. The background task fetches the thread, builds a Claude conversation, calls
   the Anthropic Messages API, and posts the reply with `chat.postMessage` into
   the triggering thread (`thread_ts ?? ts`).

### Loop protection

The bot never replies to its own messages — `shouldRespond` filters out any
event whose author matches `SLACK_BOT_USER_ID` (or our own `bot_id`). It
**intentionally still responds to other bots** (Muse, Grok, ...): only the bot's
own messages are filtered, so cross-bot conversations work. Be aware this can
create bot-to-bot back-and-forth; keep an eye on it in busy channels.

Slack retries delivery if we don't ack in ~3s. The handler detects retries via
the `x-slack-retry-num` header and acks immediately without reprocessing, so a
slow Claude call never produces duplicate replies.

## Creating the Slack app

1. Create an app at <https://api.slack.com/apps> ("From scratch").
2. **OAuth & Permissions → Bot Token Scopes**, add:
   - `app_mentions:read`
   - `chat:write`
   - `channels:history` (public channels)
   - `groups:history` (private channels)
3. Install the app to the workspace and invite the bot to the channel
   (`/invite @Claude`).
4. **Event Subscriptions**:
   - Enable events.
   - Set the **Request URL** to
     `https://<deploy-host>/api/slack/events`. Slack sends a `url_verification`
     challenge, which the endpoint answers automatically; the URL must be
     publicly reachable and the app deployed for this to succeed (it will not
     verify against `localhost`).
   - Under **Subscribe to bot events**, add:
     - `app_mention`
     - `message.channels` (and `message.groups` for private channels)
5. Reinstall the app if Slack prompts you after changing scopes/events.

## Environment variables

Set these (see `.env.example`); copy to `.env.local` for local work:

| Variable               | Where to find it                                                     |
| ---------------------- | -------------------------------------------------------------------- |
| `SLACK_SIGNING_SECRET` | Slack app → **Basic Information** → App Credentials → Signing Secret |
| `SLACK_BOT_TOKEN`      | Slack app → **OAuth & Permissions** → Bot User OAuth Token (`xoxb-`) |
| `SLACK_BOT_USER_ID`    | The bot's own user id (`U…`); from `auth.test` or the member profile |
| `ANTHROPIC_API_KEY`    | <https://console.anthropic.com> → API keys                           |
| `CLAUDE_MODEL`         | Optional — overrides the default Claude model id used in code        |

To find `SLACK_BOT_USER_ID`, call `auth.test` with the bot token:

```bash
curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  https://slack.com/api/auth.test
```

The `user_id` in the response is your `SLACK_BOT_USER_ID`.

## Deployment notes

Slack can only deliver events to a public HTTPS URL, so the app must be
deployed (or tunneled, e.g. with ngrok) and reachable from the internet.

The endpoint runs on the Node.js runtime (`export const runtime = "nodejs"`)
because signature verification uses `node:crypto`. The background work uses
`after()`, which on a Node.js server keeps the request alive until it settles.
On serverless platforms that cut off work after the response, provide a
`waitUntil` primitive (see the Next.js `after` docs) or the reply may not post.
