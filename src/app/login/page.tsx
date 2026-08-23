"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "magic">("login");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg border border-accent/50 flex items-center justify-center bg-accent/10">
            <span className="text-accent font-bold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-foreground">ROOMBA</span>
            <span className="text-accent mx-2">//</span>
            <span className="text-muted">CONTROL</span>
          </h1>
          <p className="text-sm text-muted mt-2">Autonomous Robot Dashboard</p>
        </div>

        <Card className="glow">
          <CardContent className="pt-6">
            {magicLinkSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-medium mb-2">Check your email</h2>
                <p className="text-sm text-muted">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setMagicLinkSent(false)}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                {/* Mode toggle */}
                <div className="flex mb-6 bg-surface-light rounded p-1">
                  <button
                    className={`flex-1 py-2 text-sm rounded transition-colors ${
                      mode === "login"
                        ? "bg-surface text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                    onClick={() => setMode("login")}
                  >
                    Password
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm rounded transition-colors ${
                      mode === "magic"
                        ? "bg-surface text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                    onClick={() => setMode("magic")}
                  >
                    Magic Link
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded flex items-center gap-2 text-danger text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <form onSubmit={mode === "login" ? handleLogin : handleMagicLink}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border rounded text-sm focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {mode === "login" && (
                      <div>
                        <label className="block text-sm text-muted mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border rounded text-sm focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : mode === "login" ? (
                        "Sign In"
                      ) : (
                        "Send Magic Link"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted mt-6">
          Secured by Supabase Auth • Tailscale VPN
        </p>
      </div>
    </div>
  );
}
