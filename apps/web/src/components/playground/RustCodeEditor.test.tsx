import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunApiError, runRustCode, type RunCodeResult } from "../../api/run";
import type * as RunApiModule from "../../api/run";
import { ThemeContext } from "../../theme/themeContext";
import { RustCodeEditor } from "./RustCodeEditor";

vi.mock("@codemirror/lang-rust", () => ({
  rust: () => []
}));

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    "aria-label": ariaLabel,
    onChange,
    value
  }: {
    "aria-label"?: string;
    onChange: (value: string) => void;
    value: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? "Rust code editor"}
      onChange={(event) => onChange(event.currentTarget.value)}
      value={value}
    />
  )
}));

vi.mock("../../api/run", async (importOriginal) => {
  const actual = await importOriginal<typeof RunApiModule>();

  return {
    ...actual,
    runRustCode: vi.fn()
  };
});

const mockedRunRustCode = vi.mocked(runRustCode);

function renderEditor(initialCode = "fn main() {}") {
  return render(
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: vi.fn() }}>
      <RustCodeEditor initialCode={initialCode} />
    </ThemeContext.Provider>
  );
}

describe("RustCodeEditor", () => {
  beforeEach(() => {
    mockedRunRustCode.mockReset();
  });

  it("sends edited Rust code to the run client", async () => {
    const user = userEvent.setup();
    mockedRunRustCode.mockResolvedValue({
      compilerOutput: "",
      stderr: "",
      stdout: "ok",
      success: true
    });
    renderEditor();

    const editor = screen.getByLabelText("Rust code editor");
    await user.clear(editor);
    await user.type(editor, "let answer = 42;");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => {
      expect(mockedRunRustCode).toHaveBeenCalledWith(
        { code: "let answer = 42;" },
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  it("shows loading and then success output", async () => {
    const user = userEvent.setup();
    let resolveRun: (value: RunCodeResult) => void = () => undefined;
    mockedRunRustCode.mockReturnValue(
      new Promise((resolve) => {
        resolveRun = resolve;
      })
    );
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Run" }));

    expect(screen.getByRole("button", { name: "Running" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Running" }) as HTMLButtonElement).disabled
    ).toBe(true);

    resolveRun({
      compilerOutput: "",
      stderr: "",
      stdout: "compiled",
      success: true
    });

    expect(await screen.findByText("compiled")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run" })).toBeTruthy();
  });

  it("shows API errors from failed runs", async () => {
    const user = userEvent.setup();
    mockedRunRustCode.mockRejectedValue(
      new RunApiError("The upstream compiler timed out.", {
        code: "upstream_timeout",
        status: 504,
        upstreamStatus: 504
      })
    );
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Run" }));

    expect(await screen.findByText("The upstream compiler timed out.")).toBeTruthy();
    expect(
      screen.getByText("code: upstream_timeout · status: 504 · upstream: 504")
    ).toBeTruthy();
  });
});
