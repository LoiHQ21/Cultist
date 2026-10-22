import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("ERROR", e.message));
await page.goto("http://localhost:5173");
await page.screenshot({ path: "test-results/proof-title.png" });
await page.getByRole("button", { name: "New pilgrimage", exact: true }).click();
await page.getByRole("button", { name: "Enter the shrine" }).click();
await page.getByRole("button", { name: "Hear today's prayers" }).click();
await page
  .getByRole("button", { name: "Hear this prayer", exact: true })
  .click();
await page.getByRole("button", { name: "Chain", exact: true }).click();
await page.screenshot({
  path: "test-results/proof-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "test-results/proof-mobile.png",
  fullPage: true,
});
await browser.close();
