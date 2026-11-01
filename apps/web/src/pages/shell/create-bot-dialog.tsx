import { Trans, useLingui } from "@lingui/react/macro";
import type { SkillBundle, SkillImportSelection } from "@rakazo/contracts";
import { BOT_NAME_MAX_LENGTH } from "@rakazo/contracts";
import {
  COWORKER_TEMPLATES,
  newClientId,
  ORGANIC_AVATAR_LOOKS,
  organicAvatarFamily,
  organicAvatarSampleIdentity,
} from "@rakazo/core";
import {
  BOT_AVATAR_COLORS,
  BotAvatar,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  parseBotAvatar,
  Textarea,
} from "@rakazo/ui-web";
import { useRef, useState } from "react";
import { SkillCatalogPicker } from "../../components/SkillCatalogPicker";
import { errorText } from "../../lib/user-error";
import { BotLookPicker } from "./avatar-studio-popover";

/** One preview identity per organic look, so the dialog can show a body before the bot has an id. */
const ORGANIC_IDENTITIES = ORGANIC_AVATAR_LOOKS.map(organicAvatarSampleIdentity);

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)]!;
}

export interface CreateBotDialogInput {
  name: string;
  color: string;
  /** The organic family the preview drew; omitted when a studio shape is picked. */
  avatarFamily?: number;
  title?: string;
  description?: string;
  instructions?: string;
  skillImports?: SkillImportSelection[];
  spawnKey?: string;
}

/** Mounted only while open; the parent unmounts it from `onCancel` or after `onCreate`. */
export function CreateBotDialog({
  onCancel,
  onCreate,
  onImport,
}: {
  onCancel: () => void;
  onCreate: (input: CreateBotDialogInput) => Promise<void>;
  onImport?: () => void;
}) {
  const { t } = useLingui();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"role" | "skills">("role");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [skills, setSkills] = useState<SkillBundle[]>([]);
  const [spawnKey] = useState(() => `hiring:${newClientId()}`);
  const template = COWORKER_TEMPLATES.find((item) => item.id === role);
  const roleReady = Boolean(template || (role === "custom" && customRole.trim()));
  const skillQueries: Record<string, string> = {
    chief: "project coordination",
    engineer: "software development",
    creative: "design",
    growth: "marketing",
  };
  const [look, setLook] = useState(() => ({
    value: pick(BOT_AVATAR_COLORS),
    identity: pick(ORGANIC_IDENTITIES),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  async function create() {
    if (!trimmed || !roleReady || submitting) return;
    setError(null);
    setSubmitting(true);
    const organic = parseBotAvatar(look.value).shapeIndex === undefined;
    try {
      await onCreate({
        name: trimmed,
        color: look.value,
        ...(organic ? { avatarFamily: organicAvatarFamily(look.identity) } : {}),
        title: template?.title ?? customRole.trim().slice(0, 80),
        description: template?.description ?? customRole.trim(),
        instructions: template?.instructions ?? customRole.trim(),
        skillImports: skills.map(({ source, key, revision, sha256 }) => ({
          source,
          key,
          revision,
          sha256,
        })),
        spawnKey,
      });
    } catch (err) {
      setError(errorText(err, t`Could not create bot`));
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        initialFocus={nameRef}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
        data-testid="create-bot-dialog"
      >
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === "role") {
              if (trimmed && roleReady) setStep("skills");
            } else void create();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              {step === "role" ? <Trans>New employee</Trans> : <Trans>Add skills</Trans>}
            </DialogTitle>
          </DialogHeader>
          {step === "role" ? (
            <>
              <div className="flex justify-center py-2">
                <BotAvatar color={look.value} identity={look.identity} size={96} />
              </div>
              <Input
                ref={nameRef}
                aria-label={t`Name`}
                placeholder={t`Name your Bot`}
                value={name}
                maxLength={BOT_NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value)}
                className="text-center"
              />
              {error ? (
                <p
                  role="alert"
                  data-testid="create-bot-error"
                  className="text-[13px] text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <BotLookPicker
                value={look.value}
                identity={look.identity}
                organicIdentities={ORGANIC_IDENTITIES}
                onChange={(value, identity) =>
                  setLook((current) => ({ value, identity: identity ?? current.identity }))
                }
              />
              <fieldset className="space-y-2">
                <legend className="mb-3 text-sm font-medium">
                  <Trans>What will this employee do?</Trans>
                </legend>
                {[
                  { id: "chief", label: t`Coordinate projects` },
                  { id: "engineer", label: t`Build software` },
                  { id: "creative", label: t`Create and design` },
                  { id: "growth", label: t`Marketing and growth` },
                  { id: "custom", label: t`Something else` },
                ].map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="employee-role"
                      value={option.id}
                      checked={role === option.id}
                      onChange={() => setRole(option.id)}
                      className="accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
                {role === "custom" ? (
                  <Textarea
                    aria-label={t`Employee responsibilities`}
                    value={customRole}
                    onChange={(event) => setCustomRole(event.target.value)}
                    maxLength={4000}
                  />
                ) : null}
              </fieldset>
            </>
          ) : (
            <SkillCatalogPicker
              initialQuery={skillQueries[role] ?? "general productivity"}
              selected={skills}
              onChange={setSkills}
            />
          )}
          {step === "skills" && error ? (
            <p role="alert" data-testid="create-bot-error" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            {onImport && step === "role" ? (
              <Button
                type="button"
                variant="ghost"
                className="sm:me-auto"
                disabled={submitting}
                data-testid="create-bot-import"
                onClick={onImport}
              >
                <Trans>Import</Trans>
              </Button>
            ) : null}
            {step === "skills" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => setStep("role")}
              >
                <Trans>Back</Trans>
              </Button>
            ) : null}
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" disabled={!trimmed || !roleReady || submitting}>
              {step === "role" ? <Trans>Continue</Trans> : <Trans>Create</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
