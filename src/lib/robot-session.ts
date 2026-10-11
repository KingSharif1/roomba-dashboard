import { parseAccessPayload } from "./access";
import { issueEmergencyStop } from "./connection/emergency-stop";
import { LiveSocket } from "./connection/live-socket";
import { describeConnection } from "./connection/labels";
import * as demo from "./mockRobot";
import { emitToastOps, voluntarySignOutActive } from "./toast-store";
import {
  accessTransitionOps,
  commandToastOps,
  dominantFailure,
  initialConditionMemory,
  initialLinkMemory,
  isStuckStatus,
  noteLinkRecovered,
  noteLinkUnreachable,
  reduceConditionToasts,
  reduceLinkToast,
  type CommandName,
  type ConditionMemory,
  type LinkMemory,
} from "./toasts";
import type {
  AccessRole,
  AccessState,
  CleaningSession,
  CommandResult,
  ConnectionState,
  CustomRoute,
  LearningItem,
  NoGoZone,
  RobotCommands,
  RobotSnapshot,
  RobotStatus,
} from "./types";

const DEMO_MAP = "/mock/map-placeholder.png";
const DEMO_CAMERA = "/mock/camera-placeholder.jpg";
const TICK_MS = 200;

function demoConnection(status: RobotStatus): ConnectionState {
  const phase = demo.getDemoPhase();
  const linkUp = phase === "demo";
  return {
    phase,
    label: describeConnection(phase, linkUp && status.connected),
    linkUp,
    robotReady: linkUp && status.connected,
    attempt: 0,
    demo: true,
  };
}

function buildSnapshot(input: {
  loading: boolean;
  status: RobotStatus;
  connection: ConnectionState;
  access: AccessState;
  robotUrl: string | null;
  zones: NoGoZone[];
  routes: CustomRoute[];
  sessions: CleaningSession[];
  learning: LearningItem[];
}): RobotSnapshot {
  const live = !input.connection.demo && input.robotUrl;
  return {
    loading: input.loading,
    status: input.status,
    connection: input.connection,
    access: input.access,
    zones: input.zones,
    routes: input.routes,
    sessions: input.sessions,
    learning: input.learning,
    mapUrl: live ? `${input.robotUrl}/map` : DEMO_MAP,
    cameraUrl: live ? `${input.robotUrl}/camera/stream` : DEMO_CAMERA,
  };
}

class RobotSession {
  private listeners = new Set<() => void>();
  private holds = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private live: LiveSocket | null = null;
  private robotUrl: string | null = null;
  private demoMode = true;
  private status: RobotStatus = demo.readStatus();
  private zones: NoGoZone[] = demo.readNoGoZones();
  private routes: CustomRoute[] = demo.readRoutes();
  private sessions: CleaningSession[] = demo.readSessions();
  private learning: LearningItem[] = demo.readLearningItems();
  private access: AccessState = {
    role: "unknown",
    email: null,
    demo: true,
    robotConfigured: false,
  };
  private connection: ConnectionState = demoConnection(this.status);
  private linkMemory: LinkMemory = initialLinkMemory();
  private conditionMemory: ConditionMemory = initialConditionMemory();
  private snapshot: RobotSnapshot = buildSnapshot({
    loading: false,
    status: this.status,
    connection: this.connection,
    access: this.access,
    robotUrl: null,
    zones: this.zones,
    routes: this.routes,
    sessions: this.sessions,
    learning: this.learning,
  });

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): RobotSnapshot => this.snapshot;

  isDemo(): boolean {
    return this.demoMode;
  }

  getRobotUrl(): string | null {
    return this.demoMode ? null : this.robotUrl;
  }

  retain(): () => void {
    this.holds += 1;
    if (this.holds === 1) this.begin();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holds -= 1;
      if (this.holds <= 0) {
        this.holds = 0;
        this.end();
      }
    };
  }

  applyAccess = (body: unknown): void => {
    const decision = parseAccessPayload(body);
    const prevRole: AccessRole = this.access.role;
    this.access = {
      role: decision.role,
      email: decision.email,
      demo: decision.demo,
      robotConfigured: decision.robotConfigured,
    };
    emitToastOps(accessTransitionOps(
      prevRole,
      { role: this.access.role, email: this.access.email },
      voluntarySignOutActive(),
    ));
    if (!decision.demo && decision.robotUrl) this.startLive(decision.robotUrl);
    else this.startDemo();
  };

  /** Timeout, DNS, or TLS on a live probe that did not go through a drive command. */
  noteUnreachable = (): void => {
    if (this.demoMode) return;
    const link = noteLinkUnreachable(this.linkMemory);
    this.linkMemory = link.memory;
    emitToastOps(link.ops);
  };

  resume = (): void => {
    if (this.demoMode) return;
    this.live?.resume();
  };

  noteOffline = (): void => {
    if (this.demoMode) return;
    this.live?.noteOffline();
  };

  simulateDrop = (durationMs?: number): void => {
    if (!this.demoMode) return;
    demo.simulateConnectionDrop(durationMs);
    this.syncDemo();
  };

  /** Demo mutations that bypass commands (learning labels) republish the snapshot. */
  noteDemoMutation = (): void => {
    if (this.demoMode) this.syncDemo();
  };

  commands: RobotCommands = {
    start: () => this.start(),
    stop: () => this.stop(),
    dock: () => this.dock(),
    drive: (linear, angular) => this.drive(linear, angular),
  };

  private begin(): void {
    if (this.timer) return;
    this.lastTick = Date.now();
    this.syncDemo();
    this.timer = setInterval(() => this.onTick(), TICK_MS);
  }

  private end(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.live?.stop();
    this.live = null;
  }

  private onTick(): void {
    if (!this.demoMode) return;
    const now = Date.now();
    const dt = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    demo.tickDemo(now, dt);
    this.syncDemo();
  }

  private syncDemo(): void {
    if (!this.demoMode) return;
    this.status = demo.readStatus();
    this.connection = demoConnection(this.status);
    this.publish();
  }

  private startLive(url: string): void {
    if (!this.demoMode && this.robotUrl === url && this.live) {
      this.publish();
      return;
    }
    this.live?.stop();
    this.demoMode = false;
    this.robotUrl = url;
    this.status = {
      battery: 0,
      state: "idle",
      connected: false,
      lastSeen: new Date().toISOString(),
      pose: null,
    };
    this.connection = {
      phase: "connecting",
      label: describeConnection("connecting", false),
      linkUp: false,
      robotReady: false,
      attempt: 0,
      demo: false,
    };
    this.zones = [];
    this.routes = [];
    this.sessions = [];
    this.learning = [];
    this.publish();
    this.live = new LiveSocket({
      url,
      onStatus: (status) => {
        this.status = status;
        this.connection = {
          phase: "connected",
          label: describeConnection("connected", status.connected),
          linkUp: true,
          robotReady: status.connected,
          attempt: 0,
          demo: false,
        };
        this.publish();
      },
      onPhase: (phase, attempt) => {
        if (phase !== "connected") {
          this.status = { ...this.status, connected: false, state: "error" };
        }
        this.connection = {
          phase,
          label: describeConnection(phase, phase === "connected" && this.status.connected),
          linkUp: phase === "connected",
          robotReady: phase === "connected" && this.status.connected,
          attempt,
          demo: false,
        };
        this.publish();
      },
    });
    this.live.start();
    void this.refreshLiveCollections();
  }

  private startDemo(): void {
    const wasDemo = this.demoMode;
    this.live?.stop();
    this.live = null;
    this.robotUrl = null;
    this.demoMode = true;
    if (!wasDemo) this.lastTick = Date.now();
    this.syncDemo();
  }

  private publish(): void {
    if (this.demoMode) this.captureDemoCollections();
    this.snapshot = buildSnapshot({
      loading: false,
      status: this.status,
      connection: this.connection,
      access: this.access,
      robotUrl: this.getRobotUrl(),
      zones: this.zones,
      routes: this.routes,
      sessions: this.sessions,
      learning: this.learning,
    });
    for (const listener of this.listeners) listener();
    this.noteLinkAndCondition();
  }

  private noteLinkAndCondition(): void {
    const link = reduceLinkToast(this.linkMemory, {
      demo: this.connection.demo,
      phase: this.connection.phase,
    });
    this.linkMemory = link.memory;
    const condition = reduceConditionToasts(this.conditionMemory, {
      demo: this.connection.demo,
      linkUp: this.connection.linkUp,
      state: this.status.state,
      battery: this.status.battery,
      charging: this.status.state === "docked" && this.status.battery < 100,
      stuck: isStuckStatus(this.status),
    });
    this.conditionMemory = condition.memory;
    emitToastOps([...link.ops, ...condition.ops]);
  }

  private reportCommand(command: CommandName, result: CommandResult): CommandResult {
    const planned = commandToastOps(command, result, this.demoMode);
    let ops = planned.ops;
    if (planned.unreachable) {
      const link = noteLinkUnreachable(this.linkMemory);
      this.linkMemory = link.memory;
      ops = [...link.ops, ...ops];
    } else if (result.success && !this.demoMode) {
      const recovered = noteLinkRecovered(this.linkMemory);
      this.linkMemory = recovered.memory;
      ops = [...ops, ...recovered.ops];
    }
    emitToastOps(ops);
    return result;
  }

  private async requestLive(path: string, body?: unknown): Promise<CommandResult> {
    const base = this.getRobotUrl();
    if (!base) return { success: false, reason: "rejected" };
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (res.status === 401) return { success: false, status: 401, reason: "unauthorized" };
      if (res.status === 403) return { success: false, status: 403, reason: "forbidden" };
      if (!res.ok) return { success: false, status: res.status, reason: "rejected" };
      const data: unknown = await res.json().catch(() => ({ success: true }));
      const rejected = Boolean(
        data && typeof data === "object" && "success" in data && (data as { success: unknown }).success === false,
      );
      return rejected
        ? { success: false, status: res.status, reason: "rejected" }
        : { success: true, status: res.status };
    } catch {
      return { success: false, reason: "unreachable" };
    }
  }

  private captureDemoCollections(): void {
    this.zones = demo.readNoGoZones();
    this.routes = demo.readRoutes();
    this.sessions = demo.readSessions();
    this.learning = demo.readLearningItems();
  }

  private async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const base = this.getRobotUrl();
    if (!base) throw new Error("Demo mode");
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  }

  private async refreshLiveCollections(): Promise<void> {
    const url = this.robotUrl;
    if (this.demoMode || !url) return;
    const load = async <T>(path: string): Promise<T | null> => {
      try {
        return await this.fetchJson<T>(path);
      } catch {
        return null;
      }
    };
    const [sessions, zones, routes, learning] = await Promise.all([
      load<CleaningSession[]>("/sessions"),
      load<NoGoZone[]>("/zones"),
      load<CustomRoute[]>("/routes"),
      load<LearningItem[]>("/learning"),
    ]);
    if (this.demoMode || this.robotUrl !== url) return;
    if (sessions) this.sessions = sessions;
    if (zones) this.zones = zones;
    if (routes) this.routes = routes;
    if (learning) this.learning = learning;
    this.publish();
  }

  private async start(): Promise<CommandResult> {
    if (this.demoMode) {
      const result = await demo.startCleaning();
      this.syncDemo();
      return this.reportCommand("start", result);
    }
    return this.reportCommand("start", await this.requestLive("/control/start"));
  }

  private async stop(): Promise<CommandResult> {
    const attempts: CommandResult[] = [];
    const result = await issueEmergencyStop({
      demo: this.demoMode,
      socketOpen: this.live?.isOpen ?? false,
      sendSocket: (payload) => {
        this.live?.send(payload);
      },
      postStop: async () => {
        const outcome = await this.requestLive("/control/stop");
        attempts.push(outcome);
        return { success: outcome.success };
      },
      postZeroDrive: async () => {
        const outcome = await this.requestLive("/drive", { linear: 0, angular: 0 });
        attempts.push(outcome);
        return { success: outcome.success };
      },
      applyDemoStop: () => demo.demoEmergencyStop(),
    });
    if (this.demoMode) this.syncDemo();
    const feedback = result.success ? { success: true } : dominantFailure(attempts);
    return this.reportCommand("stop", feedback);
  }

  private async dock(): Promise<CommandResult> {
    if (this.demoMode) {
      const result = await demo.returnToDock();
      this.syncDemo();
      return this.reportCommand("dock", result);
    }
    return this.reportCommand("dock", await this.requestLive("/control/dock"));
  }

  private async drive(linear: number, angular: number): Promise<CommandResult> {
    if (this.demoMode) {
      const ok = demo.setDemoDrive(linear, angular);
      this.syncDemo();
      return this.reportCommand("drive", { success: ok, reason: ok ? undefined : "rejected" });
    }
    return this.reportCommand("drive", await this.requestLive("/drive", { linear, angular }));
  }
}

export const robotSession = new RobotSession();

export function retainRobotSession(): () => void {
  return robotSession.retain();
}
