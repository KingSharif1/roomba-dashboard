"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { RobotStatus, NoGoZone } from "@/lib/types";
import { useEffect, useRef } from "react";

interface MapViewProps {
  status: RobotStatus;
  noGoZones?: NoGoZone[];
  mapUrl?: string;
}

export function MapView({ status, noGoZones = [], mapUrl }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = "rgba(0, 255, 157, 0.1)";
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw no-go zones
    noGoZones.forEach((zone) => {
      if (zone.points.length < 3) return;
      
      ctx.fillStyle = "rgba(255, 59, 59, 0.2)";
      ctx.strokeStyle = "rgba(255, 59, 59, 0.6)";
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(zone.points[0].x * width, zone.points[0].y * height);
      zone.points.slice(1).forEach((p) => {
        ctx.lineTo(p.x * width, p.y * height);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    
    // Draw dock position
    const dockX = 0.5 * width;
    const dockY = 0.8 * height;
    ctx.fillStyle = "#00ff9d";
    ctx.strokeStyle = "#00ff9d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dockX, dockY, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 255, 157, 0.3)";
    ctx.fill();
    
    // Draw dock label
    ctx.fillStyle = "#00ff9d";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DOCK", dockX, dockY + 20);
    
    // Draw robot position
    if (status.pose) {
      const robotX = status.pose.x * width;
      const robotY = status.pose.y * height;
      const heading = status.pose.heading;
      
      // Robot body
      ctx.save();
      ctx.translate(robotX, robotY);
      ctx.rotate(heading);
      
      // Outer glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      gradient.addColorStop(0, "rgba(0, 255, 157, 0.4)");
      gradient.addColorStop(1, "rgba(0, 255, 157, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Robot circle
      ctx.fillStyle = status.state === "cleaning" ? "#00ff9d" : "#666666";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw border frame
    ctx.strokeStyle = "rgba(0, 255, 157, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Corner accents
    const cornerSize = 15;
    ctx.strokeStyle = "#00ff9d";
    ctx.lineWidth = 2;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, cornerSize);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(0, height - cornerSize);
    ctx.lineTo(0, height);
    ctx.lineTo(cornerSize, height);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - cornerSize);
    ctx.stroke();
    
  }, [status.pose, noGoZones, status.state]);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Map View</CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted">Robot</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-accent" />
            <span className="text-muted">Dock</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger/50" />
            <span className="text-muted">No-Go</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-auto rounded border border-border"
        />
        <div className="absolute bottom-2 right-2 text-xs mono text-muted bg-background/80 px-2 py-1 rounded">
          SLAM // MOCK
        </div>
      </CardContent>
    </Card>
  );
}
