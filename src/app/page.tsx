"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatusCard } from "@/components/dashboard/status-card";
import { ControlPanel } from "@/components/dashboard/control-panel";
import { DrivePad } from "@/components/dashboard/drive-pad";
import { MapView } from "@/components/dashboard/map-view";
import { CameraView } from "@/components/dashboard/camera-view";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRobot } from "@/hooks/use-robot";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { noteVoluntarySignOut } from "@/lib/toast-store";
import { formatDuration, formatTimeAgo } from "@/lib/utils";
import { Activity, Zap, Clock, Target } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { status, zones: noGoZones, sessions, loading, commands } = useRobot();

  const handleStart = async () => {
    await commands.start();
  };

  const handleStop = async () => {
    await commands.stop();
  };

  const handleDock = async () => {
    await commands.dock();
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      noteVoluntarySignOut();
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  };

  const lastSession = sessions[0];
  const totalCleaningTime = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const avgCoverage = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.coveragePercent, 0) / sessions.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ConnectionStatus showSimulateDrop />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Sessions</p>
                  <p className="mono text-xl font-bold">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Total Time</p>
                  <p className="mono text-xl font-bold">{formatDuration(totalCleaningTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Avg Coverage</p>
                  <p className="mono text-xl font-bold">{avgCoverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Last Run</p>
                  <p className="mono text-xl font-bold">
                    {lastSession ? formatTimeAgo(lastSession.startedAt) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Status & Controls */}
          <div className="space-y-6">
            <StatusCard status={status} />
            <ControlPanel
              status={status}
              onStart={handleStart}
              onStop={handleStop}
              onDock={handleDock}
            />
            <DrivePad status={status} />
          </div>

          {/* Center column - Map */}
          <div className="lg:col-span-1">
            <MapView status={status} noGoZones={noGoZones} />
          </div>

          {/* Right column - Camera */}
          <div className="lg:col-span-1">
            <CameraView connected={status.connected} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-xs text-muted">
                        {formatTimeAgo(session.startedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="mono text-muted">
                        {formatDuration(session.durationSeconds)}
                      </span>
                      <span className="mono text-accent">
                        {session.coveragePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
