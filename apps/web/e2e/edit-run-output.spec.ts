import { expect, test } from "@playwright/test";

test("edits a runnable snippet, runs it, and renders stdout", async ({ page }) => {
  const editedCode = `fn main() {
    println!("edited from e2e");
}`;
  let runRequests = 0;

  await page.route("**/run", async (route) => {
    runRequests += 1;
    const body = route.request().postDataJSON() as { code?: string };

    expect(body.code).toContain('println!("edited from e2e");');

    await new Promise((resolve) => setTimeout(resolve, 150));

    await route.fulfill({
      body: JSON.stringify({
        compilerOutput: "",
        stderr: "",
        stdout: "edited from e2e\n",
        success: true
      }),
      contentType: "application/json",
      status: 200
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Start with a small Rust program" })
  ).toBeVisible();

  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type(editedCode);
  await page.getByRole("button", { name: "Run" }).click();

  await expect(page.getByRole("button", { name: "Running" })).toBeVisible();
  await expect(page.getByText("edited from e2e")).toBeVisible();
  await expect(page.getByText("Success")).toBeVisible();
  expect(runRequests).toBe(1);
});
