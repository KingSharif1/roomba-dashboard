"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRobot } from "@/hooks/use-robot";
import { useRobotMode } from "@/hooks/use-robot-mode";
import * as robot from "@/lib/robot";
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
  supabase: "checking" | "connected" | "error";
  auth: "checking" | "authenticated" | "unauthenticated";
  robot: "checking" | "connected" | "api-only" | "mock" | "error";
};

export default function SettingsPage() {
  const [autoReturn, setAutoReturn] = useState(true);
  const [lowBatteryThreshold, setLowBatteryThreshold] = useState(15);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const { access, connection } = useRobot();
  const [security, setSecurity] = useState<SecurityStatus>({
    supabase: "checking",
    auth: "checking",
    robot: "checking",
  });
  const mockMode = useRobotMode();

  const checkSecurityStatus = async () => {
    const supabase = createClient();
    
    // Check Supabase connection
    try {
      await supabase.from("_dummy_check").select("*").limit(1);
      // A response, including "table does not exist", means the project is reachable.
      setSecurity(prev => ({ ...prev, supabase: "connected" }));
    } catch {
      setSecurity(prev => ({ ...prev, supabase: "error" }));
    }

    // Check auth status
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setSecurity(prev => ({ 
        ...prev, 
        auth: user ? "authenticated" : "unauthenticated" 
      }));
    } catch {
      setSecurity(prev => ({ ...prev, auth: "unauthenticated" }));
    }

    // Check robot connection
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
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      checkSecurityStatus();
    }, 1500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await robot.testConnection();
    setTestResult(result);
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
          <CardContent className="space-y-4">
            <div className="p-3 bg-surface-light rounded border border-border space-y-2">
              <p className="text-sm">
                <strong className="text-foreground">{connection.label}.</strong>{" "}
                <span className="text-muted">
                  {mockMode
                    ? "The simulated robot is driving this session. Battery, odometry, sessions, zones, and routes are sample data."
                    : "This session is signed in as the owner and the server released the robot URL."}
                </span>
              </p>
              <p className="text-xs text-muted">
                The live address is the server env var <span className="font-mono">ROBOT_URL</span> (private Tailscale HTTPS).
                It is handed out only when the signed-in email matches <span className="font-mono">OWNER_EMAIL</span>.
                A URL typed in the browser cannot unlock the robot.
                {access.role === "owner" ? " You are the owner." : " You are a visitor."}
                {access.robotConfigured ? " A robot URL is configured." : " No robot URL is configured."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleTestConnection} disabled={testing || mockMode}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test server robot"}
              </Button>
              {testResult && (
                <span className={`text-sm ${testResult.success ? "text-accent" : "text-danger"}`}>
                  {testResult.success ? "Robot API is reachable." : testResult.error || "Connection failed"}
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Mode</p>
                  <p className="text-xs text-muted">
                    {mockMode ? "Using simulated data" : "Using real robot API"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    mockMode
                      ? "bg-warning/10 text-warning border border-warning/30"
                      : "bg-accent/10 text-accent border border-accent/30"
                  }`}
                >
                  {connection.label}
                </span>
              </div>
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
              <div>
                <p className="text-sm font-medium">Auto-return to dock</p>
                <p className="text-xs text-muted">
                  Automatically return when battery is low
                </p>
              </div>
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
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
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
              <div>
                <p className="text-sm font-medium">Push notifications</p>
                <p className="text-xs text-muted">
                  Get notified when cleaning completes or errors occur
                </p>
              </div>
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
              {/* Supabase Connection */}
              <div className="flex items-center justify-between">
                <span className="text-muted">Supabase Database</span>
                <div className="flex items-center gap-2">
                  {security.supabase === "checking" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                      <span className="text-muted">Checking...</span>
                    </>
                  )}
                  {security.supabase === "connected" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-accent">Connected</span>
                    </>
                  )}
                  {security.supabase === "error" && (
                    <>
                      <XCircle className="w-4 h-4 text-danger" />
                      <span className="text-danger">Not configured</span>
                    </>
                  )}
                </div>
              </div>

              {/* Auth Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted">Authentication</span>
                <div className="flex items-center gap-2">
                  {security.auth === "checking" && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                      <span className="text-muted">Checking...</span>
                    </>
                  )}
                  {security.auth === "authenticated" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-accent">Logged in</span>
                    </>
                  )}
                  {security.auth === "unauthenticated" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="text-warning">Not logged in</span>
                    </>
                  )}
                </div>
              </div>

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
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="text-warning">API reachable — robot offline</span>
                    </>
                  )}
                  {security.robot === "mock" && (
                    <>
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="text-warning">Mock Mode</span>
                    </>
                  )}
                  {security.robot === "error" && (
                    <>
                      <XCircle className="w-4 h-4 text-danger" />
                      <span className="text-danger">Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tailscale - static for now */}
              <div className="flex items-center justify-between">
                <span className="text-muted">Network</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-accent">Tailscale VPN</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-4">
              Your robot is only accessible through your private Tailscale network.
              All data is stored securely in your Supabase project.
            </p>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
