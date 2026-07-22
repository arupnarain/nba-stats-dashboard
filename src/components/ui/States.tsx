import type { ReactNode } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import { Card } from "./Card";

/** Consistent empty / error / info panel used across every tab. */
function Panel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="text-faint">{icon}</div>
      <p className="text-sm font-semibold text-text">{title}</p>
      {children ? <p className="max-w-sm text-sm text-muted">{children}</p> : null}
    </Card>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Panel icon={<AlertTriangle className="h-7 w-7" />} title="Couldn't load this data">
      The upstream stats feed did not respond.{" "}
      {onRetry ? (
        <button onClick={onRetry} className="text-accent underline underline-offset-2">
          Try again
        </button>
      ) : null}
    </Panel>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Panel icon={<SearchX className="h-7 w-7" />} title={title}>
      {hint}
    </Panel>
  );
}
