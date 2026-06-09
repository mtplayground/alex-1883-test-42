import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunApiError } from "../../api/run";
import { PlaygroundOutputPanel } from "./PlaygroundOutputPanel";

describe("PlaygroundOutputPanel", () => {
  it("renders the idle state", () => {
    render(<PlaygroundOutputPanel state={{ status: "idle" }} />);

    expect(
      screen.getByText("Run the snippet to see stdout and compiler output.")
    ).toBeTruthy();
  });

  it("renders the loading state", () => {
    render(<PlaygroundOutputPanel state={{ status: "loading" }} />);

    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("renders stdout and compiler output for successful runs", () => {
    render(
      <PlaygroundOutputPanel
        state={{
          result: {
            compilerOutput: "Finished dev profile",
            stderr: "",
            stdout: "hello from rust",
            success: true
          },
          status: "success"
        }}
      />
    );

    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByText("hello from rust")).toBeTruthy();
    expect(screen.getAllByText("Finished dev profile")).toHaveLength(2);
  });

  it("renders typed API errors with retry details", () => {
    const error = new RunApiError("Too many run requests.", {
      code: "rate_limited",
      retryAfterSeconds: 45,
      status: 429
    });

    render(<PlaygroundOutputPanel state={{ error, status: "error" }} />);

    expect(screen.getByText("Too many run requests.")).toBeTruthy();
    expect(
      screen.getByText("code: rate_limited · status: 429 · retry after: 45s")
    ).toBeTruthy();
  });
});
