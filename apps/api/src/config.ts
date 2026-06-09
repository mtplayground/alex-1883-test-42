import "dotenv/config";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface UpstreamConfig {
  rustPlaygroundUrl: string;
}

export interface AppConfig {
  allowedOrigins: string[];
  host: string;
  port: number;
  rateLimit: RateLimitConfig;
  upstream: UpstreamConfig;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RUST_PLAYGROUND_URL = "https://play.rust-lang.org";

function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseInteger(
  name: string,
  value: string | undefined,
  defaultValue: number,
  options: { max?: number; min: number }
): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  if (!Number.isInteger(parsed) || parsed < options.min || parsed > max) {
    throw new Error(
      `Invalid ${name} value: expected an integer between ${options.min} and ${max}, received "${value}".`
    );
  }

  return parsed;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseUrl(name: string, value: string | undefined, defaultValue: string): string {
  const rawValue = value || defaultValue;

  try {
    const url = new URL(rawValue);
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      `Invalid ${name} value: expected an absolute URL, received "${rawValue}".`
    );
  }
}

export function getAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const allowedOrigins = optionalEnv(env.ALLOWED_ORIGINS) ?? optionalEnv(env.CORS_ORIGIN);

  return {
    allowedOrigins: parseAllowedOrigins(allowedOrigins),
    host: env.HOST || DEFAULT_HOST,
    port: parseInteger("PORT", optionalEnv(env.PORT), DEFAULT_PORT, {
      min: 1,
      max: 65_535
    }),
    rateLimit: {
      maxRequests: parseInteger(
        "RATE_LIMIT_MAX_REQUESTS",
        optionalEnv(env.RATE_LIMIT_MAX_REQUESTS),
        DEFAULT_RATE_LIMIT_MAX_REQUESTS,
        { min: 1 }
      ),
      windowMs: parseInteger(
        "RATE_LIMIT_WINDOW_MS",
        optionalEnv(env.RATE_LIMIT_WINDOW_MS),
        DEFAULT_RATE_LIMIT_WINDOW_MS,
        { min: 1 }
      )
    },
    upstream: {
      rustPlaygroundUrl: parseUrl(
        "RUST_PLAYGROUND_URL",
        optionalEnv(env.RUST_PLAYGROUND_URL),
        DEFAULT_RUST_PLAYGROUND_URL
      )
    }
  };
}
