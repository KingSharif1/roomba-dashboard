"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RobotStatus } from "@/lib/types";
import { Play, Square, Home, Loader2 } from "lucide-react";
import { useState } from "react";

interface ControlPanelProps {
  status: RobotStatus;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onDock: () => Promise<void>;
}

export function ControlPanel({ status, onStart, onStop, onDock }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };
  
  const canStart = status.connected && (status.state === "idle" || status.state === "docked");
  const canStop = status.connected && status.state === "cleaning";
  const canDock = status.connected && (status.state === "idle" || status.state === "cleaning");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canStart || loading !== null}
          onClick={() => handleAction("start", onStart)}
        >
          {loading === "start" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Play className="w-5 h-5 mr-2" />
          )}
          START CLEANING
        </Button>
        
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          disabled={!canStop || loading !== null}
          onClick={() => handleAction("stop", onStop)}
        >
          {loading === "stop" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Square className="w-5 h-5 mr-2" />
          )}
          STOP
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={!canDock || loading !== null}
          onClick={() => handleAction("dock", onDock)}
        >
          {loading === "dock" ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Home className="w-5 h-5 mr-2" />
          )}
          RETURN TO DOCK
        </Button>
        
        {!status.connected && (
          <p className="text-xs text-danger text-center mt-2">
            Robot offline — controls disabled
          </p>
        )}
      </CardContent>
    </Card>
  );
}
