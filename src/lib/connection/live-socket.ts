import { normalizeRobotStatus } from "../robot-status";
import type { ConnectionPhase, RobotStatus } from "../types";
import { backoffDelayMs } from "./backoff";
import { toWebSocketUrl } from "./ws-url";

export const LIVE_STALE_MS = 3_000;
/** A handshake that never opens is the same kind of outage as a dropped socket. */
export const LIVE_CONNECT_TIMEOUT_MS = 5_000;
/** After this many failed attempts the label becomes "Robot offline" while retries continue. */
export const LIVE_OFFLINE_AFTER_ATTEMPTS = 3;

const SOCKET_OPEN = 1;

export type TimerHandle = { cancel: () => void };

export type StatusSocket = {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
};

export type LiveSocketOptions = {
  url: string;
  staleMs?: number;
  connectTimeoutMs?: number;
  createSocket?: (url: string) => StatusSocket;
  setTimer?: (fn: () => void, ms: number) => TimerHandle;
  random?: () => number;
  onStatus: (status: RobotStatus) => void;
  onPhase: (phase: Exclude<ConnectionPhase, "demo">, attempt: number) => void;
};

function defaultTimer(fn: () => void, ms: number): TimerHandle {
  const id = setTimeout(fn, ms);
  return { cancel: () => clearTimeout(id) };
}

/**
 * One WebSocket to the Pi's `/live` status stream.
 * Reconnects with jittered backoff, treats silence as a dead link, and
 * reconnects immediately when `resume()` is called (tab visible / back online).
 */
export class LiveSocket {
  private readonly wsUrl: string;
  private readonly staleMs: number;
  private readonly connectTimeoutMs: number;
  private readonly createSocket: (url: string) => StatusSocket;
  private readonly setTimer: (fn: () => void, ms: number) => TimerHandle;
  private readonly random: () => number;
  private readonly onStatus: (status: RobotStatus) => void;
  private readonly onPhase: (phase: Exclude<ConnectionPhase, "demo">, attempt: number) => void;

  private socket: StatusSocket | null = null;
  private generation = 0;
  private attempt = 0;
  private stopped = false;
  private browserOffline = false;
  private retryTimer: TimerHandle | null = null;
  private staleTimer: TimerHandle | null = null;
  private connectTimer: TimerHandle | null = null;
  private phase: Exclude<ConnectionPhase, "demo"> = "connecting";

  constructor(options: LiveSocketOptions) {
    this.wsUrl = toWebSocketUrl(options.url);
    this.staleMs = options.staleMs ?? LIVE_STALE_MS;
    this.connectTimeoutMs = options.connectTimeoutMs ?? LIVE_CONNECT_TIMEOUT_MS;
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url) as unknown as StatusSocket);
    this.setTimer = options.setTimer ?? defaultTimer;
    this.random = options.random ?? Math.random;
    this.onStatus = options.onStatus;
    this.onPhase = options.onPhase;
  }

  start(): void {
    this.stopped = false;
    this.attempt = 0;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearRetry();
    this.dropSocket();
  }

  /** Tab became visible or the browser came back online. Retry now. */
  resume(): void {
    if (this.stopped) return;
    this.browserOffline = false;
    if (this.phase === "connected" && this.socket?.readyState === SOCKET_OPEN) {
      this.armStale();
      return;
    }
    this.clearRetry();
    this.attempt = 0;
    this.dropSocket();
    this.connect();
  }

  noteOffline(): void {
    if (this.stopped) return;
    this.browserOffline = true;
    this.clearRetry();
    this.dropSocket();
    this.setPhase("offline");
  }

  get isOpen(): boolean {
    return this.socket?.readyState === SOCKET_OPEN;
  }

  send(payload: string): boolean {
    if (!this.isOpen || !this.socket) return false;
    try {
      this.socket.send(payload);
      return true;
    } catch {
      return false;
    }
  }

  private connect(): void {
    if (this.stopped || this.browserOffline) return;
    this.dropSocket();
    const generation = ++this.generation;
    this.setPhase(this.attempt === 0 ? "connecting" : "reconnecting");

    let socket: StatusSocket;
    try {
      socket = this.createSocket(this.wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.armConnectTimeout();

    socket.onopen = () => {
      if (generation !== this.generation || this.stopped) return;
      this.clearConnectTimeout();
      this.attempt = 0;
      this.setPhase("connected");
      this.armStale();
    };

    socket.onmessage = (event) => {
      if (generation !== this.generation || this.stopped) return;
      this.armStale();
      try {
        const parsed: unknown = JSON.parse(String(event.data));
        const status = normalizeRobotStatus(parsed);
        if (status) this.onStatus(status);
      } catch {
        // Ignore a bad frame. Silence is what triggers reconnect.
      }
    };

    socket.onerror = () => {
      if (generation !== this.generation) return;
      try {
        socket.close();
      } catch {
        this.scheduleReconnect();
      }
    };

    socket.onclose = () => {
      if (generation !== this.generation) return;
      this.socket = null;
      this.clearStale();
      this.clearConnectTimeout();
      if (this.stopped || this.browserOffline) return;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.browserOffline) return;
    this.attempt += 1;
    this.clearRetry();
    this.setPhase(this.attempt >= LIVE_OFFLINE_AFTER_ATTEMPTS ? "offline" : "reconnecting");
    const delay = backoffDelayMs(this.attempt - 1, this.random);
    this.retryTimer = this.setTimer(() => {
      this.retryTimer = null;
      this.connect();
    }, delay);
  }

  private armConnectTimeout(): void {
    this.clearConnectTimeout();
    this.connectTimer = this.setTimer(() => {
      this.connectTimer = null;
      if (this.stopped || this.phase === "connected") return;
      const socket = this.socket;
      if (!socket) {
        this.scheduleReconnect();
        return;
      }
      try {
        socket.close();
      } catch {
        this.scheduleReconnect();
      }
    }, this.connectTimeoutMs);
  }

  private clearConnectTimeout(): void {
    this.connectTimer?.cancel();
    this.connectTimer = null;
  }

  private armStale(): void {
    this.clearStale();
    this.staleTimer = this.setTimer(() => {
      this.staleTimer = null;
      // No status frame within the heartbeat window. Drop the socket so onclose reconnects.
      try {
        this.socket?.close();
      } catch {
        this.scheduleReconnect();
      }
    }, this.staleMs);
  }

  private setPhase(phase: Exclude<ConnectionPhase, "demo">): void {
    this.phase = phase;
    this.onPhase(phase, this.attempt);
  }

  private clearRetry(): void {
    this.retryTimer?.cancel();
    this.retryTimer = null;
  }

  private clearStale(): void {
    this.staleTimer?.cancel();
    this.staleTimer = null;
  }

  private dropSocket(): void {
    this.generation += 1;
    this.clearStale();
    this.clearConnectTimeout();
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    try {
      socket.close();
    } catch {
      // Already closed.
    }
  }
}
