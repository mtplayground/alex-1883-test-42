import express from "express";
import request from "supertest";
import { describe, expect, it, vi, type Mock } from "vitest";

import type { AppConfig } from "../src/config.js";
import { createRateLimitMiddleware } from "../src/middleware/rateLimit.js";
import { createRunRouter } from "../src/routes/run.js";
import {
  RustPlaygroundError,
  type RustPlaygroundRunRequest,
  type RustPlaygroundRunResult,
  type RustPlaygroundRunner
} from "../src/services/rustPlaygroundClient.js";

type RunMock = Mock<
  (request: RustPlaygroundRunRequest) => Promise<RustPlaygroundRunResult>
>;

function createConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    allowedOrigins: [],
    host: "0.0.0.0",
    port: 8080,
    rateLimit: {
      maxRequests: 60,
      windowMs: 60_000
    },
    run: {
      maxCodeBytes: 100_000
    },
    upstream: {
      rustPlaygroundTimeoutMs: 10_000,
      rustPlaygroundUrl: "https://play.rust-lang.org"
    },
    ...overrides
  };
}

function createClient(run: RunMock): RustPlaygroundRunner {
  return {
    run
  };
}

function createTestApp({
  client,
  config = createConfig()
}: {
  client: RustPlaygroundRunner;
  config?: AppConfig;
}) {
  const app = express();

  app.use(express.json());
  app.use(
    "/run",
    createRateLimitMiddleware(config.rateLimit),
    createRunRouter({ client, config })
  );

  return app;
}

describe("POST /run", () => {
  it("returns normalized output from the Playground client", async () => {
    const run = vi.fn<RunMock>().mockResolvedValue({
      stderr: "",
      stdout: "hello\n",
      success: true
    });
    const app = createTestApp({ client: createClient(run) });

    const response = await request(app)
      .post("/run")
      .send({ code: 'fn main() { println!("hello"); }' })
      .expect(200);

    expect(response.body).toEqual({
      compilerOutput: "",
      stderr: "",
      stdout: "hello\n",
      success: true
    });
    expect(run).toHaveBeenCalledWith({
      code: 'fn main() { println!("hello"); }'
    });
  });

  it("rejects invalid request bodies before calling upstream", async () => {
    const run = vi.fn<RunMock>();
    const app = createTestApp({ client: createClient(run) });

    const response = await request(app).post("/run").send({ code: "" }).expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: "invalid_field"
      }
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("enforces UTF-8 code size caps before calling upstream", async () => {
    const run = vi.fn<RunMock>();
    const app = createTestApp({
      client: createClient(run),
      config: createConfig({
        run: {
          maxCodeBytes: 3
        }
      })
    });

    const response = await request(app).post("/run").send({ code: "rust" }).expect(413);

    expect(response.body).toMatchObject({
      error: {
        code: "code_too_large"
      }
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    const run = vi.fn<RunMock>().mockResolvedValue({
      stderr: "",
      stdout: "",
      success: true
    });
    const app = createTestApp({
      client: createClient(run),
      config: createConfig({
        rateLimit: {
          maxRequests: 1,
          windowMs: 60_000
        }
      })
    });

    await request(app)
      .post("/run")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ code: "fn main() {}" })
      .expect(200);

    const response = await request(app)
      .post("/run")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ code: "fn main() {}" })
      .expect(429);

    expect(response.headers["retry-after"]).toBeDefined();
    expect(response.body).toMatchObject({
      error: {
        code: "rate_limited"
      }
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("returns a timeout response when the Playground client times out", async () => {
    const run = vi.fn<RunMock>().mockRejectedValue(
      new RustPlaygroundError("timed out", {
        code: "timeout"
      })
    );
    const app = createTestApp({ client: createClient(run) });

    const response = await request(app)
      .post("/run")
      .send({ code: "fn main() {}" })
      .expect(504);

    expect(response.body).toEqual({
      error: {
        code: "upstream_timeout",
        message: "Rust Playground did not respond before the timeout."
      }
    });
  });

  it("returns upstream status details for Playground HTTP failures", async () => {
    const run = vi.fn<RunMock>().mockRejectedValue(
      new RustPlaygroundError("upstream rejected", {
        code: "upstream_http_error",
        status: 503
      })
    );
    const app = createTestApp({ client: createClient(run) });

    const response = await request(app)
      .post("/run")
      .send({ code: "fn main() {}" })
      .expect(502);

    expect(response.body).toEqual({
      error: {
        code: "upstream_http_error",
        message: "Rust Playground rejected the run request.",
        upstreamStatus: 503
      }
    });
  });
});
