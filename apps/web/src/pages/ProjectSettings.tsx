import { Trans, useLingui } from "@lingui/react/macro";
import type { Bot, WorkConnection, WorkProject } from "@rakazo/contracts";
import { Button, Checkbox, Input, Textarea } from "@rakazo/ui-web";
import { useEffect, useId, useState } from "react";
import { useSpaceRpc } from "../lib/space-rpc";
import { errorText } from "../lib/user-error";
import { ProjectScopeForm } from "./ProjectScopeForm";

/** Advanced project state is opened from Space settings; ordinary chat stays uncluttered. */
export function ProjectSettings() {
  const { t } = useLingui();
  const rpc = useSpaceRpc();
  const formId = useId();
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [connections, setConnections] = useState<WorkConnection[]>([]);
  const [selected, setSelected] = useState<WorkProject | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [facts, setFacts] = useState("{}");
  const [botIds, setBotIds] = useState<string[]>([]);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof rpc.projects.get>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function reload() {
    const [next, roster] = await Promise.all([rpc.projects.list({}), rpc.bots.list()]);
    setProjects(next);
    setBots(roster);
  }
  useEffect(() => {
    let current = true;
    Promise.all([rpc.projects.list({}), rpc.bots.list(), rpc.projects.connections()])
      .then(([next, roster, connected]) => {
        if (current) {
          setProjects(next);
          setBots(roster);
          setConnections(connected);
        }
      })
      .catch((err) => {
        if (current) setError(errorText(err));
      });
    return () => {
      current = false;
    };
  }, [rpc]);
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function open(project: WorkProject) {
    await action(async () => {
      const next = await rpc.projects.get({ projectId: project.id });
      setSelected(next.project);
      setCreating(false);
      setName(next.project.name);
      setGoal(next.project.goal);
      setFacts(JSON.stringify(next.project.facts, null, 2));
      setBotIds(next.project.botIds);
      setDetail(next);
    });
  }
  return (
    <div className="space-y-4 pt-4" data-testid="project-settings">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <Button
            key={p.id}
            variant={selected?.id === p.id ? "secondary" : "ghost"}
            disabled={busy}
            onClick={() => void open(p)}
          >
            {p.name}
          </Button>
        ))}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            setSelected(null);
            setDetail(null);
            setCreating(true);
            setName("");
            setGoal("");
            setFacts("{}");
            setBotIds([]);
          }}
        >
          <Trans>New project</Trans>
        </Button>
      </div>
      {selected || creating ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void action(async () => {
              const spec = { goal, facts: JSON.parse(facts) };
              const saved = selected
                ? await rpc.projects.revise({
                    projectId: selected.id,
                    expectedRevision: selected.revision,
                    patch: spec,
                  })
                : await rpc.projects.create({ name, spec, botIds });
              setSelected(saved);
              setCreating(false);
              await reload();
              setDetail(await rpc.projects.get({ projectId: saved.id }));
            });
          }}
        >
          {creating ? (
            <label className="block space-y-1 text-sm" htmlFor={`${formId}-name`}>
              <span>
                <Trans>Name</Trans>
              </span>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                disabled={busy}
              />
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">{t`Revision ${selected?.revision}`}</p>
          )}
          <label className="block space-y-1 text-sm" htmlFor={`${formId}-goal`}>
            <span>
              <Trans>Goal</Trans>
            </span>
            <Textarea
              id={`${formId}-goal`}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              maxLength={8000}
              disabled={busy}
            />
          </label>
          {creating ? (
            <fieldset className="space-y-2">
              <legend className="text-sm">
                <Trans>Coworkers</Trans>
              </legend>
              {bots.map((b) => (
                <label
                  key={b.id}
                  htmlFor={`${formId}-bot-${b.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`${formId}-bot-${b.id}`}
                    checked={botIds.includes(b.id)}
                    disabled={busy}
                    onCheckedChange={(checked) =>
                      setBotIds((ids) =>
                        checked ? [...ids, b.id] : ids.filter((id) => id !== b.id),
                      )
                    }
                  />
                  {b.name}
                </label>
              ))}
            </fieldset>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm">
              <Trans>Project facts</Trans>
            </summary>
            <Textarea
              aria-label={t`Project facts JSON`}
              className="mt-2 font-mono"
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              disabled={busy}
            />
          </details>
          <Button
            type="submit"
            disabled={busy || !goal.trim() || (creating && (!name.trim() || !botIds.length))}
          >
            <Trans>Save</Trans>
          </Button>
        </form>
      ) : null}
      {detail ? (
        <>
          {detail.outputs.length ? (
            <details>
              <summary className="cursor-pointer text-sm">
                <Trans>Outputs</Trans>
              </summary>
              <ul className="mt-2 space-y-2 text-sm">
                {detail.outputs.map((o) => (
                  <li key={o.id}>
                    {o.key} · {t`Revision ${o.revision}`} · {o.status}
                    <div className="truncate text-muted-foreground">{o.reference}</div>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm">
              <Trans>Action scopes</Trans>
            </summary>
            <div className="mt-3 space-y-3">
              {detail.grants.map((g) => (
                <div key={g.id} className="space-y-1 text-sm">
                  <p>
                    {g.provider} · {g.resource}
                  </p>
                  <p className="text-muted-foreground">{g.operations.join(", ")}</p>
                  <p className="text-muted-foreground">{t`Budget: ${g.spentCents} spent, ${g.reservedCents} reserved, ${g.budgetLimitCents} total cents`}</p>
                  {g.revokedAt ? (
                    <span>
                      <Trans>Revoked</Trans>
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void action(async () => {
                          await rpc.projects.revoke({ grantId: g.id });
                          setDetail(await rpc.projects.get({ projectId: detail.project.id }));
                        })
                      }
                    >
                      <Trans>Revoke</Trans>
                    </Button>
                  )}
                </div>
              ))}
              <ProjectScopeForm
                key={detail.project.id}
                bots={bots.filter((bot) => detail.project.botIds.includes(bot.id))}
                connections={connections}
                busy={busy}
                onCreate={(scope) =>
                  action(async () => {
                    await rpc.projects.grant({ ...scope, projectId: detail.project.id });
                    setDetail(await rpc.projects.get({ projectId: detail.project.id }));
                  })
                }
              />
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
