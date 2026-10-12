import assert from "node:assert/strict";
import { test } from "node:test";
import { decideAccess, normalizeRobotUrl, parseAccessPayload } from "../src/lib/access.ts";
import { authorizeRobotRequest, handleRobotProxy } from "../src/lib/robot-proxy.ts";

const ROBOT = "https://roomba.example.ts.net";
const OWNER = "Owner@Example.com";

test("only the configured owner email receives the robot URL", () => {
  const owner = decideAccess({
    userEmail: "  owner@example.com ",
    ownerEmail: OWNER,
    robotUrl: `${ROBOT}/`,
  });
  assert.equal(owner.role, "owner");
  assert.equal(owner.demo, false);
  assert.equal(owner.robotUrl, ROBOT);

  const visitor = decideAccess({
    userEmail: "guest@example.com",
    ownerEmail: OWNER,
    robotUrl: ROBOT,
  });
  assert.equal(visitor.role, "visitor");
  assert.equal(visitor.demo, true);
  assert.equal(visitor.robotUrl, null);
  assert.equal(visitor.robotConfigured, true);
});

test("missing owner email or robot URL fails closed", () => {
  const noOwner = decideAccess({
    userEmail: "owner@example.com",
    ownerEmail: "  ",
    robotUrl: ROBOT,
  });
  assert.equal(noOwner.role, "visitor");
  assert.equal(noOwner.robotUrl, null);

  const noRobot = decideAccess({
    userEmail: "owner@example.com",
    ownerEmail: OWNER,
    robotUrl: "mock",
  });
  assert.equal(noRobot.role, "owner");
  assert.equal(noRobot.demo, true);
  assert.equal(noRobot.robotUrl, null);

  assert.equal(normalizeRobotUrl("javascript:alert(1)"), null);
  assert.equal(normalizeRobotUrl("https://user:pass@roomba.example.ts.net"), null);
});

test("a visitor payload cannot smuggle a robot URL into the client", () => {
  const parsed = parseAccessPayload({
    role: "visitor",
    demo: false,
    robotUrl: ROBOT,
    email: "guest@example.com",
  });
  assert.equal(parsed.role, "visitor");
  assert.equal(parsed.demo, true);
  assert.equal(parsed.robotUrl, null);
});

test("non-owners cannot hit real robot controls", async () => {
  const visitor = decideAccess({
    userEmail: "guest@example.com",
    ownerEmail: OWNER,
    robotUrl: ROBOT,
  });
  let forwarded = 0;
  const response = await handleRobotProxy({
    decision: visitor,
    method: "POST",
    pathSegments: ["control", "stop"],
    forward: async () => {
      forwarded += 1;
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(response.status, 403);
  assert.equal(forwarded, 0);
  const body = await response.json();
  assert.match(body.error, /owner/);
});

test("the owner proxy allows stop and rejects path traversal", async () => {
  const owner = decideAccess({
    userEmail: OWNER,
    ownerEmail: OWNER,
    robotUrl: ROBOT,
  });
  const calls: string[] = [];
  const response = await handleRobotProxy({
    decision: owner,
    method: "POST",
    pathSegments: ["control", "stop"],
    body: "{}",
    forward: async (url, init) => {
      calls.push(`${init.method} ${url}`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [`POST ${ROBOT}/control/stop`]);

  const traversal = authorizeRobotRequest({
    decision: owner,
    method: "GET",
    pathSegments: ["..", "status"],
  });
  assert.equal(traversal.ok, false);
  if (!traversal.ok) assert.equal(traversal.status, 400);

  const unknown = authorizeRobotRequest({
    decision: owner,
    method: "POST",
    pathSegments: ["control", "explode"],
  });
  assert.equal(unknown.ok, false);
});
