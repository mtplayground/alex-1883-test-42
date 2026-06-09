import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  reporter: "list",
  testDir: "./apps/web/e2e",
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev:web",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:8080"
  }
});
