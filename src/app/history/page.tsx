"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CleaningSession } from "@/lib/types";
import * as robot from "@/lib/robot";
import { formatDuration, formatDateTime } from "@/lib/utils";
import { Calendar, Clock, Target, Battery, TrendingUp } from "lucide-react";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<CleaningSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    robot.getSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  const totalTime = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const avgCoverage =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.coveragePercent, 0) / sessions.length
        )
      : 0;
  const avgDuration =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / sessions.length
        )
      : 0;
  const totalBatteryUsed = sessions.reduce(
    (acc, s) => acc + s.batteryUsedPercent,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Total Sessions</p>
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
                  <p className="mono text-xl font-bold">{formatDuration(totalTime)}</p>
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
                  <Battery className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Battery Used</p>
                  <p className="mono text-xl font-bold">{totalBatteryUsed}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions table */}
        <Card>
          <CardHeader>
            <CardTitle>Cleaning Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted" />
                <p className="text-muted">No cleaning sessions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs text-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs text-muted uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="text-left py-3 px-4 text-xs text-muted uppercase tracking-wider">
                        Coverage
                      </th>
                      <th className="text-left py-3 px-4 text-xs text-muted uppercase tracking-wider">
                        Battery Used
                      </th>
                      <th className="text-left py-3 px-4 text-xs text-muted uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-border/50 hover:bg-surface-light transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="mono text-sm">
                            {formatDateTime(session.startedAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="mono text-sm">
                            {formatDuration(session.durationSeconds)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-surface-light rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${session.coveragePercent}%` }}
                              />
                            </div>
                            <span className="mono text-sm text-accent">
                              {session.coveragePercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="mono text-sm">
                            {session.batteryUsedPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              session.endedAt
                                ? "bg-accent/10 text-accent"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {session.endedAt ? "Completed" : "In Progress"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart placeholder */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coverage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border border-border rounded bg-surface-light">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted" />
                <p className="text-sm text-muted">Chart visualization</p>
                <p className="text-xs text-muted/50">Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
