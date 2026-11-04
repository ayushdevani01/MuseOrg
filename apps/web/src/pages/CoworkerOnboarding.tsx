import { Trans, useLingui } from "@lingui/react/macro";
import type { Me } from "@rakazo/contracts";
import type { CoworkerTemplateId } from "@rakazo/core";
import { COWORKER_TEMPLATES } from "@rakazo/core";
import { Button, Checkbox } from "@rakazo/ui-web";
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "../components/ai/primitives";
import { OnboardingUnavailable } from "../components/OnboardingUnavailable";
import { PageLoading } from "../components/PageLoading";
import { createSpaceRpc } from "../lib/rpc";

export function CoworkerOnboarding({ me, onReload }: { me: Me; onReload: () => void }) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const fieldId = useId();
  const [rpc] = useState(() => createSpaceRpc(me.spaceId));
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<CoworkerTemplateId>>(
    () => new Set(COWORKER_TEMPLATES.map((template) => template.id)),
  );
  useEffect(() => {
    if (!checking) return;
    let active = true;
    void rpc.bots.list().then(
      (bots) => {
        if (!active) return;
        const starterBots = bots.filter((bot) => bot.spawnKey?.startsWith("museorg:onboarding:"));
        setChecking(false);
        // Keep partial hires recoverable; existing non-onboarding teams open normally.
        if (bots[0] && (!starterBots.length || starterBots.length === COWORKER_TEMPLATES.length))
          navigate(`/app/${bots[0].id}`, { replace: true });
        else {
          navigate("/onboarding/coworkers", { replace: true });
        }
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [checking, navigate, rpc]);
  if (failed) return <OnboardingUnavailable onRetry={onReload} />;
  if (checking) return <PageLoading />;
  const titles = {
    chief: t`Chief of Staff`,
    engineer: t`Staff Engineer`,
    creative: t`Creative Director`,
    growth: t`Meta Growth Operator`,
  };
  const descriptions = {
    chief: t`Coordinate priorities, projects and the team.`,
    engineer: t`Build, investigate and maintain software.`,
    creative: t`Shape ideas, design and creative work.`,
    growth: t`Plan distribution, outreach and follow-up.`,
  };
  return (
    <main className="min-h-full bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-[560px]">
        <h1 className="text-[32px] font-medium text-foreground">
          <Trans>Hire your coworkers</Trans>
        </h1>
        <div className="mt-8 grid gap-3">
          {COWORKER_TEMPLATES.map((template) => (
            <label
              key={template.id}
              htmlFor={`${fieldId}-${template.id}`}
              className="flex cursor-pointer items-center gap-4 rounded-lg border border-border px-4 py-4"
            >
              <Checkbox
                id={`${fieldId}-${template.id}`}
                checked={selected.has(template.id)}
                disabled={pending}
                onCheckedChange={(checked) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (checked) next.add(template.id);
                    else next.delete(template.id);
                    return next;
                  })
                }
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {titles[template.id]}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {descriptions[template.id]}
                </span>
              </span>
            </label>
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          className="mt-6"
          disabled={!selected.size || pending}
          onClick={async () => {
            if (pending) return;
            setPending(true);
            setError(null);
            try {
              const result = await rpc.onboarding.hireCoworkers({ templateIds: [...selected] });
              if (result.botIds[0]) navigate(`/app/${result.botIds[0]}`, { replace: true });
            } catch {
              const current = await rpc.me().catch(() => null);
              if (current?.needsModel) onReload();
              else setError(t`Could not hire your coworkers. Try again.`);
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? <LoadingState label={t`Hiring`} /> : <Trans>Hire coworkers</Trans>}
        </Button>
      </div>
    </main>
  );
}
