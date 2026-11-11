import { defineConfig } from "@playwright/test";
import { qaProxy } from "./e2e/network";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [["list"]],
  globalSetup: "./e2e/setup.ts",
  use: {
    baseURL: process.env.QA_BASE_URL ?? "http://127.0.0.1:3000",
    browserName: "chromium",
    proxy: qaProxy,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] },
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
});
