const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.js",
  timeout: 30000,
  use: {
    channel: "chrome",
    baseURL: process.env.SITE_URL || "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  reporter: "list",
});
