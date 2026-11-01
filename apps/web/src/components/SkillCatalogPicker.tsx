import { Trans, useLingui } from "@lingui/react/macro";
import type { SkillBundle, SkillCatalogEntry } from "@rakazo/contracts";
import { Button, Input, Spinner } from "@rakazo/ui-web";
import { useEffect, useRef, useState } from "react";
import { useSpaceRpc } from "../lib/space-rpc";
import { errorText } from "../lib/user-error";

export function SkillCatalogPicker({
  initialQuery,
  selected,
  onChange,
}: {
  initialQuery: string;
  selected: SkillBundle[];
  onChange: (skills: SkillBundle[]) => void;
}) {
  const { t } = useLingui();
  const rpc = useSpaceRpc();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SkillCatalogEntry[]>([]);
  const [included, setIncluded] = useState<string[]>([]);
  const [preview, setPreview] = useState<SkillBundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => {
    let current = true;
    setBusy(true);
    Promise.all([rpc.agentSkills.searchCatalog({ query: initialQuery }), rpc.agentSkills.list()])
      .then(([found, skills]) => {
        if (current) {
          setResults(found);
          setIncluded(
            skills
              .filter((skill) => skill.source === "builtin")
              .map((skill) => skill.name.toLowerCase()),
          );
        }
      })
      .catch((err) => {
        if (current) setError(errorText(err));
      })
      .finally(() => {
        if (current) setBusy(false);
      });
    return () => {
      current = false;
      request.current++;
    };
  }, [rpc, initialQuery]);
  async function run(action: () => Promise<void>) {
    const id = ++request.current;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      if (id === request.current) setError(errorText(err));
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  return (
    <div className="space-y-4" data-testid="hiring-skills">
      <div className="flex gap-2">
        <Input
          aria-label={t`Search skills.sh`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (query.trim().length >= 2 && !busy)
                void run(async () => {
                  setResults(await rpc.agentSkills.searchCatalog({ query: query.trim() }));
                  setPreview(null);
                });
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || query.trim().length < 2}
          onClick={() =>
            void run(async () => {
              setResults(await rpc.agentSkills.searchCatalog({ query: query.trim() }));
              setPreview(null);
            })
          }
        >
          <Trans>Search</Trans>
        </Button>
      </div>
      {selected.length ? (
        <ul className="space-y-1">
          {selected.map((skill) => (
            <li
              key={`${skill.source}/${skill.key}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{skill.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t`Remove ${skill.name}`}
                onClick={() => onChange(selected.filter((item) => item !== skill))}
              >
                <Trans>Remove</Trans>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {busy ? <Spinner aria-label={t`Loading skills…`} /> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!busy && !error && !results.length ? (
        <p className="text-sm text-muted-foreground">
          <Trans>No skills found.</Trans>
        </p>
      ) : null}
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {results.map((skill) => {
          const added = selected.some(
            (item) => item.source === skill.source && item.key === skill.key,
          );
          const builtin = included.includes(skill.key.toLowerCase());
          return (
            <div
              key={`${skill.source}/${skill.key}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{skill.name}</p>
                <a
                  href={skill.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {skill.source}
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || added || builtin}
                aria-label={t`Preview ${skill.name}`}
                onClick={() =>
                  void run(async () => {
                    setPreview(
                      await rpc.agentSkills.previewCatalog({
                        source: skill.source,
                        key: skill.key,
                      }),
                    );
                  })
                }
              >
                {builtin ? t`Included` : added ? t`Selected` : t`Preview`}
              </Button>
            </div>
          );
        })}
      </div>
      {preview ? (
        <section
          className="space-y-2 rounded-xl border border-border p-3"
          data-testid="skill-preview"
        >
          <p className="text-sm font-medium">{preview.name}</p>
          <p className="text-sm text-muted-foreground">{preview.description}</p>
          <details>
            <summary className="cursor-pointer text-sm">
              <Trans>Skill instructions</Trans>
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">
              {preview.content}
            </pre>
            {Object.keys(preview.resources).length ? (
              <ul className="mt-2 text-xs text-muted-foreground">
                {Object.keys(preview.resources).map((path) => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
            ) : null}
          </details>
          <Button
            type="button"
            size="sm"
            disabled={selected.length >= 5 || selected.some((skill) => skill.name === preview.name)}
            onClick={() => {
              onChange([...selected, preview]);
              setPreview(null);
            }}
          >
            <Trans>Add skill</Trans>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
