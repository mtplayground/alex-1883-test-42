import { Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning";

interface CalloutProps {
  children: ReactNode;
  title?: string;
  type?: CalloutType;
}

const calloutStyles: Record<
  CalloutType,
  { Icon: LucideIcon; accent: string; title: string }
> = {
  note: {
    Icon: Info,
    accent:
      "border-sky-500/40 bg-sky-50 text-sky-950 dark:border-sky-400/40 dark:bg-sky-950/30 dark:text-sky-100",
    title: "Note"
  },
  tip: {
    Icon: Lightbulb,
    accent:
      "border-moss-500/40 bg-lime-50 text-moss-700 dark:border-lime-400/40 dark:bg-lime-950/20 dark:text-lime-100",
    title: "Tip"
  },
  warning: {
    Icon: TriangleAlert,
    accent:
      "border-rust-500/40 bg-amber-50 text-rust-600 dark:border-amber-400/50 dark:bg-amber-950/20 dark:text-amber-100",
    title: "Watch"
  }
};

export function Callout({ children, title, type = "note" }: CalloutProps) {
  const { Icon, accent, title: defaultTitle } = calloutStyles[type];

  return (
    <aside className={`mt-6 rounded-lg border p-4 ${accent}`}>
      <div className="flex gap-3">
        <Icon className="mt-1 h-5 w-5 flex-none" aria-hidden="true" />
        <div>
          <p className="mt-0 font-semibold">{title ?? defaultTitle}</p>
          <div className="mt-2 text-sm leading-7">{children}</div>
        </div>
      </div>
    </aside>
  );
}
