import { defineConfig } from "@playwright/test";

// Runs against a running app (npm run build && npm start) backed by local Supabase
// with LLM_PROVIDER=fixture. See docs/08-setup-and-deployment.md.
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
    screenshot: "only-on-failure",
  },
});
