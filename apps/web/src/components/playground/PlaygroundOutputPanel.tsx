import { AlertTriangle, CheckCircle2, LoaderCircle, Terminal } from "lucide-react";

import type { RunApiError, RunCodeResult } from "../../api/run";

export type PlaygroundRunState =
  | { status: "idle" }
  | { status: "loading" }
  | { error: RunApiError; status: "error" }
  | { result: RunCodeResult; status: "success" };

interface PlaygroundOutputPanelProps {
  state: PlaygroundRunState;
}

function OutputBlock({
  emptyText,
  title,
  value
}: {
  emptyText: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-950">
      <div className="border-b border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-stone-700 dark:text-stone-400">
        {title}
      </div>
      <pre className="mt-0 max-h-64 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-sm leading-6 text-ink-950 dark:text-stone-100">
        {value || emptyText}
      </pre>
    </div>
  );
}

function ErrorDetails({ error }: { error: RunApiError }) {
  const details = [
    `code: ${error.code}`,
    `status: ${error.status}`,
    error.upstreamStatus !== undefined ? `upstream: ${error.upstreamStatus}` : undefined,
    error.retryAfterSeconds !== undefined
      ? `retry after: ${error.retryAfterSeconds}s`
      : undefined
  ].filter(Boolean);

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-rust-600 dark:border-amber-400/40 dark:bg-amber-950/20 dark:text-amber-100">
      <div className="flex gap-2">
        <AlertTriangle className="mt-1 h-4 w-4 flex-none" aria-hidden="true" />
        <div>
          <p className="mt-0 font-semibold">{error.message}</p>
          <p className="mt-1 font-mono text-xs">{details.join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

export function PlaygroundOutputPanel({ state }: PlaygroundOutputPanelProps) {
  return (
    <section
      aria-live="polite"
      className="border-t border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-950 dark:text-stone-100">
          <Terminal className="h-4 w-4" aria-hidden="true" />
          Output
        </div>
        {state.status === "success" ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              state.result.success
                ? "bg-lime-100 text-moss-700 dark:bg-lime-950/30 dark:text-lime-300"
                : "bg-amber-100 text-rust-600 dark:bg-amber-950/30 dark:text-amber-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {state.result.success ? "Success" : "Failed"}
          </span>
        ) : null}
      </div>

      {state.status === "idle" ? (
        <div className="rounded-md border border-dashed border-stone-300 p-4 text-sm text-ink-500 dark:border-stone-700 dark:text-stone-400">
          Run the snippet to see stdout and compiler output.
        </div>
      ) : null}

      {state.status === "loading" ? (
        <div className="flex items-center gap-2 rounded-md border border-stone-200 p-4 text-sm text-ink-700 dark:border-stone-700 dark:text-stone-300">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Running
        </div>
      ) : null}

      {state.status === "error" ? <ErrorDetails error={state.error} /> : null}

      {state.status === "success" ? (
        <div className="space-y-3">
          <OutputBlock
            emptyText="(no stdout)"
            title="stdout"
            value={state.result.stdout}
          />
          <OutputBlock
            emptyText="(no stderr or compiler output)"
            title="stderr / compiler"
            value={state.result.stderr || state.result.compilerOutput}
          />
          {state.result.compilerOutput &&
          state.result.compilerOutput !== state.result.stderr ? (
            <OutputBlock
              emptyText="(no compiler output)"
              title="compiler"
              value={state.result.compilerOutput}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
