"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LearningItem } from "@/lib/types";
import * as robot from "@/lib/robot";
import { formatTimeAgo } from "@/lib/utils";
import { Brain, Check, X, HelpCircle, MapPin, Tag } from "lucide-react";

export default function LearningPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    robot.getLearningItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const pendingItems = items.filter((i) => i.status === "pending");
  const verifiedItems = items.filter((i) => i.status === "verified");
  const dismissedItems = items.filter((i) => i.status === "dismissed");

  const handleVerify = async (id: string, label: string) => {
    await robot.verifyLearningItem(id, label);
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, status: "verified" as const, userLabel: label } : i
      )
    );
    setEditingId(null);
    setCustomLabel("");
  };

  const handleDismiss = async (id: string) => {
    await robot.dismissLearningItem(id);
    setItems(
      items.map((i) => (i.id === id ? { ...i, status: "dismissed" as const } : i))
    );
  };

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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Pending</p>
                  <p className="mono text-xl font-bold">{pendingItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Verified</p>
                  <p className="mono text-xl font-bold">{verifiedItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-muted/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Dismissed</p>
                  <p className="mono text-xl font-bold">{dismissedItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info banner */}
        <Card className="mb-6 border-accent/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium">Object Learning System</p>
                <p className="text-xs text-muted mt-1">
                  When the robot encounters an unknown object, it will capture an image
                  and ask you to identify it. Your labels help the robot learn what to
                  avoid and what's safe to clean around.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending items */}
        {pendingItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-warning" />
              Needs Your Input
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingItems.map((item) => (
                <Card key={item.id} className="border-warning/30">
                  <CardContent className="pt-4">
                    {/* Image placeholder */}
                    <div className="aspect-video bg-surface-light rounded border border-border mb-4 flex items-center justify-center">
                      <div className="text-center">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-warning" />
                        <p className="text-xs text-muted">Object image</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted" />
                        <span className="mono">
                          ({item.location.x.toFixed(2)}, {item.location.y.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{formatTimeAgo(item.detectedAt)}</span>
                      </div>
                      {item.suggestedLabel && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-accent" />
                          <span>Suggested: {item.suggestedLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                          placeholder="Enter label..."
                          className="w-full px-3 py-2 bg-surface-light border border-border rounded text-sm focus:outline-none focus:border-accent"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex-1"
                            onClick={() => handleVerify(item.id, customLabel)}
                            disabled={!customLabel.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setCustomLabel("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {item.suggestedLabel && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="flex-1"
                            onClick={() =>
                              handleVerify(item.id, item.suggestedLabel!)
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Tag className="w-4 h-4 mr-1" />
                          Label
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Verified items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              Learned Objects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verifiedItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">
                No verified objects yet
              </p>
            ) : (
              <div className="space-y-2">
                {verifiedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.userLabel}</p>
                        <p className="text-xs text-muted">
                          at ({item.location.x.toFixed(2)}, {item.location.y.toFixed(2)})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted">
                      {formatTimeAgo(item.detectedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
