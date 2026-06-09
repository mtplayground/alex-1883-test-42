import type { ReactNode } from "react";

import type {
  RunCodeChannel,
  RunCodeCrateType,
  RunCodeEdition,
  RunCodeMode,
  RunCodeRequest
} from "../../api/run";
import { textFromNode } from "../../lib/reactText";
import { RustCodeEditor } from "./RustCodeEditor";

interface RunnableSnippetProps {
  backtrace?: boolean;
  channel?: RunCodeChannel;
  children?: ReactNode;
  code?: string;
  crateType?: RunCodeCrateType;
  edition?: RunCodeEdition;
  mode?: RunCodeMode;
  tests?: boolean;
  title?: string;
}

function normalizeCode(value: string): string {
  return value.replace(/^\n+/, "").replace(/\n+$/, "");
}

function runOptionsFromProps({
  backtrace,
  channel,
  crateType,
  edition,
  mode,
  tests
}: RunnableSnippetProps): Omit<RunCodeRequest, "code"> {
  return {
    ...(backtrace !== undefined ? { backtrace } : {}),
    ...(channel !== undefined ? { channel } : {}),
    ...(crateType !== undefined ? { crateType } : {}),
    ...(edition !== undefined ? { edition } : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(tests !== undefined ? { tests } : {})
  };
}

export function RunnableSnippet(props: RunnableSnippetProps) {
  const initialCode = normalizeCode(props.code ?? textFromNode(props.children));

  return (
    <RustCodeEditor
      initialCode={initialCode}
      runOptions={runOptionsFromProps(props)}
      title={props.title ?? "Runnable snippet"}
    />
  );
}
