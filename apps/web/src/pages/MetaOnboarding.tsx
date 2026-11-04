import { Trans, useLingui } from "@lingui/react/macro";
import type { Me, ModelCatalogEntry } from "@rakazo/contracts";
import { Button, Input } from "@rakazo/ui-web";
import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "../components/ai/primitives";
import { OnboardingUnavailable } from "../components/OnboardingUnavailable";
import { createSpaceRpc } from "../lib/rpc";
import { CoworkerOnboarding } from "./CoworkerOnboarding";

const META_DEFAULT_MODEL = "muse-spark-1.3";

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
  const [loadFailed, setLoadFailed] = useState(false);
  const defaultModel = catalog.find(
    (entry) => entry.provider === "meta" && entry.id === META_DEFAULT_MODEL,
  );
  useEffect(() => {
    if (me.needsModel) navigate("/onboarding/model", { replace: true });
  }, [me.needsModel, navigate]);
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
      setError(t`Could not connect to Meta. Check your key and try again.`);
      setPending(false);
      return;
    }
    setApiKey("");
    try {
      const next = await rpc.me();
      if (next.needsModel) setError(t`Your Meta connection is not ready. Try again.`);
      else setMe(next);
    } catch {
      setLoadFailed(true);
    } finally {
      setPending(false);
    }
  }
  if (loadFailed) return <OnboardingUnavailable onRetry={onReload} />;
  if (!me.needsModel) return <CoworkerOnboarding me={me} onReload={onReload} />;
  return (
    <main className="min-h-full bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-[560px]">
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
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
