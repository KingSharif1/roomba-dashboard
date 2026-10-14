import assert from "node:assert/strict";
import { test } from "node:test";
import { LiveSocket, type StatusSocket } from "../src/lib/connection/live-socket.ts";
import type { RobotStatus } from "../src/lib/types.ts";

class FakeClock {
  now = 0;
  private tasks: { id: number; at: number; fn: () => void; cancelled: boolean }[] = [];
  private nextId = 1;

  setTimer = (fn: () => void, ms: number) => {
    const task = { id: this.nextId++, at: this.now + ms, fn, cancelled: false };
    this.tasks.push(task);
    return { cancel: () => { task.cancelled = true; } };
  };

  advance(ms: number) {
    const target = this.now + ms;
    for (;;) {
      const pending = this.tasks
        .filter((task) => !task.cancelled && task.at <= target)
        .sort((a, b) => a.at - b.at || a.id - b.id);
      const next = pending[0];
      if (!next) break;
      this.now = next.at;
      next.cancelled = true;
      next.fn();
    }
    this.now = target;
  }
}

class FakeSocket implements StatusSocket {
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(readonly url: string) {}

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  serverClose() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.();
  }

  close() {
    this.serverClose();
  }

  send(data: string) {
    if (this.readyState !== 1) throw new Error("socket not open");
    this.sent.push(data);
  }
}

const STATUS: RobotStatus = {
  battery: 80,
  state: "idle",
  connected: true,
  lastSeen: "2026-01-01T00:00:00.000Z",
  pose: { x: 1, y: 2, heading: 0 },
};

function harness(staleMs = 1_000) {
  const clock = new FakeClock();
  const sockets: FakeSocket[] = [];
  const phases: string[] = [];
  const statuses: RobotStatus[] = [];
  const client = new LiveSocket({
    url: "https://roomba.example.ts.net",
    staleMs,
    createSocket: (url) => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    setTimer: clock.setTimer,
    random: () => 0.5,
    onStatus: (status) => statuses.push(status),
    onPhase: (phase) => phases.push(phase),
  });
  return { clock, sockets, phases, statuses, client };
}

test("connects to wss /live and publishes status frames", () => {
  const { sockets, phases, statuses, client } = harness();
  client.start();
  assert.equal(sockets[0].url, "wss://roomba.example.ts.net/live");
  assert.equal(phases.at(-1), "connecting");
  sockets[0].open();
  assert.equal(phases.at(-1), "connected");
  sockets[0].message(STATUS);
  assert.equal(statuses[0].battery, 80);
  assert.equal(statuses[0].activity, "idle");
  sockets[0].message("not-json");
  sockets[0].message({ battery: "high", connected: true, state: "idle" });
  assert.equal(statuses.length, 1);
  sockets[0].message({
    ...STATUS,
    state: "cleaning",
    activity: "moving",
    charging: false,
    chargingState: "off",
    voltage: 14.4,
    current: "nope",
    temperature: 32,
  });
  assert.equal(statuses[1].activity, "moving");
  assert.equal(statuses[1].voltage, 14.4);
  assert.equal(statuses[1].temperature, 32);
  assert.equal(statuses[1].chargingState, "off");
  assert.equal(statuses[1].current, undefined);
});

test("silence past the heartbeat closes the socket and schedules a reconnect", () => {
  const { clock, sockets, phases, client } = harness(1_000);
  client.start();
  sockets[0].open();
  sockets[0].message(STATUS);
  clock.advance(900);
  sockets[0].message(STATUS);
  clock.advance(900);
  assert.equal(sockets.length, 1);
  clock.advance(100);
  assert.equal(sockets[0].readyState, 3);
  assert.equal(phases.at(-1), "reconnecting");
  clock.advance(250);
  assert.equal(sockets.length, 2);
});

test("an unexpected close reconnects with backoff, then resume connects immediately", () => {
  const { clock, sockets, phases, client } = harness();
  client.start();
  sockets[0].open();
  sockets[0].serverClose();
  assert.equal(phases.at(-1), "reconnecting");
  assert.equal(sockets.length, 1);

  client.resume();
  assert.equal(sockets.length, 2);
  assert.equal(phases.at(-1), "connecting");
  clock.advance(4_000);
  assert.equal(sockets.length, 2);
});

test("a handshake that never opens times out and reconnects", () => {
  const { clock, sockets, phases, client } = harness();
  client.start();
  assert.equal(phases.at(-1), "connecting");
  clock.advance(4_999);
  assert.equal(sockets.length, 1);
  clock.advance(1);
  assert.equal(sockets[0].readyState, 3);
  assert.equal(phases.at(-1), "reconnecting");
  clock.advance(250);
  assert.equal(sockets.length, 2);
});

test("the browser going offline pauses retries and reports Robot offline", () => {
  const { clock, sockets, phases, client } = harness();
  client.start();
  sockets[0].open();
  client.noteOffline();
  assert.equal(phases.at(-1), "offline");
  clock.advance(20_000);
  assert.equal(sockets.length, 1);
  client.resume();
  assert.equal(sockets.length, 2);
  assert.equal(phases.at(-1), "connecting");
});

test("repeated failures surface as offline while retries continue", () => {
  const { clock, sockets, phases, client } = harness();
  client.start();
  sockets[0].serverClose();
  clock.advance(250);
  sockets[1].serverClose();
  clock.advance(500);
  sockets[2].serverClose();
  assert.equal(phases.at(-1), "offline");
  clock.advance(1_000);
  assert.equal(sockets.length, 4);
});
