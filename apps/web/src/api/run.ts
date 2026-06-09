export type RunCodeChannel = "beta" | "nightly" | "stable";
export type RunCodeCrateType = "bin" | "lib";
export type RunCodeEdition = "2015" | "2018" | "2021" | "2024";
export type RunCodeMode = "debug" | "release";

export interface RunCodeRequest {
  backtrace?: boolean;
  channel?: RunCodeChannel;
  code: string;
  crateType?: RunCodeCrateType;
  edition?: RunCodeEdition;
  mode?: RunCodeMode;
  tests?: boolean;
}

export interface RunCodeResult {
  compilerOutput: string;
  stderr: string;
  stdout: string;
  success: boolean;
}

interface RunApiErrorOptions {
  code: string;
  retryAfterSeconds?: number;
  status: number;
  upstreamStatus?: number;
}

export class RunApiError extends Error {
  readonly code: string;
  readonly retryAfterSeconds?: number;
  readonly status: number;
  readonly upstreamStatus?: number;

  constructor(message: string, options: RunApiErrorOptions) {
    super(message);
    this.name = "RunApiError";
    this.code = options.code;
    this.status = options.status;

    if (options.retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = options.retryAfterSeconds;
    }

    if (options.upstreamStatus !== undefined) {
      this.upstreamStatus = options.upstreamStatus;
    }
  }
}

interface RunCodeOptions {
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRunResult(value: unknown): RunCodeResult {
  if (!isRecord(value)) {
    throw new RunApiError("The run response was not readable.", {
      code: "invalid_response",
      status: 0
    });
  }

  if (
    typeof value.success !== "boolean" ||
    typeof value.stdout !== "string" ||
    typeof value.stderr !== "string" ||
    typeof value.compilerOutput !== "string"
  ) {
    throw new RunApiError("The run response did not include output fields.", {
      code: "invalid_response",
      status: 0
    });
  }

  return {
    compilerOutput: value.compilerOutput,
    stderr: value.stderr,
    stdout: value.stdout,
    success: value.success
  };
}

function parseErrorBody(value: unknown) {
  if (!isRecord(value) || !isRecord(value.error)) {
    return {
      code: "request_failed",
      message: "The run request failed."
    };
  }

  return {
    code: typeof value.error.code === "string" ? value.error.code : "request_failed",
    message:
      typeof value.error.message === "string"
        ? value.error.message
        : "The run request failed.",
    retryAfterSeconds:
      typeof value.error.retryAfterSeconds === "number"
        ? value.error.retryAfterSeconds
        : undefined,
    upstreamStatus:
      typeof value.error.upstreamStatus === "number"
        ? value.error.upstreamStatus
        : undefined
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function runRustCode(
  request: RunCodeRequest,
  options: RunCodeOptions = {}
): Promise<RunCodeResult> {
  let response: Response;

  try {
    response = await fetch("/run", {
      body: JSON.stringify(request),
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      ...(options.signal ? { signal: options.signal } : {})
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new RunApiError("The run service could not be reached.", {
      code: "network_error",
      status: 0
    });
  }

  const responseBody = await readJson(response);

  if (!response.ok) {
    const errorBody = parseErrorBody(responseBody);
    throw new RunApiError(errorBody.message, {
      code: errorBody.code,
      ...(errorBody.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: errorBody.retryAfterSeconds }
        : {}),
      status: response.status,
      ...(errorBody.upstreamStatus !== undefined
        ? { upstreamStatus: errorBody.upstreamStatus }
        : {})
    });
  }

  return parseRunResult(responseBody);
}
