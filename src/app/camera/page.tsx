"use client";

import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RobotStatus } from "@/lib/types";
import * as robot from "@/lib/robot";
import { Video, VideoOff, Maximize2, Camera, Download } from "lucide-react";

export default function CameraPage() {
  const [status, setStatus] = useState<RobotStatus | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    robot.getStatus().then(setStatus);
    const cleanup = robot.startLiveUpdates(setStatus);
    return cleanup;
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!fullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  const connected = status?.connected ?? false;

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main camera view */}
          <div className="lg:col-span-3" ref={containerRef}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Live Camera Feed</CardTitle>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      <Video className="w-4 h-4 text-accent" />
                      <span className="text-xs text-accent">LIVE</span>
                    </>
                  ) : (
                    <>
                      <VideoOff className="w-4 h-4 text-danger" />
                      <span className="text-xs text-danger">OFFLINE</span>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-surface-light rounded border border-border overflow-hidden">
                  {connected ? (
                    <>
                      {/* Placeholder - would be <img src={robot.getCameraUrl()} /> for real MJPEG */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-accent/30 flex items-center justify-center relative">
                            <Video className="w-12 h-12 text-accent/50" />
                            <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
                          </div>
                          <p className="text-muted">Camera feed placeholder</p>
                          <p className="text-xs text-muted/50 mt-1">
                            Real MJPEG stream: {robot.getCameraUrl()}
                          </p>
                        </div>
                      </div>

                      {/* Overlay UI */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Scanlines */}
                        <div className="absolute inset-0 scanlines opacity-20" />

                        {/* Corner brackets */}
                        <svg className="absolute inset-0 w-full h-full">
                          <path
                            d="M 20 5 L 5 5 L 5 20"
                            fill="none"
                            stroke="#00ff9d"
                            strokeWidth="2"
                          />
                          <path
                            d="M calc(100% - 20px) 5 L calc(100% - 5px) 5 L calc(100% - 5px) 20"
                            fill="none"
                            stroke="#00ff9d"
                            strokeWidth="2"
                          />
                          <path
                            d="M 5 calc(100% - 20px) L 5 calc(100% - 5px) L 20 calc(100% - 5px)"
                            fill="none"
                            stroke="#00ff9d"
                            strokeWidth="2"
                          />
                          <path
                            d="M calc(100% - 5px) calc(100% - 20px) L calc(100% - 5px) calc(100% - 5px) L calc(100% - 20px) calc(100% - 5px)"
                            fill="none"
                            stroke="#00ff9d"
                            strokeWidth="2"
                          />
                        </svg>

                        {/* Recording indicator */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded">
                          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                          <span className="mono text-sm text-muted">REC</span>
                        </div>

                        {/* Timestamp */}
                        <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1.5 rounded">
                          <span className="mono text-sm text-muted">
                            {new Date().toLocaleString()}
                          </span>
                        </div>

                        {/* Status overlay */}
                        <div className="absolute top-4 right-4 bg-background/80 px-3 py-1.5 rounded">
                          <span className="mono text-sm text-accent">
                            {status?.state.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted" />
                        <p className="text-muted">No camera feed available</p>
                        <p className="text-xs text-muted/50 mt-1">Robot is offline</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Camera info */}
            <Card>
              <CardHeader>
                <CardTitle>Camera Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Status</span>
                  <span className={connected ? "text-accent" : "text-danger"}>
                    {connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Format</span>
                  <span className="mono">MJPEG</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Resolution</span>
                  <span className="mono">640x480</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">FPS</span>
                  <span className="mono">15</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!connected}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Snapshot
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!connected}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Frame
                </Button>
              </CardContent>
            </Card>

            {/* Robot position */}
            {status?.pose && (
              <Card>
                <CardHeader>
                  <CardTitle>Robot Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase">X</div>
                      <div className="mono text-lg">{status.pose.x.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase">Y</div>
                      <div className="mono text-lg">{status.pose.y.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase">θ</div>
                      <div className="mono text-lg">
                        {((status.pose.heading * 180) / Math.PI).toFixed(0)}°
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
