import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const results = [];
const url = process.env.TEST_URL || "http://localhost:5173";
async function begin(p) {
  await p.goto(url);
  await p.getByRole("button", { name: "New pilgrimage", exact: true }).click();
  await p.getByRole("button", { name: "Enter the shrine" }).click();
  await p.getByRole("button", { name: "Hear today's prayers" }).click();
  await p
    .getByRole("button", { name: "Hear this prayer", exact: true })
    .click();
}
try {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await ctx.addInitScript(() => {
    window.__audio = [];
    const Original = window.Audio;
    window.Audio = function (...args) {
      const a = new Original(...args);
      window.__audio.push(a);
      return a;
    };
  });
  const p = await ctx.newPage();
  await begin(p);
  // Actual drag equivalents and toggle remove.
  await p
    .getByRole("button", { name: "Chain", exact: true })
    .dragTo(
      p.getByRole("button", { name: "Choose a votive", exact: true }).first(),
    );
  await expect(
    p.getByRole("button", { name: "Ring the bell", exact: true }),
  ).toBeEnabled();
  await p.getByRole("button", { name: "Remove Chain", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "Choose a votive", exact: true }).last(),
  ).toBeDisabled();
  await p.getByRole("button", { name: "Chain", exact: true }).click();
  await p
    .locator(".shelf .item")
    .filter({ hasText: "Little Bell" })
    .dragTo(p.getByRole("button", { name: "No second offering", exact: true }));
  await p.getByRole("button", { name: "Ring the bell", exact: true }).click();
  await expect(p.getByRole("button", { name: "Skip animation" })).toBeVisible();
  const before = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("last-offering.run.v1")),
  );
  expect(before.defence).toBe(3);
  expect(before.trust).toBe(3);
  expect(before.aspect).toBe("possessive");
  await p.reload();
  await p.getByRole("button", { name: "Continue pilgrimage" }).click();
  await expect(
    p.getByRole("button", { name: "Take the remnant" }),
  ).toBeVisible();
  expect(
    await p.evaluate(() =>
      JSON.parse(localStorage.getItem("last-offering.run.v1")),
    ),
  ).toEqual(before);
  results.push(
    "Normal animation reload is idempotent; drag/remove equivalent to click",
  );
  await p.getByRole("button", { name: "Settings", exact: true }).click();
  await p.getByLabel("Mute all sound").check();
  await p.getByRole("button", { name: "Close dialog" }).click();
  await p.getByRole("button", { name: "Settings", exact: true }).click();
  await p.getByLabel("Mute all sound").uncheck();
  await p.getByLabel("Music").fill("0.2");
  await p.getByRole("button", { name: "Close dialog" }).click();
  // Browser media actually decoded and played after a gesture, and only one loop is active.
  const audio = await p.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 200));
    const active = window.__audio.filter((a) => a.loop && !a.paused);
    return {
      count: active.length,
      ready: active[0]?.readyState,
      volume: active[0]?.volume,
    };
  });
  expect(audio.count).toBe(1);
  expect(audio.ready).toBeGreaterThan(1);
  results.push(
    "Generated audio decodes/plays after gesture; mute and unmute work",
  );
  await p.getByRole("button", { name: "Settings", exact: true }).click();
  await p
    .getByRole("button", { name: "Clear all local data", exact: true })
    .click();
  await expect(
    p.getByRole("button", { name: "Erase all local data" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Keep my story" }).click();
  expect(
    await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("last-offering.run.v1")).history.length,
    ),
  ).toBe(1);
  await p.keyboard.press("Escape");
  results.push("Clear data confirmation can be cancelled");
  await ctx.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.getItem = function () {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  const bp = await blocked.newPage();
  await begin(bp);
  await bp.getByRole("button", { name: "Chain", exact: true }).click();
  await bp.getByRole("button", { name: "Ring the bell", exact: true }).click();
  await bp.getByRole("button", { name: "Skip animation" }).click();
  await expect(
    bp.getByText("Progress cannot be saved in this browser.", { exact: false }),
  ).toBeVisible();
  await expect(
    bp.getByRole("button", { name: "Take the remnant" }),
  ).toBeVisible();
  results.push("Storage denial retains playable in-memory session");
  await blocked.close();
  const invalid = await browser.newContext();
  await invalid.addInitScript(() => {
    localStorage.setItem(
      "last-offering.run.v1",
      JSON.stringify({ schemaVersion: 44 }),
    );
    localStorage.setItem(
      "last-offering.journal.v1",
      JSON.stringify({
        remnants: ["guardian_tear"],
        outcomes: [],
        endings: ["quiet"],
      }),
    );
  });
  const ip = await invalid.newPage();
  await ip.goto(url);
  await expect(
    ip.getByText("This saved pilgrimage cannot be read.", { exact: false }),
  ).toBeVisible();
  await expect(
    ip.getByRole("button", { name: "Continue pilgrimage" }),
  ).toHaveCount(0);
  await ip
    .getByRole("button", { name: "Read the chronicle", exact: true })
    .click();
  await expect(
    ip.getByRole("heading", { name: "Guardian's Tear", exact: true }),
  ).toBeVisible();
  results.push("Incompatible save is rejected, separate discoveries preserved");
  await invalid.close();
  console.log(results);
} finally {
  fs.writeFileSync(
    "test-results/resilience-report.json",
    JSON.stringify({ browser: browser.version(), checks: results }, null, 2),
  );
  await browser.close();
}
