"use client";

import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RobotStatus, NoGoZone, CustomRoute } from "@/lib/types";
import * as robot from "@/lib/robot";
import { Plus, Trash2, Route, Ban, Save } from "lucide-react";

export default function MapPage() {
  const [status, setStatus] = useState<RobotStatus | null>(null);
  const [noGoZones, setNoGoZones] = useState<NoGoZone[]>([]);
  const [routes, setRoutes] = useState<CustomRoute[]>([]);
  const [mode, setMode] = useState<"view" | "zone" | "route">("view");
  const [drawing, setDrawing] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    Promise.all([
      robot.getStatus(),
      robot.getNoGoZones(),
      robot.getRoutes(),
    ]).then(([statusData, zones, routesData]) => {
      setStatus(statusData);
      setNoGoZones(zones);
      setRoutes(routesData);
    });

    const cleanup = robot.startLiveUpdates(setStatus);
    return cleanup;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !status) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(0, 255, 157, 0.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // No-go zones
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

    // Routes
    routes.forEach((route) => {
      if (route.waypoints.length < 2) return;
      ctx.strokeStyle = "rgba(0, 200, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(route.waypoints[0].x * width, route.waypoints[0].y * height);
      route.waypoints.slice(1).forEach((wp) => {
        ctx.lineTo(wp.x * width, wp.y * height);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint markers
      route.waypoints.forEach((wp, i) => {
        ctx.fillStyle = "#00c8ff";
        ctx.beginPath();
        ctx.arc(wp.x * width, wp.y * height, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), wp.x * width, wp.y * height);
      });
    });

    // Drawing preview
    if (drawing.length > 0) {
      const color = mode === "zone" ? "rgba(255, 59, 59, 0.5)" : "rgba(0, 200, 255, 0.5)";
      ctx.strokeStyle = color;
      ctx.fillStyle = color.replace("0.5", "0.2");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawing[0].x * width, drawing[0].y * height);
      drawing.slice(1).forEach((p) => {
        ctx.lineTo(p.x * width, p.y * height);
      });
      if (mode === "zone" && drawing.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      drawing.forEach((p) => {
        ctx.fillStyle = mode === "zone" ? "#ff3b3b" : "#00c8ff";
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Dock
    const dockX = 0.5 * width;
    const dockY = 0.8 * height;
    ctx.strokeStyle = "#00ff9d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dockX, dockY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 255, 157, 0.3)";
    ctx.fill();

    // Robot
    if (status.pose) {
      const robotX = status.pose.x * width;
      const robotY = status.pose.y * height;

      ctx.save();
      ctx.translate(robotX, robotY);
      ctx.rotate(status.pose.heading);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      gradient.addColorStop(0, "rgba(0, 255, 157, 0.4)");
      gradient.addColorStop(1, "rgba(0, 255, 157, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = status.state === "cleaning" ? "#00ff9d" : "#666666";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Frame
    ctx.strokeStyle = "rgba(0, 255, 157, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }, [status, noGoZones, routes, drawing, mode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "view") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setDrawing([...drawing, { x, y }]);
  };

  const handleSaveDrawing = () => {
    if (drawing.length < (mode === "zone" ? 3 : 2)) return;

    if (mode === "zone") {
      const newZone: NoGoZone = {
        id: `zone-${Date.now()}`,
        name: `Zone ${noGoZones.length + 1}`,
        points: drawing,
        createdAt: new Date().toISOString(),
      };
      setNoGoZones([...noGoZones, newZone]);
    } else {
      const newRoute: CustomRoute = {
        id: `route-${Date.now()}`,
        name: `Route ${routes.length + 1}`,
        waypoints: drawing.map((p, i) => ({
          id: `wp-${Date.now()}-${i}`,
          x: p.x,
          y: p.y,
          order: i,
        })),
        createdAt: new Date().toISOString(),
      };
      setRoutes([...routes, newRoute]);
    }

    setDrawing([]);
    setMode("view");
  };

  const handleCancelDrawing = () => {
    setDrawing([]);
    setMode("view");
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Floor Map</CardTitle>
                <div className="flex items-center gap-2">
                  {mode === "view" ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMode("zone")}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Add No-Go Zone
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMode("route")}
                      >
                        <Route className="w-4 h-4 mr-1" />
                        Add Route
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-accent uppercase">
                        {mode === "zone" ? "Drawing zone..." : "Adding waypoints..."}
                      </span>
                      <Button size="sm" variant="primary" onClick={handleSaveDrawing}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelDrawing}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded border border-border cursor-crosshair"
                  onClick={handleCanvasClick}
                />
                {mode !== "view" && (
                  <p className="text-xs text-muted mt-2">
                    {mode === "zone"
                      ? "Click to add points. Need at least 3 points for a zone."
                      : "Click to add waypoints. Need at least 2 points for a route."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* No-go zones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-danger" />
                  No-Go Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noGoZones.length === 0 ? (
                  <p className="text-sm text-muted">No zones defined</p>
                ) : (
                  <div className="space-y-2">
                    {noGoZones.map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm">{zone.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setNoGoZones(noGoZones.filter((z) => z.id !== zone.id))
                          }
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#00c8ff]" />
                  Custom Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <p className="text-sm text-muted">No routes defined</p>
                ) : (
                  <div className="space-y-2">
                    {routes.map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <span className="text-sm">{route.name}</span>
                          <span className="text-xs text-muted ml-2">
                            {route.waypoints.length} pts
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setRoutes(routes.filter((r) => r.id !== route.id))
                          }
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
