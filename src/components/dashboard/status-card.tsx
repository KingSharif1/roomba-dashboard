"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { BatteryIndicator } from "@/components/ui/battery";
import { formatTimeAgo } from "@/lib/utils";
import type { RobotStatus } from "@/lib/types";
import { Wifi, WifiOff, Clock } from "lucide-react";

interface StatusCardProps {
  status: RobotStatus;
}

export function StatusCard({ status }: StatusCardProps) {
  const isCharging = status.state === "docked" && status.battery < 100;
  
  return (
    <Card glow={status.connected && status.state === "cleaning"}>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <div className="flex items-center gap-1 text-xs">
          {status.connected ? (
            <Wifi className="w-3 h-3 text-accent" />
          ) : (
            <WifiOff className="w-3 h-3 text-danger" />
          )}
          <span className={status.connected ? "text-accent" : "text-danger"}>
            {status.connected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusIndicator state={status.state} connected={status.connected} />
        
        <BatteryIndicator level={status.battery} charging={isCharging} />
        
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="w-4 h-4" />
          <span>Last seen: </span>
          <span className="mono text-foreground">{formatTimeAgo(status.lastSeen)}</span>
        </div>
        
        {status.pose && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <div className="text-center">
              <div className="text-xs text-muted uppercase">X</div>
              <div className="mono text-sm">{status.pose.x.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">Y</div>
              <div className="mono text-sm">{status.pose.y.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted uppercase">θ</div>
              <div className="mono text-sm">{(status.pose.heading * 180 / Math.PI).toFixed(0)}°</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
