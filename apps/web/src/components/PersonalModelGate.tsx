import { isModelRequiredSendError } from "@rakazo/core";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onRpcResponse, rpc } from "../lib/rpc";
import { OnboardingUnavailable } from "./OnboardingUnavailable";
import { PageLoading } from "./PageLoading";

type GateState = "loading" | "open" | "model" | "coworkers" | "failed";

/** Server model enforcement remains authoritative; this keeps its recovery in onboarding. */
export function PersonalModelGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const check = async () => {
      const request = ++revision;
      try {
        const me = await rpc.me();
        if (!active || request !== revision) return;
        if (!me.requiredPersonalModelProvider) {
          setState("open");
          return;
        }
        if (me.needsModel) {
          setState("model");
          return;
        }
        const bots = await rpc.bots.list();
        if (active && request === revision) setState(bots.length ? "open" : "coworkers");
      } catch {
        if (active && request === revision) setState("failed");
      }
    };
    void check();
    const recheck = () => {
      if (document.visibilityState !== "hidden") void check();
    };
    window.addEventListener("focus", recheck);
    const unsubscribe = onRpcResponse((response) => {
      if (response.status !== 400) return;
      void response
        .clone()
        .json()
        .then((body: unknown) => {
          if (!active || body === null || typeof body !== "object") return;
          const payload = body as { json?: unknown };
          if (isModelRequiredSendError(payload.json ?? body)) void check();
        })
        .catch(() => undefined);
    });
    return () => {
      active = false;
      window.removeEventListener("focus", recheck);
      unsubscribe();
    };
  }, [attempt]);

  if (state === "loading") return <PageLoading />;
  if (state === "failed")
    return (
      <OnboardingUnavailable
        onRetry={() => {
          setState("loading");
          setAttempt((value) => value + 1);
        }}
      />
    );
  if (state === "model") return <Navigate to="/onboarding/model" replace />;
  if (state === "coworkers") return <Navigate to="/onboarding/coworkers" replace />;
  return children;
}
