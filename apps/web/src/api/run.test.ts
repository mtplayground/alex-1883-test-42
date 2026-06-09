import { afterEach, describe, expect, it, vi } from "vitest";

import { RunApiError, runRustCode } from "./run";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });
}

describe("runRustCode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a run request and returns normalized output", async () => {
    const result = {
      compilerOutput: "",
      stderr: "",
      stdout: "hello\n",
      success: true
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      runRustCode({ code: 'fn main() { println!("hello"); }' })
    ).resolves.toEqual(result);

    expect(fetchMock).toHaveBeenCalledWith(
      "/run",
      expect.objectContaining({
        body: JSON.stringify({ code: 'fn main() { println!("hello"); }' }),
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    );
  });

  it("throws a typed API error for structured error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "rate_limited",
              message: "Too many run requests.",
              retryAfterSeconds: 30
            }
          },
          { status: 429 }
        )
      )
    );

    await expect(runRustCode({ code: "fn main() {}" })).rejects.toMatchObject({
      code: "rate_limited",
      message: "Too many run requests.",
      retryAfterSeconds: 30,
      status: 429
    });
  });

  it("throws a network error when the request cannot reach the service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));

    await expect(runRustCode({ code: "fn main() {}" })).rejects.toMatchObject({
      code: "network_error",
      message: "The run service could not be reached.",
      status: 0
    });
  });

  it("rejects unreadable success payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ stdout: "missing fields" }, { status: 200 }))
    );

    const error = await runRustCode({ code: "fn main() {}" }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(RunApiError);
    expect(error).toMatchObject({
      code: "invalid_response",
      status: 0
    });
  });
});
