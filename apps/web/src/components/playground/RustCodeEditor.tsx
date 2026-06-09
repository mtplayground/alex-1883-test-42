import { rust } from "@codemirror/lang-rust";
import CodeMirror from "@uiw/react-codemirror";
import { LoaderCircle, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RunApiError, runRustCode } from "../../api/run";
import { useTheme } from "../../theme/themeContext";
import { PlaygroundOutputPanel, type PlaygroundRunState } from "./PlaygroundOutputPanel";

export interface RustCodeEditorProps {
  initialCode: string;
  onRun?: (code: string) => void;
}

export function RustCodeEditor({ initialCode, onRun }: RustCodeEditorProps) {
  const { theme } = useTheme();
  const [code, setCode] = useState(initialCode);
  const [runState, setRunState] = useState<PlaygroundRunState>({ status: "idle" });
  const abortController = useRef<AbortController | null>(null);
  const extensions = useMemo(() => [rust()], []);
  const canRun = code.trim().length > 0;
  const isRunning = runState.status === "loading";

  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (!canRun || isRunning) {
      return;
    }

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setRunState({ status: "loading" });

    try {
      onRun?.(code);
    } catch (error) {
      console.error("Run callback failed", error);
    }

    window.dispatchEvent(
      new CustomEvent("rust-manual:run", {
        detail: {
          code
        }
      })
    );

    try {
      const result = await runRustCode({ code }, { signal: controller.signal });

      if (abortController.current === controller) {
        setRunState({ result, status: "success" });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const runError =
        error instanceof RunApiError
          ? error
          : new RunApiError("The run request failed.", {
              code: "unknown_error",
              status: 0
            });

      setRunState({ error: runError, status: "error" });
    } finally {
      if (abortController.current === controller) {
        abortController.current = null;
      }
    }
  }, [canRun, code, isRunning, onRun]);

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <p className="mt-0 text-sm font-semibold text-ink-950 dark:text-stone-100">
          Rust editor
        </p>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-rust-600 px-3 text-sm font-semibold text-white transition hover:bg-rust-500 focus:outline-none focus:ring-2 focus:ring-rust-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 dark:focus:ring-offset-stone-900 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
          onClick={handleRun}
          disabled={!canRun || isRunning}
        >
          {isRunning ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" size={16} />
          ) : (
            <Play aria-hidden="true" size={16} />
          )}
          {isRunning ? "Running" : "Run"}
        </button>
      </div>

      <CodeMirror
        aria-label="Rust code editor"
        basicSetup={{
          autocompletion: true,
          bracketMatching: true,
          foldGutter: true,
          highlightActiveLine: true,
          lineNumbers: true
        }}
        className="rust-code-editor text-sm"
        extensions={extensions}
        height="20rem"
        onChange={setCode}
        theme={theme}
        value={code}
      />
      <PlaygroundOutputPanel state={runState} />
    </section>
  );
}
