import { Trans, useLingui } from "@lingui/react/macro";
import type { Me, ModelCatalogEntry } from "@rakazo/contracts";
import type { CoworkerTemplateId } from "@rakazo/core";
import { COWORKER_TEMPLATES } from "@rakazo/core";
import { Button, Checkbox, Input } from "@rakazo/ui-web";
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "../components/ai/primitives";
import { OnboardingUnavailable } from "../components/OnboardingUnavailable";
import { PageLoading } from "../components/PageLoading";
import { hireOnboardingCoworker } from "../lib/onboarding-coworkers";
import { createSpaceRpc } from "../lib/rpc";

const META_DEFAULT_MODEL = "muse-spark-1.3";
const META_CODING_MODEL = "muse-wonder-1.0";

export function MetaOnboarding({
  initialMe,
  catalog,
  onReload,
}: {
  initialMe: Me;
  catalog: ModelCatalogEntry[];
  onReload: () => void;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [rpc] = useState(() => createSpaceRpc(initialMe.spaceId));
  const fieldId = useId();
  const [me, setMe] = useState(initialMe);
  const [apiKey, setApiKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingBots, setCheckingBots] = useState(!initialMe.needsModel);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<Set<CoworkerTemplateId>>(
    () => new Set(COWORKER_TEMPLATES.map((template) => template.id)),
  );
  const availableModels = catalog.filter((entry) => entry.provider === "meta");
  const defaultModel = availableModels.find((entry) => entry.id === META_DEFAULT_MODEL);

  useEffect(() => {
    if (me.needsModel) {
      navigate("/onboarding/model", { replace: true });
      return;
    }
    let active = true;
    setCheckingBots(true);
    setLoadFailed(false);
    void rpc.bots.list().then(
      (bots) => {
        if (!active) return;
        if (bots[0]) navigate(`/app/${bots[0].id}`, { replace: true });
        else {
          setCheckingBots(false);
          navigate("/onboarding/coworkers", { replace: true });
        }
      },
      () => {
        if (active) {
          setCheckingBots(false);
          setLoadFailed(true);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [me.needsModel, navigate, rpc]);

  async function connect() {
    if (!apiKey.trim() || !defaultModel || pending) return;
    setPending(true);
    setError(null);
    try {
      await rpc.models.connect({
        provider: "meta",
        modelId: defaultModel.id,
        apiKey: apiKey.trim(),
        label: "Meta",
        scope: "account",
      });
    } catch {
      // Provider errors can contain credentials; show a local, fixed message.
      setError(t`Could not connect to Meta. Check your key and try again.`);
      setPending(false);
      return;
    }
    setApiKey("");
    try {
      const next = await rpc.me();
      if (next.needsModel) {
        setError(t`Your Meta connection is not ready. Try again.`);
        return;
      }
      setCheckingBots(true);
      setMe(next);
    } catch {
      setLoadFailed(true);
    } finally {
      setPending(false);
    }
  }

  async function hire() {
    if (!selected.size || pending) return;
    setPending(true);
    setError(null);
    try {
      // Recheck the server before creating anything; another tab may have removed the key.
      const current = await rpc.me();
      if (current.needsModel) {
        setMe(current);
        navigate("/onboarding/model", { replace: true });
        return;
      }
      const hires = COWORKER_TEMPLATES.filter((template) => selected.has(template.id));
      if (
        hires.some(
          (template) =>
            !availableModels.some(
              (entry) =>
                entry.id ===
                (template.modelRole === "coding" ? META_CODING_MODEL : META_DEFAULT_MODEL),
            ),
        )
      ) {
        setError(t`A coworker's model is unavailable. Try again later.`);
        return;
      }
      let first: { id: string } | undefined;
      for (const template of hires) {
        const id = template.modelRole === "coding" ? META_CODING_MODEL : META_DEFAULT_MODEL;
        const bot = await hireOnboardingCoworker(rpc, template, { provider: "meta", id });
        first ??= bot;
      }
      if (first) navigate(`/app/${first.id}`, { replace: true });
    } catch {
      setError(t`Could not hire your coworkers. Try again.`);
    } finally {
      setPending(false);
    }
  }

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

  if (loadFailed) return <OnboardingUnavailable onRetry={onReload} />;
  if (!me.needsModel && checkingBots) return <PageLoading />;

  return (
    <div className="min-h-full bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-[560px]">
        <p className="mb-6 text-sm font-medium text-muted-foreground">MuseOrg</p>
        {me.needsModel ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void connect();
            }}
          >
            <h1 className="text-[32px] font-medium text-foreground">
              <Trans>Connect Meta</Trans>
            </h1>
            <label htmlFor={fieldId} className="mt-8 block text-sm font-medium text-foreground">
              <Trans>Meta API key</Trans>
            </label>
            <Input
              id={fieldId}
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setError(null);
              }}
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              disabled={pending}
              required
              className="mt-2"
            />
            {!defaultModel ? (
              <div>
                <p role="alert" className="mt-3 text-sm text-destructive">
                  <Trans>Meta is unavailable. Try again later.</Trans>
                </p>
                <Button className="mt-3" type="button" variant="outline" onClick={onReload}>
                  <Trans>Try again</Trans>
                </Button>
              </div>
            ) : null}
            <Button
              className="mt-6"
              type="submit"
              disabled={!apiKey.trim() || !defaultModel || pending}
            >
              {pending ? <LoadingState label={t`Connecting`} /> : <Trans>Connect</Trans>}
            </Button>
          </form>
        ) : (
          <div>
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
            <Button
              className="mt-6"
              disabled={!selected.size || pending}
              onClick={() => void hire()}
            >
              {pending ? <LoadingState label={t`Hiring`} /> : <Trans>Hire coworkers</Trans>}
            </Button>
          </div>
        )}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
