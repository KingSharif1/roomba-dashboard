"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRobot } from "@/hooks/use-robot";
import { useRobotMode } from "@/hooks/use-robot-mode";
import * as robot from "@/lib/robot";
import { emitToastOps } from "@/lib/toast-store";
import { probeToastOps, savedToastOps } from "@/lib/toasts";
import { robotSession } from "@/lib/robot-session";
import { 
  Settings, 
  Wifi, 
  Battery, 
  Bell, 
  Shield, 
  Save,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react";

type SecurityStatus = {
  robot: "checking" | "connected" | "api-only" | "mock" | "error";
};

export default function SettingsPage() {
  const [autoReturn, setAutoReturn] = useState(true);
  const [lowBatteryThreshold, setLowBatteryThreshold] = useState(15);
  const [notifications, setNotifications] = useState(true);
  const [testing, setTesting] = useState(false);
  const { connection } = useRobot();
  const [security, setSecurity] = useState<SecurityStatus>({
    robot: "checking",
  });
  const mockMode = useRobotMode();

  const checkSecurityStatus = async () => {
    // Check robot connection (Tailscale membership is the auth — no login)
    if (robot.isMockMode()) {
      setSecurity(prev => ({ ...prev, robot: "mock" }));
    } else {
      try {
        const status = await robot.getStatus();
        setSecurity(prev => ({
          ...prev,
          robot: status.connected ? "connected" : "api-only",
        }));
      } catch {
        setSecurity(prev => ({ ...prev, robot: "error" }));
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot probe; state updates after the requests resolve
    void checkSecurityStatus();
  }, []);

  const handleSave = () => {
    emitToastOps(savedToastOps());
    checkSecurityStatus();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await robot.testConnection();
    const planned = probeToastOps(result, mockMode);
    if (planned.unreachable) robotSession.noteUnreachable();
    else emitToastOps(planned.ops);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent" />
          Settings
        </h1>

        {/* Connection settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Robot Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`px-3 py-1 rounded text-xs font-medium ${
                  mockMode
                    ? "bg-warning/10 text-warning border border-warning/30"
                    : "bg-accent/10 text-accent border border-accent/30"
                }`}
              >
                {connection.label}
              </span>
              <Button variant="secondary" onClick={handleTestConnection} disabled={testing || mockMode}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Behavior settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="w-4 h-4" />
              Robot Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Auto-return</p>
              <button
                onClick={() => setAutoReturn(!autoReturn)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoReturn ? "bg-accent" : "bg-surface-light"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoReturn ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Low battery threshold</p>
                <span className="mono text-sm text-accent">{lowBatteryThreshold}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={lowBatteryThreshold}
                onChange={(e) => setLowBatteryThreshold(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Push</p>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications ? "bg-accent" : "bg-surface-light"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Status
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkSecurityStatus}
              className="text-xs"
            >
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {/* Robot Connection */}
              <div className="flex items-center justify-between">
                <span className="text-muted">Robot Connection</span>
                <div className="flex items-center gap-2">
                  {security.robot === "checking" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                      <span className="text-muted">Checking...</span>
                    </>
                  )}
                  {security.robot === "connected" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-accent">Live</span>
                    </>
                  )}
                  {security.robot === "api-only" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-muted" />
                      <span className="text-muted">Offline</span>
                    </>
                  )}
                  {security.robot === "mock" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-muted" />
                      <span className="text-muted">Demo</span>
                    </>
                  )}
                  {security.robot === "error" && (
                    <>
                      <XCircle className="w-4 h-4 text-muted" />
                      <span className="text-muted">Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tailscale - static for now */}
              <div className="flex items-center justify-between">
                <span className="text-muted">Network</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-accent">Tailscale</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </main>
    </div>
  );
}
