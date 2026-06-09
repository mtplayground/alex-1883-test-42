import { Router } from "express";

import type { AppConfig } from "../config.js";
import { getAppConfig } from "../config.js";
import {
  createRustPlaygroundClient,
  RustPlaygroundError,
  type RustPlaygroundChannel,
  type RustPlaygroundClient,
  type RustPlaygroundCrateType,
  type RustPlaygroundEdition,
  type RustPlaygroundMode,
  type RustPlaygroundRunRequest,
  type RustPlaygroundRunResult
} from "../services/rustPlaygroundClient.js";

const CHANNELS = ["stable", "beta", "nightly"] as const;
const CRATE_TYPES = ["bin", "lib"] as const;
const EDITIONS = ["2015", "2018", "2021", "2024"] as const;
const MODES = ["debug", "release"] as const;

interface RunRouterOptions {
  client?: RustPlaygroundClient;
  config?: AppConfig;
}

interface ValidationSuccess {
  ok: true;
  value: RustPlaygroundRunRequest;
}

interface ValidationFailure {
  code: string;
  message: string;
  ok: false;
  status: number;
}

type ValidationResult = ValidationSuccess | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateOptionalBoolean(
  body: Record<string, unknown>,
  field: "backtrace" | "tests"
): boolean | ValidationFailure | undefined {
  const value = body[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    return {
      code: "invalid_field",
      message: `${field} must be a boolean when provided.`,
      ok: false,
      status: 400
    };
  }

  return value;
}

function validateOptionalEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[]
): T | ValidationFailure | undefined {
  const value = body[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !allowed.includes(value as T)) {
    return {
      code: "invalid_field",
      message: `${field} must be one of: ${allowed.join(", ")}.`,
      ok: false,
      status: 400
    };
  }

  return value as T;
}

function validateRunBody(body: unknown, maxCodeBytes: number): ValidationResult {
  if (!isRecord(body)) {
    return {
      code: "invalid_body",
      message: "Request body must be a JSON object.",
      ok: false,
      status: 400
    };
  }

  if (typeof body.code !== "string") {
    return {
      code: "invalid_field",
      message: "code must be a string.",
      ok: false,
      status: 400
    };
  }

  if (body.code.trim().length === 0) {
    return {
      code: "invalid_field",
      message: "code must not be empty.",
      ok: false,
      status: 400
    };
  }

  const codeBytes = Buffer.byteLength(body.code, "utf8");
  if (codeBytes > maxCodeBytes) {
    return {
      code: "code_too_large",
      message: `code must be ${maxCodeBytes} bytes or smaller.`,
      ok: false,
      status: 413
    };
  }

  const channel = validateOptionalEnum<RustPlaygroundChannel>(body, "channel", CHANNELS);
  if (isValidationFailure(channel)) {
    return channel;
  }

  const crateType = validateOptionalEnum<RustPlaygroundCrateType>(
    body,
    "crateType",
    CRATE_TYPES
  );
  if (isValidationFailure(crateType)) {
    return crateType;
  }

  const edition = validateOptionalEnum<RustPlaygroundEdition>(body, "edition", EDITIONS);
  if (isValidationFailure(edition)) {
    return edition;
  }

  const mode = validateOptionalEnum<RustPlaygroundMode>(body, "mode", MODES);
  if (isValidationFailure(mode)) {
    return mode;
  }

  const backtrace = validateOptionalBoolean(body, "backtrace");
  if (isValidationFailure(backtrace)) {
    return backtrace;
  }

  const tests = validateOptionalBoolean(body, "tests");
  if (isValidationFailure(tests)) {
    return tests;
  }

  return {
    ok: true,
    value: {
      ...(backtrace !== undefined ? { backtrace } : {}),
      ...(channel !== undefined ? { channel } : {}),
      code: body.code,
      ...(crateType !== undefined ? { crateType } : {}),
      ...(edition !== undefined ? { edition } : {}),
      ...(mode !== undefined ? { mode } : {}),
      ...(tests !== undefined ? { tests } : {})
    }
  };
}

function isValidationFailure(value: unknown): value is ValidationFailure {
  return isRecord(value) && value.ok === false;
}

function normalizeRunResult(result: RustPlaygroundRunResult) {
  return {
    compilerOutput: result.stderr,
    stderr: result.stderr,
    stdout: result.stdout,
    success: result.success
  };
}

interface UpstreamErrorResponse {
  code: string;
  message: string;
  status: number;
  upstreamStatus?: number;
}

function serializeUpstreamError(error: RustPlaygroundError) {
  return {
    name: error.name,
    code: error.code,
    message: error.message,
    stack: error.stack,
    status: error.status
  };
}

function playgroundErrorResponse(error: RustPlaygroundError): UpstreamErrorResponse {
  switch (error.code) {
    case "timeout":
      return {
        code: "upstream_timeout",
        message: "Rust Playground did not respond before the timeout.",
        status: 504
      };
    case "invalid_response":
      return {
        code: "upstream_invalid_response",
        message: "Rust Playground returned a response the API could not read.",
        status: 502
      };
    case "upstream_http_error":
      return {
        code: "upstream_http_error",
        message: "Rust Playground rejected the run request.",
        status: 502,
        ...(error.status !== undefined ? { upstreamStatus: error.status } : {})
      };
    case "network_error":
      return {
        code: "upstream_unavailable",
        message: "Rust Playground could not be reached.",
        status: 502
      };
  }
}

export function createRunRouter(options: RunRouterOptions = {}) {
  const config = options.config ?? getAppConfig();
  const client = options.client ?? createRustPlaygroundClient(config);
  const router = Router();

  router.post("/", async (req, res, next) => {
    const validation = validateRunBody(req.body, config.run.maxCodeBytes);

    if (!validation.ok) {
      res.status(validation.status).json({
        error: {
          code: validation.code,
          message: validation.message
        }
      });
      return;
    }

    try {
      const result = await client.run(validation.value);
      res.status(200).json(normalizeRunResult(result));
    } catch (error) {
      if (error instanceof RustPlaygroundError) {
        console.error("Rust Playground upstream error", serializeUpstreamError(error));

        const upstreamError = playgroundErrorResponse(error);
        res.status(upstreamError.status).json({
          error: {
            code: upstreamError.code,
            message: upstreamError.message,
            ...(upstreamError.upstreamStatus !== undefined
              ? { upstreamStatus: upstreamError.upstreamStatus }
              : {})
          }
        });
        return;
      }

      next(error);
    }
  });

  return router;
}
