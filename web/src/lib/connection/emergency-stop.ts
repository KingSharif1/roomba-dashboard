export type StopVia = "demo" | "rest" | "socket+rest";

export type EmergencyStopDeps = {
  demo: boolean;
  socketOpen: boolean;
  sendSocket: (payload: string) => void;
  postStop: () => Promise<{ success: boolean }>;
  postZeroDrive: () => Promise<{ success: boolean }>;
  applyDemoStop: () => void;
};

/**
 * Stop the robot immediately.
 *
 * The Pi's `/live` socket only streams status (see robot_api.py). A socket
 * frame is still sent when the socket is open so a later bidirectional
 * protocol works, but REST `POST /control/stop` always runs as well.
 * When the socket is down, that REST call is not queued behind reconnect.
 */
export async function issueEmergencyStop(deps: EmergencyStopDeps): Promise<{ success: boolean; via: StopVia }> {
  if (deps.demo) {
    deps.applyDemoStop();
    return { success: true, via: "demo" };
  }

  let socketSent = false;
  if (deps.socketOpen) {
    try {
      deps.sendSocket(JSON.stringify({ type: "stop" }));
      socketSent = true;
    } catch {
      socketSent = false;
    }
  }

  const [stopResult, driveResult] = await Promise.all([
    deps.postStop().catch(() => ({ success: false })),
    deps.postZeroDrive().catch(() => ({ success: false })),
  ]);

  return {
    success: stopResult.success || driveResult.success,
    via: socketSent ? "socket+rest" : "rest",
  };
}
