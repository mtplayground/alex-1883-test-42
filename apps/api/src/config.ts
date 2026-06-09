export interface ServerConfig {
  corsOrigins: string[];
  host: string;
  port: number;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    corsOrigins: parseCorsOrigins(env.CORS_ORIGIN),
    host: env.HOST || DEFAULT_HOST,
    port: parsePort(env.PORT)
  };
}
