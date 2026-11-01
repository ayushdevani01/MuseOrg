import { Trans, useLingui } from "@lingui/react/macro";
import type { Bot, WorkConnection, WorkGrantInput, WorkOperation } from "@rakazo/contracts";
import {
  Button,
  Checkbox,
  Input,
  NativeSelect,
  NativeSelectOption,
  Textarea,
} from "@rakazo/ui-web";
import { useId, useState } from "react";

export function ProjectScopeForm({
  bots,
  connections,
  busy,
  onCreate,
}: {
  bots: Bot[];
  connections: WorkConnection[];
  busy: boolean;
  onCreate: (input: Omit<WorkGrantInput, "projectId">) => Promise<void>;
}) {
  const { t } = useLingui();
  const id = useId();
  const [connectionIndex, setConnectionIndex] = useState(0);
  const connection = connections[connectionIndex];
  const [paths, setPaths] = useState("");
  const [botIds, setBotIds] = useState(() => bots.map((b) => b.id));
  const [operations, setOperations] = useState<WorkOperation[]>(["repository.propose"]);
  const [budget, setBudget] = useState(0);
  const [expiry, setExpiry] = useState(() =>
    new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
  );
  const choices: { operation: WorkOperation; label: string }[] = [
    { operation: "repository.propose", label: t`Open pull requests` },
    { operation: "repository.merge", label: t`Merge passing pull requests` },
    { operation: "publish", label: t`Publish` },
    { operation: "message.send", label: t`Send messages` },
    { operation: "ads.stage", label: t`Stage ads` },
    { operation: "ads.activate", label: t`Activate ads` },
  ];
  if (!connection)
    return (
      <p className="text-sm text-muted-foreground">
        <Trans>Connect an integration first.</Trans>
      </p>
    );
  const offered = choices.filter((c) => connection.operations.includes(c.operation));
  const selected = operations.filter((op) => connection.operations.includes(op));
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onCreate({
          provider: connection.provider,
          account: connection.account,
          resource: connection.resource,
          operations: selected,
          botIds,
          allowedPaths: paths
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean),
          budgetLimitCents: budget,
          expiresAt: new Date(expiry).toISOString(),
        });
      }}
    >
      <label className="block space-y-1 text-sm" htmlFor={`${id}-connection`}>
        <span>
          <Trans>Connection</Trans>
        </span>
        <NativeSelect
          id={`${id}-connection`}
          value={connectionIndex}
          onChange={(e) => {
            setConnectionIndex(Number(e.target.value));
            setOperations([]);
          }}
          disabled={busy}
        >
          {connections.map((c, index) => (
            <NativeSelectOption key={`${c.provider}:${c.account}:${c.resource}`} value={index}>
              {c.account} · {c.resource}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm">
          <Trans>Coworkers</Trans>
        </legend>
        {bots.map((bot) => (
          <label
            key={bot.id}
            htmlFor={`${id}-bot-${bot.id}`}
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id={`${id}-bot-${bot.id}`}
              checked={botIds.includes(bot.id)}
              disabled={busy}
              onCheckedChange={(checked) =>
                setBotIds((ids) => (checked ? [...ids, bot.id] : ids.filter((b) => b !== bot.id)))
              }
            />
            {bot.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm">
          <Trans>Allowed actions</Trans>
        </legend>
        {offered.map(({ operation, label }) => (
          <label
            key={operation}
            htmlFor={`${id}-${operation}`}
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id={`${id}-${operation}`}
              checked={selected.includes(operation)}
              disabled={busy}
              onCheckedChange={(checked) =>
                setOperations((ops) =>
                  checked ? [...ops, operation] : ops.filter((op) => op !== operation),
                )
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="block space-y-1 text-sm" htmlFor={`${id}-paths`}>
        <span>
          <Trans>Allowed paths, one per line</Trans>
        </span>
        <Textarea
          id={`${id}-paths`}
          value={paths}
          onChange={(e) => setPaths(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="block space-y-1 text-sm" htmlFor={`${id}-budget`}>
        <span>
          <Trans>Total budget in cents</Trans>
        </span>
        <Input
          id={`${id}-budget`}
          type="number"
          min={0}
          max={100000000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          required
          disabled={busy}
        />
      </label>
      <label className="block space-y-1 text-sm" htmlFor={`${id}-expiry`}>
        <span>
          <Trans>Expires</Trans>
        </span>
        <Input
          id={`${id}-expiry`}
          type="datetime-local"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          required
          disabled={busy}
        />
      </label>
      <Button type="submit" disabled={busy || !selected.length || !botIds.length}>
        <Trans>Allow scope</Trans>
      </Button>
    </form>
  );
}
