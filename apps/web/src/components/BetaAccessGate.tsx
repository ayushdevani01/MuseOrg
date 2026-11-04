import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Input, Label } from "@rakazo/ui-web";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { authClient } from "../lib/auth";
import { PageLoading } from "./PageLoading";

export function BetaAccessGate({ children }: { children: ReactNode }) {
  const { t } = useLingui();
  const [state, setState] = useState<"loading" | "invite" | "open" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/beta/status", { credentials: "include", signal: AbortSignal.timeout(15_000) })
      .then(async (response) => {
        if (!response.ok) throw new Error("Beta status unavailable");
        const status: unknown = await response.json();
        if (
          !status ||
          typeof status !== "object" ||
          !("admitted" in status) ||
          typeof status.admitted !== "boolean"
        )
          throw new Error("Invalid beta status");
        if (active) setState(status.admitted ? "open" : "invite");
      })
      .catch(() => {
        if (active) setState("failed");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (state === "open") return children;
  if (state === "loading") return <PageLoading />;
  return (
    <main className="flex h-full items-center justify-center bg-background px-6">
      <form
        className="w-full max-w-sm space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError(null);
          try {
            const response = await fetch("/api/beta/redeem", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
              signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) {
              setError(
                response.status === 429
                  ? t`Try again in a minute`
                  : t`Could not verify invite code`,
              );
              return;
            }
            setCode("");
            setState("open");
          } catch {
            setError(t`Could not verify invite code`);
          } finally {
            setPending(false);
          }
        }}
      >
        <h1 className="text-2xl font-semibold">
          <Trans>Join the beta</Trans>
        </h1>
        {state === "failed" ? (
          <Button
            type="button"
            onClick={() => {
              setState("loading");
              setAttempt((value) => value + 1);
            }}
          >
            <Trans>Retry</Trans>
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="beta-invite">
                <Trans>Invite code</Trans>
              </Label>
              <Input
                id="beta-invite"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                maxLength={256}
                autoComplete="off"
                autoFocus
                disabled={pending}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit" disabled={pending || !code.trim()}>
              <Trans>Continue</Trans>
            </Button>
          </>
        )}
        <Button type="button" variant="ghost" onClick={() => void authClient.signOut()}>
          <Trans>Sign out</Trans>
        </Button>
      </form>
    </main>
  );
}
