import type {
  ProjectActionInput,
  ProjectPatch,
  ProjectSpec,
  WorkOperation,
} from "@rakazo/contracts";

/** Only reviewed operation identifiers decide whether a call may change external state. */
export const WORK_OPERATIONS: Readonly<Record<WorkOperation, { readOnly: boolean }>> = {
  "repository.read": { readOnly: true },
  "repository.propose": { readOnly: false },
  "repository.merge": { readOnly: false },
  "deployment.read": { readOnly: true },
  publish: { readOnly: false },
  "message.send": { readOnly: false },
  "ads.stage": { readOnly: false },
  "ads.activate": { readOnly: false },
};

export function applyProjectPatch(spec: ProjectSpec, patch: ProjectPatch) {
  const facts = { ...spec.facts, ...patch.facts };
  const next = { goal: patch.goal ?? spec.goal, facts };
  const changedKeys = [
    ...(next.goal !== spec.goal ? ["goal"] : []),
    ...Object.keys(patch.facts ?? {})
      .filter((key) => JSON.stringify(spec.facts[key]) !== JSON.stringify(facts[key]))
      .map((key) => `facts.${key}`),
  ];
  return { spec: next, changedKeys };
}

export function projectOutputAffected(
  inputKeys: readonly string[],
  changedKeys: readonly string[],
) {
  return (
    changedKeys.length > 0 &&
    (!inputKeys.length ||
      changedKeys.includes("goal") ||
      inputKeys.some(
        (key) =>
          key === "*" ||
          changedKeys.some(
            (changed) =>
              key === changed || key.startsWith(`${changed}.`) || changed.startsWith(`${key}.`),
          ),
      ))
  );
}

export interface WorkGrantState {
  id: string;
  projectId: string;
  provider: string;
  account: string;
  resource: string;
  operations: readonly string[];
  botIds: readonly string[];
  allowedPaths: readonly string[];
  budgetLimitCents: number;
  reservedCents: number;
  spentCents: number;
  expiresAt: Date;
  revokedAt: Date | null;
}

export function workGrantRefusal(
  intent: ProjectActionInput,
  botId: string,
  grant: WorkGrantState,
  now: Date,
): string | undefined {
  if (grant.revokedAt || grant.expiresAt <= now) return "The action scope expired or was revoked.";
  if (
    grant.projectId !== intent.projectId ||
    grant.provider !== intent.provider ||
    grant.account !== intent.account ||
    grant.resource !== intent.resource
  )
    return "The action target is outside this scope.";
  if (!grant.operations.includes(intent.operation) || !grant.botIds.includes(botId))
    return "This coworker or operation is outside the action scope.";
  if (intent.budgetCents + grant.reservedCents + grant.spentCents > grant.budgetLimitCents)
    return "The action exceeds the remaining shared budget.";
  return undefined;
}

export function projectActionRefusal(input: {
  currentRevision: number;
  status: string;
  botIds: readonly string[];
  botId: string;
  intent: ProjectActionInput;
}): string | undefined {
  if (input.status !== "active") return "This project is paused or archived.";
  if (!input.botIds.includes(input.botId)) return "This coworker is not assigned to the project.";
  if (input.currentRevision !== input.intent.revision)
    return "The project changed. Read its latest revision and prepare a new action.";
  if (
    ["repository.merge", "repository.propose"].includes(input.intent.operation) &&
    !input.intent.expectedHead
  )
    return "A repository change needs its exact base or reviewed pull-request head.";
  return undefined;
}

export function permittedProjectPath(target: string, allowed: readonly string[]): boolean {
  if (
    !target ||
    /[\\:]/.test(target) ||
    [...target].some((char) => char.charCodeAt(0) < 32) ||
    target.startsWith("/")
  )
    return false;
  const parts = target.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.toLowerCase() === ".git"))
    return false;
  // Workflow, credentials and policy changes require a separately reviewed operation.
  if (
    parts.some((part) =>
      [".gitmodules", ".gitattributes", ".github", ".env", "agents.md", "security.md"].includes(
        part.toLowerCase(),
      ),
    ) ||
    parts.some((part) => part.toLowerCase().startsWith(".env."))
  )
    return false;
  return allowed.some((path) => (path.endsWith("/") ? target.startsWith(path) : target === path));
}
