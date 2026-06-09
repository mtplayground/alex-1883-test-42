import { Check, Copy } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef
} from "react";

import { textFromNode } from "../../lib/reactText";

function copyWithTextarea(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyText(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  copyWithTextarea(text);
}

export function CodeBlock({ children }: ComponentPropsWithoutRef<"pre">) {
  const code = textFromNode(children).trimEnd();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  const handleCopy = useCallback(async () => {
    try {
      await copyText(code);
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.error("Unable to copy code block", error);
    }
  }, [code]);

  useEffect(() => {
    return () => {
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  return (
    <div className="group relative mt-6">
      <pre className="mt-0 overflow-x-auto rounded-lg border border-stone-200 bg-ink-950 p-5 pr-14 text-sm leading-7 text-stone-100 shadow-sm dark:border-stone-700 dark:bg-black">
        {children}
      </pre>
      <button
        type="button"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-700 bg-ink-950 text-stone-300 transition hover:border-rust-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-rust-500 dark:bg-black"
        onClick={handleCopy}
        aria-label={copied ? "Code copied" : "Copy code"}
        title={copied ? "Code copied" : "Copy code"}
      >
        {copied ? (
          <Check aria-hidden="true" size={16} />
        ) : (
          <Copy aria-hidden="true" size={16} />
        )}
      </button>
    </div>
  );
}
