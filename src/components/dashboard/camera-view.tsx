"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Video, VideoOff } from "lucide-react";
import { useState } from "react";

interface CameraViewProps {
  streamUrl?: string;
  connected: boolean;
}

export function CameraView({ streamUrl, connected }: CameraViewProps) {
  const [error, setError] = useState(false);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Camera Feed</CardTitle>
        <div className="flex items-center gap-1 text-xs">
          {connected && !error ? (
            <>
              <Video className="w-3 h-3 text-accent" />
              <span className="text-accent">LIVE</span>
            </>
          ) : (
            <>
              <VideoOff className="w-3 h-3 text-danger" />
              <span className="text-danger">OFFLINE</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-surface-light rounded border border-border overflow-hidden">
          {connected && !error ? (
            <>
              {/* Placeholder static noise effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-light flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-accent/30 flex items-center justify-center">
                    <Video className="w-8 h-8 text-accent/50" />
                  </div>
                  <p className="text-muted text-sm">Camera feed placeholder</p>
                  <p className="text-xs text-muted/50 mt-1">MJPEG stream when connected</p>
                </div>
              </div>
              
              {/* Scanline overlay */}
              <div className="absolute inset-0 scanlines opacity-30" />
              
              {/* Corner frame */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  <path
                    d="M 0 20 L 0 0 L 20 0"
                    fill="none"
                    stroke="#00ff9d"
                    strokeWidth="2"
                  />
                  <path
                    d="M 100% 20 L 100% 0 L calc(100% - 20px) 0"
                    fill="none"
                    stroke="#00ff9d"
                    strokeWidth="2"
                    style={{ transform: "translateX(-2px)" }}
                  />
                </svg>
              </div>
              
              {/* Recording indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-background/80 px-2 py-1 rounded text-xs">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span className="mono text-muted">REC</span>
              </div>
              
              {/* Timestamp */}
              <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded">
                <span className="mono text-xs text-muted">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <VideoOff className="w-12 h-12 mx-auto mb-2 text-muted" />
                <p className="text-muted text-sm">No camera feed</p>
                <p className="text-xs text-muted/50">Robot offline</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
