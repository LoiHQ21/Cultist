import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  C,
  createRun,
  reducer,
  previewRitual,
  aspectFor,
  previewFinale,
  classifyEnding,
  validateSave,
  giftFor,
} from "../src/game/rules.js";
const W = JSON.parse(
  readFileSync(new URL("./witnesses.json", import.meta.url)),
);
const oracle = JSON.parse(
  readFileSync(new URL("./oracle.json", import.meta.url)),
);
const commit = (s, type, args = {}) => reducer(s, { type, ...args });
function prepare(pid = "granary", votive = "chain", item = "bell") {
  let s = createRun();
  s.day = C.petitions.find((p) => p.id === pid).day;
  s = commit(commit(s, "DAWN"), "ACCEPT", { id: pid });
  s = commit(s, "VOTIVE", { id: votive });
  if (item) {
    if (!s.inventory.some((i) => i.itemId === item))
      s.inventory.push({
        instanceId: "test-item",
        itemId: item,
        source: "gift",
        acquiredDay: 1,
      });
    s = commit(s, "CATALYST", {
      id: s.inventory.find((i) => i.itemId === item).instanceId,
    });
  }
  return s;
}
test("All 720 recipe/aspect/catalyst combinations match independent Python reference", () => {
  assert.equal(oracle.length, 720);
  for (const o of oracle) {
    let s = prepare(o.petition, o.votive, o.catalyst);
    Object.assign(s, o.before);
    const original = structuredClone(s);
    const p = previewRitual(s);
    const n = commit(s, "RITUAL");
    for (const k of ["trust", "defence", "mercy", "dominion", "aspect"]) {
      assert.equal(
        p[k],
        o.after[k],
        `${o.petition}/${o.votive}/${o.catalyst}/${o.before.aspect}/${k}`,
      );
      assert.equal(n[k], p[k]);
    }
    assert.deepEqual(s, original);
    assert.equal(n.inventory.length, s.inventory.length + (o.catalyst ? 0 : 1));
    assert.equal(n.history.length, 1);
    assert.equal(n.awakening, 1);
    assert.equal(n.history[0].aspectUsed, s.aspect);
    assert.deepEqual(commit(n, "RITUAL"), n);
  }
});
test("Canonical day 1 uses Listening before learning Possessive", () => {
  let s = prepare();
  let n = commit(s, "RITUAL");
  assert.deepEqual(
    [n.defence, n.trust, n.dominion, n.aspect, n.activeResult.reward.itemId],
    [3, 3, 2, "possessive", "guardian_tear"],
  );
});
test("Trust cap occurs before ignored cost; lower defence clamps once", () => {
  let s = prepare("granary", "seed", "ring");
  s.trust = 8;
  s.aspect = "merciful";
  const p = previewRitual(s);
  assert.equal(p.ritualTrust, 8);
  assert.equal(p.trust, 7);
  s.defence = 0;
  assert.equal(previewRitual(s).defence, 0);
});
test("Mirror repeats negative base, not aspect or ignored penalty", () => {
  let s = prepare("wall", "knife", "mirror");
  s.trust = 8;
  s.aspect = "possessive";
  let p = previewRitual(s);
  assert.equal(p.requested.trust, -5);
  assert.equal(p.trust, 2);
  assert.equal(p.lessons.dominion, 2);
});
test("Shadow protects combined ritual trust but not unanswered cost", () => {
  let s = prepare("wall", "knife", "loose_shadow");
  s.aspect = "possessive";
  assert.equal(previewRitual(s).requested.trust, 0);
  assert.equal(previewRitual(s).trust, s.trust - 1);
});
test("Tie preserves previous aspect; below threshold always Listening", () => {
  for (const a of Object.keys(C.aspects)) {
    assert.equal(aspectFor(2, 2, a), a);
    assert.equal(aspectFor(1, 1, a), "listening");
  }
  assert.equal(aspectFor(2, 1), "merciful");
});
test("Gift, consumption, reward and commits are idempotent and instance-specific", () => {
  let s = prepare("granary", "chain", "ring");
  assert.equal(s.inventory.filter((i) => i.itemId === "ring").length, 2);
  assert.equal(commit(s, "ACCEPT", { id: "granary" }), s);
  s = commit(s, "CATALYST", { id: "gift:granary" });
  const n = commit(s, "RITUAL");
  assert.ok(n.inventory.find((i) => i.instanceId === "start:0"));
  assert.ok(!n.inventory.find((i) => i.instanceId === "gift:granary"));
  assert.equal(n.inventory.filter((i) => i.source === "remnant").length, 1);
  assert.equal(commit(n, "RITUAL"), n);
  assert.equal(commit(n, "REST"), n);
});
test("Ending classification priority and all successful fates", () => {
  for (const [t, d, f, e] of [
    [0, 8, "sleep", "abandoned"],
    [0, 0, "remain", "abandoned"],
    [7, 5, "sleep", "overrun"],
    [3, 8, "wander", "fractured"],
    [4, 6, "sleep", "quiet"],
    [4, 6, "remain", "guarded"],
    [4, 6, "wander", "free"],
  ])
    assert.equal(
      classifyEnding({ trust: t, defence: d, finale: { fateId: f } }),
      e,
    );
});
function playWitness(
  w,
  {
    omitFinalCatalyst = false,
    expectedEnding = w.ending,
    expectedFinal = w.final,
  } = {},
) {
  let s = createRun(w.seed, w.opening, w.guided);
  for (const d of w.days) {
    s = commit(commit(s, "DAWN"), "ACCEPT", { id: d.petition });
    s = commit(s, "VOTIVE", { id: d.votive });
    if (d.catalyst) {
      const i = s.inventory.find((i) => i.itemId === d.catalyst);
      assert.ok(i, `Missing ${d.catalyst}`);
      s = commit(s, "CATALYST", { id: i.instanceId });
    }
    s = commit(s, "RITUAL");
    for (const [k, v] of Object.entries(d.after))
      assert.equal(s[k], v, `${w.ending} day ${d.day} ${k}`);
    assert.ok(validateSave(s));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    s = commit(s, "TAKE");
    if (s.phase === "keep_items") {
      let ids = s.inventory.map((i) => i.instanceId);
      for (const item of d.discarded) {
        const i = s.inventory.find(
          (i) => ids.includes(i.instanceId) && i.itemId === item,
        );
        assert.ok(i);
        ids = ids.filter((id) => id !== i.instanceId);
      }
      s = commit(s, "KEEP", { ids });
      assert.equal(s.phase, "aftermath");
    }
    s = commit(s, "REST");
  }
  assert.equal(s.awakening, 5);
  const m = s.mercy,
    d = s.dominion,
    a = s.aspect;
  let inventoryBefore = s.inventory.length;
  if (w.finale.catalyst && !omitFinalCatalyst) {
    const i = s.inventory.find((i) => i.itemId === w.finale.catalyst);
    assert.ok(i);
    s = commit(s, "CATALYST", { id: i.instanceId });
  }
  for (const choice of [
    w.finale.response,
    w.finale.interpretation,
    w.finale.fate,
  ]) {
    const action = { type: "FINALE", step: s.phase, id: choice },
      before = s;
    const p = previewFinale(s, choice);
    s = reducer(s, action);
    assert.equal(s.trust, p.trust);
    assert.equal(s.defence, p.defence);
    assert.equal(reducer(s, action), s);
    assert.ok(validateSave(s));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.equal(s.mercy, m);
    assert.equal(s.dominion, d);
    assert.equal(s.aspect, a);
    if (action.step !== "finale_response") {
      const c = p.choice;
      assert.equal(s.trust, Math.max(0, Math.min(8, before.trust + c.trust)));
    }
  }
  assert.equal(
    s.inventory.length,
    inventoryBefore - (w.finale.catalyst && !omitFinalCatalyst ? 1 : 0),
  );
  assert.equal(s.endingId, expectedEnding);
  for (const [k, v] of Object.entries(expectedFinal)) assert.equal(s[k], v);
  return s;
}
for (const [id, w] of Object.entries(W.witnesses))
  test(`Legal five-day route reaches ${id}`, () => playWitness(w));
for (const [id, w] of Object.entries(W.named_success_routes || {}))
  test(`Deliberate strategy ${id}`, () => playWitness(w));
test("Same seed/actions deterministic; gifts stable independent of inspection", () => {
  const a = createRun("MOSS-17", "gentle", false),
    b = createRun("MOSS-17", "gentle", false);
  assert.deepEqual(a, b);
  for (const p of C.petitions)
    assert.equal(giftFor("MOSS-17", p.id), a.giftsByPetition[p.id]);
  assert.notDeepEqual(
    a.giftsByPetition,
    createRun("OTHER", "gentle", false).giftsByPetition,
  );
  assert.equal(a.aspect, "listening");
  assert.deepEqual(
    createRun().giftsByPetition,
    Object.fromEntries(C.petitions.map((p) => [p.id, p.gift])),
  );
});
test("Overflow remains unresolved across save, invalid Keep cannot discard", () => {
  let s = prepare();
  s.inventory.push(
    ...["ring", "bell", "mirror"].map((itemId, i) => ({
      itemId,
      instanceId: `extra${i}`,
    })),
  );
  s = commit(commit(s, "RITUAL"), "TAKE");
  assert.equal(s.phase, "keep_items");
  assert.equal(commit(s, "KEEP", { ids: [] }), s);
  assert.equal(commit(s, "REST"), s);
  assert.equal(JSON.parse(JSON.stringify(s)).phase, "keep_items");
  s = commit(s, "KEEP", {
    ids: s.inventory.slice(0, 5).map((i) => i.instanceId),
  });
  assert.equal(s.phase, "aftermath");
  assert.equal(s.inventory.length, 5);
});
test("Invalid or incompatible saves rejected safely", () => {
  for (const s of [
    null,
    {},
    [],
    { ...createRun(), schemaVersion: 77 },
    { ...createRun(), contentVersion: "future" },
    { ...createRun(), inventory: null },
    { ...createRun(), phase: "ending" },
    { ...createRun(), trust: NaN },
  ])
    assert.equal(validateSave(s), false);
  assert.ok(validateSave(createRun()));
});
test("Finale response Mirror / Shadow obey exceptions without learning", () => {
  for (const cat of ["mirror", "loose_shadow"]) {
    let s = createRun();
    s.phase = "finale_response";
    s.finale.frozenAspect = "possessive";
    s.inventory = [{ itemId: cat, instanceId: "final" }];
    s.selectedCatalystInstanceId = "final";
    s.trust = 8;
    s.defence = 1;
    const p = previewFinale(s, "strike");
    assert.equal(p.trust, cat === "mirror" ? 5 : 8);
    assert.equal(p.defence, cat === "mirror" ? 6 : 5);
    const n = commit(s, "FINALE", { step: s.phase, id: "strike" });
    assert.equal(n.mercy, 0);
    assert.equal(n.dominion, 0);
    assert.equal(n.inventory.length, 0);
  }
});
test("Pure defensive and pure benevolent policies lose for different reasons", () => {
  function policy(votive) {
    let s = createRun();
    for (let day = 1; day <= 5; day++) {
      s = commit(commit(s, "DAWN"), "ACCEPT", {
        id: C.petitions.find((p) => p.day === day).id,
      });
      s = commit(s, "VOTIVE", { id: votive });
      s = commit(commit(s, "RITUAL"), "TAKE");
      if (s.phase === "keep_items")
        s = commit(s, "KEEP", {
          ids: s.inventory.slice(-5).map((i) => i.instanceId),
        });
      s = commit(s, "REST");
    }
    for (const id of votive === "knife"
      ? ["strike", "seal", "remain"]
      : ["shelter", "receive", "sleep"])
      s = commit(s, "FINALE", { step: s.phase, id });
    return s;
  }
  const defensive = policy("knife"),
    benevolent = policy("seed");
  assert.equal(defensive.endingId, "abandoned");
  assert.equal(defensive.defence, 8);
  assert.equal(benevolent.endingId, "overrun");
  assert.ok(benevolent.trust >= 4);
});
test("A legally earned remnant changes a recorded ending category", () => {
  const w = W.witnesses.free;
  assert.equal(playWitness(w).endingId, "free");
  assert.equal(
    playWitness(w, {
      omitFinalCatalyst: true,
      expectedEnding: "fractured",
      expectedFinal: { ...w.final, trust: 2 },
    }).endingId,
    "fractured",
  );
});
