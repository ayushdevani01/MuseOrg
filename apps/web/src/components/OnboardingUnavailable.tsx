import { Trans } from "@lingui/react/macro";
import { Button } from "@rakazo/ui-web";

export function OnboardingUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-full place-items-center bg-background px-6">
      <div>
        <p role="alert" className="text-sm text-destructive">
          <Trans>Could not load setup.</Trans>
        </p>
        <Button className="mt-4" onClick={onRetry}>
          <Trans>Try again</Trans>
        </Button>
      </div>
    </div>
  );
}
