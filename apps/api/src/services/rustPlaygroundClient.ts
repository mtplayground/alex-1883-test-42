import type { AppConfig } from "../config.js";
import { getAppConfig } from "../config.js";

export type RustPlaygroundChannel = "beta" | "nightly" | "stable";
export type RustPlaygroundCrateType = "bin" | "lib";
export type RustPlaygroundEdition = "2015" | "2018" | "2021" | "2024";
export type RustPlaygroundMode = "debug" | "release";

export interface RustPlaygroundRunRequest {
  backtrace?: boolean;
  channel?: RustPlaygroundChannel;
  code: string;
  crateType?: RustPlaygroundCrateType;
  edition?: RustPlaygroundEdition;
  mode?: RustPlaygroundMode;
  tests?: boolean;
}

export interface RustPlaygroundRunResult {
  stderr: string;
  stdout: string;
  success: boolean;
}

interface RustPlaygroundExecutePayload {
  backtrace: boolean;
  channel: RustPlaygroundChannel;
  code: string;
  crateType: RustPlaygroundCrateType;
  edition: RustPlaygroundEdition;
  mode: RustPlaygroundMode;
  tests: boolean;
}

type RustPlaygroundErrorCode =
  | "invalid_response"
  | "network_error"
  | "timeout"
  | "upstream_http_error";

interface RustPlaygroundErrorOptions {
  code: RustPlaygroundErrorCode;
  status?: number;
}

export class RustPlaygroundError extends Error {
  readonly code: RustPlaygroundErrorCode;
  readonly status?: number;

  constructor(message: string, options: RustPlaygroundErrorOptions) {
    super(message);
    this.name = "RustPlaygroundError";
    this.code = options.code;

    if (options.status !== undefined) {
      this.status = options.status;
    }
  }
}

export interface RustPlaygroundClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  return new URL(baseUrl).toString().replace(/\/$/, "");
}

function toPayload(request: RustPlaygroundRunRequest): RustPlaygroundExecutePayload {
  return {
    backtrace: request.backtrace ?? false,
    channel: request.channel ?? "stable",
    code: request.code,
    crateType: request.crateType ?? "bin",
    edition: request.edition ?? "2021",
    mode: request.mode ?? "debug",
    tests: request.tests ?? false
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlaygroundResponse(value: unknown): RustPlaygroundRunResult {
  if (!isRecord(value)) {
    throw new RustPlaygroundError("Rust Playground returned a non-object response.", {
      code: "invalid_response"
    });
  }

  if (
    typeof value.success !== "boolean" ||
    typeof value.stdout !== "string" ||
    typeof value.stderr !== "string"
  ) {
    throw new RustPlaygroundError(
      "Rust Playground response did not include success, stdout, and stderr fields.",
      { code: "invalid_response" }
    );
  }

  return {
    stderr: value.stderr,
    stdout: value.stdout,
    success: value.success
  };
}

export class RustPlaygroundClient {
  private readonly executeUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: RustPlaygroundClientOptions) {
    this.executeUrl = new URL(
      "/execute",
      `${normalizeBaseUrl(options.baseUrl)}/`
    ).toString();
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs;
  }

  async run(request: RustPlaygroundRunRequest): Promise<RustPlaygroundRunResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.executeUrl, {
        body: JSON.stringify(toPayload(request)),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new RustPlaygroundError(
          `Rust Playground responded with HTTP ${response.status}.`,
          { code: "upstream_http_error", status: response.status }
        );
      }

      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch {
        throw new RustPlaygroundError("Rust Playground returned invalid JSON.", {
          code: "invalid_response"
        });
      }

      return parsePlaygroundResponse(responseBody);
    } catch (error) {
      if (error instanceof RustPlaygroundError) {
        throw error;
      }

      if (isAbortError(error)) {
        throw new RustPlaygroundError("Rust Playground request timed out.", {
          code: "timeout"
        });
      }

      throw new RustPlaygroundError("Rust Playground request failed.", {
        code: "network_error"
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createRustPlaygroundClient(config: AppConfig = getAppConfig()) {
  return new RustPlaygroundClient({
    baseUrl: config.upstream.rustPlaygroundUrl,
    timeoutMs: config.upstream.rustPlaygroundTimeoutMs
  });
}
