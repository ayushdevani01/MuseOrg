import { useState } from "react";

export function ConnectorIcon({
  name,
  logo,
  iconPath,
}: {
  name: string;
  logo?: string | null;
  iconPath?: string;
}) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  return logo && failedLogo !== logo ? (
    <img
      src={logo}
      alt=""
      data-testid="connector-logo"
      loading="lazy"
      decoding="async"
      onError={() => setFailedLogo(logo)}
      className="h-9 w-9 shrink-0 rounded-xl bg-accent object-contain"
    />
  ) : iconPath ? (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
      <svg
        aria-hidden="true"
        data-testid="connector-logo"
        viewBox="0 0 24 24"
        className="size-6"
        fill="currentColor"
      >
        <path d={iconPath} />
      </svg>
    </div>
  ) : (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-semibold text-foreground">
      {name[0]}
    </div>
  );
}
