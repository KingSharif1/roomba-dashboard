"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { emitToastOps, noteVoluntarySignOut } from "@/lib/toast-store";
import { authToastOps } from "@/lib/toasts";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "magic">("login");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const queryError = searchParams.get("error");

  useEffect(() => {
    if (queryError === "not-owner") emitToastOps(authToastOps("not-owner"));
    else if (queryError === "auth") emitToastOps(authToastOps("auth"));
  }, [queryError]);

  const rejectUnlessOwner = async () => {
    const access = await fetch("/api/access", { cache: "no-store" }).then((res) => res.json());
    if (access.role === "owner") return true;
    noteVoluntarySignOut();
    await supabase?.auth.signOut();
    emitToastOps(authToastOps("not-owner"));
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      emitToastOps(authToastOps("unavailable"));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!(await rejectUnlessOwner())) return;
      router.push("/");
      router.refresh();
    } catch {
      emitToastOps(authToastOps("auth"));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      emitToastOps(authToastOps("unavailable"));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      emitToastOps(authToastOps("sent"));
      setMagicLinkSent(true);
    } catch {
      emitToastOps(authToastOps("auth"));
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
            <span className="text-accent mx-2">{"//"}</span>
            <span className="text-muted">CONTROL</span>
          </h1>
        </div>

        <Card className="glow">
          <CardContent className="pt-6">
            {!configured ? (
              <div className="text-center py-4">
                <h2 className="text-lg font-medium mb-4">Demo</h2>
                <Button variant="primary" onClick={() => router.push("/")}>
                  Open
                </Button>
              </div>
            ) : magicLinkSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-medium mb-2">Check email</h2>
                <p className="text-sm">{email}</p>
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
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            Demo
          </Link>
        </p>
      </div>
    </div>
  );
}
