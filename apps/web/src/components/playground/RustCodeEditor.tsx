import { rust } from "@codemirror/lang-rust";
import CodeMirror from "@uiw/react-codemirror";
import { Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useTheme } from "../../theme/themeContext";

export interface RustCodeEditorProps {
  initialCode: string;
  onRun?: (code: string) => void;
}

export function RustCodeEditor({ initialCode, onRun }: RustCodeEditorProps) {
  const { theme } = useTheme();
  const [code, setCode] = useState(initialCode);
  const extensions = useMemo(() => [rust()], []);
  const canRun = code.trim().length > 0;

  const handleRun = useCallback(() => {
    if (!canRun) {
      return;
    }

    onRun?.(code);
    window.dispatchEvent(
      new CustomEvent("rust-manual:run", {
        detail: {
          code
        }
      })
    );
  }, [canRun, code, onRun]);

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
          disabled={!canRun}
        >
          <Play aria-hidden="true" size={16} />
          Run
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
    </section>
  );
}
