import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import { C } from "../src/game/rules.js";
const witnesses = JSON.parse(
  fs.readFileSync(new URL("./witnesses.json", import.meta.url)),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const root = process.env.TEST_URL || "http://localhost:5173";
const pending = process.env.ALLOW_PENDING_ART === "1";
fs.mkdirSync("test-results", { recursive: true });
const report = {
  browser: browser.version(),
  date: new Date().toISOString(),
  runs: [],
  errors: [],
  assetFailures: [],
  screenshots: [],
};
const aspects = new Set();
async function getRun(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("last-offering.run.v1")),
  );
}
async function shoot(page, id) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
  });
  await page.screenshot({ path: `test-results/${id}.png`, fullPage: true });
  report.screenshots.push(id);
}
async function activate(page, locator, keyboard = false) {
  if (!keyboard) {
    await locator.click();
    return;
  }
  for (let n = 0; n < 120; n++) {
    if (await locator.evaluate((el) => el === document.activeElement)) {
      await page.keyboard.press("Enter");
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("Keyboard could not reach " + (await locator.textContent()));
}
async function reloadStable(page) {
  const before = await getRun(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue pilgrimage" }).click();
  expect(await getRun(page)).toEqual(before);
}
async function route(
  id,
  w,
  { mobile = false, keyboard = false, screens = false } = {},
) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "reduce",
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [],
    failures = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  const click = (l) => activate(page, l, keyboard);
  await page.goto(root);
  await click(page.getByRole("button", { name: "Settings", exact: true }));
  await page.getByLabel("Mute all sound").check();
  await click(page.getByRole("button", { name: "Close dialog" }));
  if (screens) await shoot(page, mobile ? "title-mobile" : "title-desktop");
  await click(
    page.getByRole("button", { name: "New pilgrimage", exact: true }),
  );
  await click(page.getByRole("button", { name: "Enter the shrine" }));
  for (const day of w.days) {
    await click(page.getByRole("button", { name: "Hear today's prayers" }));
    const p = C.petitions.find((p) => p.id === day.petition);
    await click(
      page
        .locator(".visitor-tabs button")
        .filter({ hasText: C.visitors[p.visitor].name }),
    );
    if (screens && day.day === 1)
      await shoot(page, mobile ? "petition-mobile" : "petition-desktop");
    await click(
      page.getByRole("button", { name: "Hear this prayer", exact: true }),
    );
    let state = await getRun(page);
    expect(state.selectedPetitionId).toBe(day.petition);
    expect(
      state.inventory.filter((i) => i.instanceId === `gift:${day.petition}`)
        .length,
    ).toBe(1);
    if (day.day === 1 && !keyboard) await reloadStable(page);
    await click(
      page.getByRole("button", {
        name: C.votives[day.votive].name,
        exact: true,
      }),
    );
    if (day.catalyst)
      await click(
        page
          .locator(".shelf .item")
          .filter({ hasText: C.items[day.catalyst].name }),
      );
    await expect(
      page.getByRole("button", { name: "Ring the bell", exact: true }),
    ).toBeEnabled();
    if (screens && day.day === 1)
      await shoot(page, mobile ? "tray-mobile" : "tray-desktop");
    if (!aspects.has(state.aspect) && screens) {
      await shoot(page, `aspect-${state.aspect}`);
      aspects.add(state.aspect);
    }
    await click(
      page.getByRole("button", { name: "Ring the bell", exact: true }),
    );
    await expect(
      page.getByRole("button", { name: "Take the remnant", exact: true }),
    ).toBeVisible();
    state = await getRun(page);
    for (const [k, v] of Object.entries(day.after))
      expect(state[k], `${id}: day ${day.day} ${k}`).toBe(v);
    if (screens && day.day === 1)
      await shoot(page, mobile ? "remnant-mobile" : "remnant-desktop");
    if (day.day === 1 && !keyboard) await reloadStable(page);
    await click(
      page.getByRole("button", { name: "Take the remnant", exact: true }),
    );
    state = await getRun(page);
    if (state.phase === "keep_items") {
      if (!keyboard) await reloadStable(page);
      let wanted = state.inventory.map((i) => i.instanceId);
      for (const item of day.discarded) {
        const i = state.inventory.find(
          (i) => wanted.includes(i.instanceId) && i.itemId === item,
        );
        expect(i).toBeTruthy();
        wanted = wanted.filter((id) => id !== i.instanceId);
      }
      for (let i = 0; i < state.inventory.length; i++) {
        const el = page.locator(".keep-grid>button").nth(i),
          selected = (await el.getAttribute("aria-pressed")) === "true";
        if (selected !== wanted.includes(state.inventory[i].instanceId))
          await click(el);
      }
      if (screens && day.day === 4)
        await shoot(page, mobile ? "overflow-mobile" : "overflow-desktop");
      await click(page.getByRole("button", { name: "Keep these five" }));
    }
    await click(
      page.getByRole("button", {
        name: day.day === 5 ? "Let it awaken" : "Rest until dawn",
      }),
    );
  }
  let s = await getRun(page);
  expect(s.awakening).toBe(5);
  if (screens)
    await shoot(page, `awakening-${s.aspect}${mobile ? "-mobile" : ""}`);
  if (w.finale.catalyst)
    await click(
      page
        .locator(".shelf .item")
        .filter({ hasText: C.items[w.finale.catalyst].name }),
    );
  for (const [step, choice] of [
    ["response", w.finale.response],
    ["interpretation", w.finale.interpretation],
    ["fate", w.finale.fate],
  ]) {
    const choices =
      step === "response"
        ? C.finale.response
        : step === "interpretation"
          ? C.finale.interpretations[s.aspect].choices
          : C.finale.fates;
    await click(
      page
        .locator(".final-choices button")
        .filter({ hasText: choices.find((c) => c.id === choice).label }),
    );
    if (!keyboard) await reloadStable(page);
  }
  s = await getRun(page);
  expect(s.endingId).toBe(w.ending);
  for (const [k, v] of Object.entries(w.final)) expect(s[k]).toBe(v);
  await shoot(page, `ending-${id}${mobile ? "-mobile" : ""}`);
  await click(
    page.getByRole("button", { name: "Read the chronicle", exact: true }),
  );
  await expect(page.locator(".history article")).toHaveCount(8);
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  report.runs.push({
    id,
    ending: s.endingId,
    viewport: mobile ? "390×844" : "1440×900",
    keyboard,
    trust: s.trust,
    defence: s.defence,
    rituals: s.awakening,
    reloads: !keyboard,
    passed: true,
  });
  report.errors.push(...errors);
  report.assetFailures.push(...failures);
  await context.close();
  console.log(
    "PASS browser",
    id,
    s.endingId,
    mobile ? "mobile" : "desktop",
    keyboard ? "keyboard" : "pointer",
  );
}
try {
  await route(
    "balanced_guardians",
    witnesses.named_success_routes.balanced_guardians,
    { screens: true },
  );
  await route(
    "merciful_boundaries",
    witnesses.named_success_routes.merciful_boundaries,
    { mobile: true, screens: true },
  );
  await route("overrun", witnesses.witnesses.overrun, { screens: true });
  await route("keyboard", witnesses.named_success_routes.balanced_guardians, {
    keyboard: true,
  });
  for (const id of ["abandoned", "fractured", "guarded", "free"])
    await route(id, witnesses.witnesses[id]);
  // Active run replacement confirmation, cancellation, retained knowledge and independent settings.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  await p.goto(root);
  await p.getByRole("button", { name: "New pilgrimage", exact: true }).click();
  await p.getByRole("button", { name: "Enter the shrine" }).click();
  await p.getByRole("button", { name: "Hear today's prayers" }).click();
  await p
    .getByRole("button", { name: "Hear this prayer", exact: true })
    .click();
  await p.getByRole("button", { name: "Chain", exact: true }).click();
  await p.getByRole("button", { name: "Ring the bell", exact: true }).click();
  await p
    .getByRole("button", { name: "Take the remnant", exact: true })
    .waitFor();
  const before = await getRun(p);
  await p.getByRole("button", { name: /The Last Offering/ }).click();
  await p.getByRole("button", { name: "New pilgrimage", exact: true }).click();
  await p.getByRole("button", { name: "Keep playing" }).click();
  expect(await getRun(p)).toEqual(before);
  await p.getByRole("button", { name: "New pilgrimage", exact: true }).click();
  await p.getByLabel("Pilgrimage seed").fill("SILVER-ROOT");
  await p.getByLabel("Starting instinct").selectOption("watchful");
  await p.getByRole("button", { name: "Begin a different story" }).click();
  await p.getByRole("button", { name: "Replace and begin" }).click();
  const fresh = await getRun(p);
  expect(fresh.seed).toBe("SILVER-ROOT");
  expect(fresh.dominion).toBe(1);
  expect(fresh.history).toHaveLength(0);
  expect(
    await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("last-offering.journal.v1")).remnants
          .length,
    ),
  ).toBeGreaterThan(0);
  await p.getByRole("button", { name: "Settings", exact: true }).click();
  await p.getByLabel("Mute all sound").check();
  await p.getByRole("button", { name: "Close dialog" }).click();
  await p.reload();
  expect(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem("last-offering.settings.v1")).mute,
    ),
  ).toBe(true);
  await p.getByRole("button", { name: "Settings", exact: true }).click();
  await p.getByLabel("Mute all sound").uncheck();
  await p.getByRole("button", { name: "Close dialog" }).click();
  report.settingsAndReplay = true;
  await context.close();
  expect(report.errors).toEqual([]);
  if (!pending) expect(report.assetFailures).toEqual([]);
} catch (e) {
  report.failure = e.stack;
  throw e;
} finally {
  fs.writeFileSync(
    "test-results/browser-report.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
