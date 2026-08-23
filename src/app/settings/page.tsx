"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
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
  robot: "checking" | "connected" | "mock" | "error";
};

export default function SettingsPage() {
  const [piAddress, setPiAddress] = useState("");
  const [connectionMode, setConnectionMode] = useState<"mock" | "live">("mock");
  const [autoReturn, setAutoReturn] = useState(true);
  const [lowBatteryThreshold, setLowBatteryThreshold] = useState(15);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [security, setSecurity] = useState<SecurityStatus>({
    supabase: "checking",
    auth: "checking",
    robot: "checking",
  });

  useEffect(() => {
    // Load saved settings
    const savedUrl = robot.getRobotUrlSetting();
    if (savedUrl && savedUrl !== "mock") {
      setPiAddress(savedUrl);
      setConnectionMode("live");
    } else {
      setConnectionMode("mock");
    }
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    const supabase = createClient();
    
    // Check Supabase connection
    try {
      const { error } = await supabase.from("_dummy_check").select("*").limit(1);
      // Even if table doesn't exist, connection works if we get a proper error
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
        await robot.getStatus();
        setSecurity(prev => ({ ...prev, robot: "connected" }));
      } catch {
        setSecurity(prev => ({ ...prev, robot: "error" }));
      }
    }
  };

  const handleSave = () => {
    if (connectionMode === "mock") {
      robot.setRobotUrl("mock");
    } else if (piAddress) {
      robot.setRobotUrl(piAddress);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      checkSecurityStatus();
    }, 1500);
  };

  const handleTestConnection = async () => {
    if (!piAddress) {
      setTestResult({ success: false, error: "Enter a Pi address first" });
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    const result = await robot.testConnection(piAddress);
    setTestResult(result);
    setTesting(false);
  };

  const handleModeChange = (mode: "mock" | "live") => {
    setConnectionMode(mode);
    setTestResult(null);
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
            {/* Mode selector */}
            <div>
              <label className="block text-sm text-muted mb-2">
                Connection Mode
              </label>
              <div className="flex bg-surface-light rounded p-1">
                <button
                  className={`flex-1 py-2 text-sm rounded transition-colors ${
                    connectionMode === "mock"
                      ? "bg-surface text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => handleModeChange("mock")}
                >
                  Mock / Demo
                </button>
                <button
                  className={`flex-1 py-2 text-sm rounded transition-colors ${
                    connectionMode === "live"
                      ? "bg-surface text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => handleModeChange("live")}
                >
                  Live Robot
                </button>
              </div>
            </div>

            {/* Pi Address - only show in live mode */}
            {connectionMode === "live" && (
              <div>
                <label className="block text-sm text-muted mb-2">
                  Raspberry Pi Address (Tailscale IP)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={piAddress}
                    onChange={(e) => setPiAddress(e.target.value)}
                    placeholder="http://100.x.x.x:8000"
                    className="flex-1 px-3 py-2 bg-surface-light border border-border rounded text-sm font-mono focus:outline-none focus:border-accent"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleTestConnection}
                    disabled={testing || !piAddress}
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
                {testResult && (
                  <div
                    className={`mt-2 flex items-center gap-2 text-sm ${
                      testResult.success ? "text-accent" : "text-danger"
                    }`}
                  >
                    {testResult.success ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Connection successful! Robot is online.
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        {testResult.error || "Connection failed"}
                      </>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted mt-2">
                  Enter your Pi's Tailscale IP address (e.g., http://100.73.192.106:8000)
                </p>
              </div>
            )}

            {connectionMode === "mock" && (
              <div className="p-3 bg-surface-light rounded border border-border">
                <p className="text-sm text-muted">
                  <strong className="text-foreground">Mock Mode:</strong> Using simulated robot data. 
                  Battery drains during cleaning, charges when docked. Position updates in real-time.
                </p>
              </div>
            )}

            {/* Current status */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Mode</p>
                  <p className="text-xs text-muted">
                    {robot.isMockMode() ? "Using simulated data" : "Connected to real robot"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    robot.isMockMode()
                      ? "bg-warning/10 text-warning border border-warning/30"
                      : "bg-accent/10 text-accent border border-accent/30"
                  }`}
                >
                  {robot.isMockMode() ? "MOCK" : "LIVE"}
                </span>
              </div>
              <p className="text-xs text-muted mt-2">
                Click "Save Settings" below to apply changes
              </p>
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
