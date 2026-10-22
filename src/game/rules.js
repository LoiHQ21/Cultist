import content from "../../content/game.json" with { type: "json" };
export const C = content;
export const clamp = (n) => Math.max(0, Math.min(8, n));
export const petition = (id) => C.petitions.find((p) => p.id === id);
export function aspectFor(mercy, dominion, previous = "listening") {
  if (Math.max(mercy, dominion) < 2) return "listening";
  return mercy > dominion
    ? "merciful"
    : dominion > mercy
      ? "possessive"
      : previous;
}
// FNV-1a over UTF-8, followed by the first Mulberry32 sample. Versioned per petition.
export function giftFor(seed, id) {
  let h = 2166136261;
  for (const b of new TextEncoder().encode(`${seed}:${id}:gift:v1`))
    h = Math.imul(h ^ b, 16777619) >>> 0;
  let t = h + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return C.rules.replay_gift_pool[
    Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 3)
  ];
}
export function createRun(
  seed = "FIRST-EMBER",
  opening = "listening",
  guided = true,
) {
  const o = C.rules.openings[opening] || C.rules.openings.listening;
  return {
    schemaVersion: 1,
    contentVersion: C.content_version,
    runId: `${seed}:${opening}:${guided}`,
    seed,
    opening,
    guided,
    day: 1,
    phase: "dawn",
    trust: 4,
    defence: 1,
    mercy: o.mercy,
    dominion: o.dominion,
    aspect: "listening",
    awakening: 0,
    inventory: ["ring", "bell"].map((itemId, i) => ({
      instanceId: `start:${i}`,
      itemId,
      source: "starting",
      acquiredDay: 0,
    })),
    selectedPetitionId: null,
    selectedVotive: null,
    selectedCatalystInstanceId: null,
    giftsByPetition: Object.fromEntries(
      C.petitions.map((p) => [p.id, guided ? p.gift : giftFor(seed, p.id)]),
    ),
    acceptedPetitionIds: [],
    history: [],
    activeResult: null,
    remnantTaken: false,
    finale: {
      frozenAspect: null,
      records: [],
      responseId: null,
      catalystInstanceId: null,
      interpretationId: null,
      fateId: null,
    },
    endingId: null,
  };
}
const snapshot = (s) => ({
  trust: s.trust,
  defence: s.defence,
  mercy: s.mercy,
  dominion: s.dominion,
  aspect: s.aspect,
});
function calculate(s, base, item, aspect, ignored = false) {
  const cat = item ? C.items[item] : null,
    a = C.aspects[aspect];
  const contribution =
    item === "mirror"
      ? { trust: base.trust, defence: base.defence }
      : { trust: cat?.trust || 0, defence: cat?.defence || 0 };
  const total = {
    trust: base.trust + contribution.trust + a.trust,
    defence: base.defence + contribution.defence + a.defence,
  };
  if (item === "loose_shadow") total.trust = Math.max(0, total.trust);
  const ritualTrust = clamp(s.trust + total.trust),
    defence = clamp(s.defence + total.defence),
    trust = clamp(ritualTrust - (ignored ? 1 : 0));
  return {
    base: { trust: base.trust, defence: base.defence },
    catalystContribution: contribution,
    aspectContribution: { trust: a.trust, defence: a.defence },
    requested: total,
    ritualTrust,
    trust,
    defence,
    actual: { trust: ritualTrust - s.trust, defence: defence - s.defence },
    ignoredLoss: trust - ritualTrust,
  };
}
export function previewRitual(
  s,
  pid = s.selectedPetitionId,
  votive = s.selectedVotive,
  catalystId = s.selectedCatalystInstanceId,
) {
  const p = petition(pid),
    v = C.votives[votive];
  if (!p || !v) return null;
  const instance = s.inventory.find((i) => i.instanceId === catalystId),
    item = instance?.itemId || null,
    outcome = p.outcomes[votive];
  const calc = calculate(s, outcome, item, s.aspect, true),
    lessons = { ...v.lesson };
  for (const axis of ["mercy", "dominion"])
    lessons[axis] +=
      item === "mirror" ? v.lesson[axis] : C.items[item]?.lesson[axis] || 0;
  const mercy = s.mercy + lessons.mercy,
    dominion = s.dominion + lessons.dominion,
    nextAspect = aspectFor(mercy, dominion, s.aspect);
  return {
    ...calc,
    mercy,
    dominion,
    lessons,
    aspect: nextAspect,
    aspectUsed: s.aspect,
    votive,
    catalyst: item,
    catalystInstanceId: instance?.instanceId || null,
    outcome,
    pid,
    before: snapshot(s),
  };
}
export function finaleChoices(s) {
  return s.phase === "finale_response"
    ? C.finale.response
    : s.phase === "finale_interpretation"
      ? C.finale.interpretations[s.finale.frozenAspect].choices
      : C.finale.fates;
}
export function previewFinale(
  s,
  id,
  catalystId = s.selectedCatalystInstanceId,
) {
  const choice = finaleChoices(s).find((c) => c.id === id);
  if (!choice) return null;
  const instance =
    s.phase === "finale_response"
      ? s.inventory.find((i) => i.instanceId === catalystId)
      : null;
  const calc =
    s.phase === "finale_response"
      ? calculate(s, choice, instance?.itemId, s.finale.frozenAspect)
      : {
          trust: clamp(s.trust + choice.trust),
          defence: clamp(s.defence + choice.defence),
        };
  return {
    ...calc,
    choice,
    catalyst: instance?.itemId || null,
    catalystInstanceId: instance?.instanceId || null,
  };
}
export function classifyEnding(s) {
  if (s.trust === 0) return "abandoned";
  if (s.defence < 6) return "overrun";
  if (s.trust < 4) return "fractured";
  return { sleep: "quiet", remain: "guarded", wander: "free" }[s.finale.fateId];
}
export function reducer(s, a) {
  if (!s) return s;
  switch (a.type) {
    case "DAWN":
      return s.phase === "dawn" ? { ...s, phase: "petitions" } : s;
    case "ACCEPT": {
      const p = petition(a.id);
      if (s.phase !== "petitions" || p?.day !== s.day || s.selectedPetitionId)
        return s;
      return {
        ...s,
        phase: "prepare",
        selectedPetitionId: p.id,
        acceptedPetitionIds: [...s.acceptedPetitionIds, p.id],
        inventory: [
          ...s.inventory,
          {
            instanceId: `gift:${p.id}`,
            itemId: s.giftsByPetition[p.id],
            source: "gift",
            acquiredDay: s.day,
          },
        ],
      };
    }
    case "VOTIVE":
      return s.phase === "prepare" && (a.id === null || C.votives[a.id])
        ? { ...s, selectedVotive: s.selectedVotive === a.id ? null : a.id }
        : s;
    case "CATALYST":
      return ["prepare", "finale_response"].includes(s.phase) &&
        (a.id === null || s.inventory.some((i) => i.instanceId === a.id))
        ? {
            ...s,
            selectedCatalystInstanceId:
              s.selectedCatalystInstanceId === a.id ? null : a.id,
          }
        : s;
    case "RITUAL": {
      if (
        s.phase !== "prepare" ||
        !s.selectedVotive ||
        s.history.some((h) => h.day === s.day)
      )
        return s;
      const r = previewRitual(s);
      if (!r) return s;
      const ignored = C.petitions.find(
          (p) => p.day === s.day && p.id !== s.selectedPetitionId,
        ),
        id = `${s.runId}:day:${s.day}`;
      const reward = {
        instanceId: `remnant:${id}`,
        itemId: r.outcome.reward,
        source: "remnant",
        acquiredDay: s.day,
      };
      const record = {
        ...r,
        id,
        day: s.day,
        ignoredPetitionId: ignored.id,
        reward,
        contentVersion: C.content_version,
        after: {
          trust: r.trust,
          defence: r.defence,
          mercy: r.mercy,
          dominion: r.dominion,
          aspect: r.aspect,
        },
      };
      return {
        ...s,
        trust: r.trust,
        defence: r.defence,
        mercy: r.mercy,
        dominion: r.dominion,
        aspect: r.aspect,
        awakening: s.awakening + 1,
        phase: "aftermath",
        activeResult: record,
        remnantTaken: false,
        history: [...s.history, record],
        inventory: [
          ...s.inventory.filter((i) => i.instanceId !== r.catalystInstanceId),
          reward,
        ],
        selectedCatalystInstanceId: null,
      };
    }
    case "TAKE":
      return s.phase === "aftermath" && !s.remnantTaken
        ? {
            ...s,
            remnantTaken: true,
            phase: s.inventory.length > 5 ? "keep_items" : "aftermath",
          }
        : s;
    case "KEEP": {
      if (
        s.phase !== "keep_items" ||
        !Array.isArray(a.ids) ||
        new Set(a.ids).size !== a.ids.length ||
        a.ids.length !== 5 ||
        a.ids.some((id) => !s.inventory.some((i) => i.instanceId === id))
      )
        return s;
      return {
        ...s,
        inventory: s.inventory.filter((i) => a.ids.includes(i.instanceId)),
        phase: "aftermath",
        remnantTaken: true,
      };
    }
    case "REST": {
      if (s.phase !== "aftermath" || !s.remnantTaken || s.inventory.length > 5)
        return s;
      if (s.day === 5)
        return {
          ...s,
          phase: "finale_response",
          selectedCatalystInstanceId: null,
          finale: { ...s.finale, frozenAspect: s.aspect },
        };
      return {
        ...s,
        day: s.day + 1,
        phase: "dawn",
        selectedPetitionId: null,
        selectedVotive: null,
        selectedCatalystInstanceId: null,
        activeResult: null,
        remnantTaken: false,
      };
    }
    case "FINALE": {
      if (
        !s.phase.startsWith("finale_") ||
        a.step !== s.phase ||
        s.finale.records.some((r) => r.step === a.step)
      )
        return s;
      const p = previewFinale(s, a.id);
      if (!p) return s;
      const step = s.phase,
        field = {
          finale_response: "responseId",
          finale_interpretation: "interpretationId",
          finale_fate: "fateId",
        }[step];
      const n = {
        ...s,
        trust: p.trust,
        defence: p.defence,
        selectedCatalystInstanceId: null,
        inventory: s.inventory.filter(
          (i) => i.instanceId !== p.catalystInstanceId,
        ),
        phase: {
          finale_response: "finale_interpretation",
          finale_interpretation: "finale_fate",
          finale_fate: "ending",
        }[step],
        finale: {
          ...s.finale,
          [field]: a.id,
          ...(step === "finale_response"
            ? { catalystInstanceId: p.catalystInstanceId }
            : {}),
          records: [
            ...s.finale.records,
            {
              step,
              ...p,
              before: snapshot(s),
              after: { trust: p.trust, defence: p.defence },
            },
          ],
        },
      };
      if (n.phase === "ending") n.endingId = classifyEnding(n);
      return n;
    }
    default:
      return s;
  }
}
export function greeting(s, p) {
  const v = C.visitors[p.visitor],
    earlier = C.petitions.find((q) => q.visitor === p.visitor && q.day < p.day);
  return earlier
    ? s.acceptedPetitionIds.includes(earlier.id)
      ? v.callback_helped
      : v.callback_ignored
    : v.greeting;
}
function validateSaveShape(s) {
  const phases = [
    "dawn",
    "petitions",
    "prepare",
    "aftermath",
    "keep_items",
    "finale_response",
    "finale_interpretation",
    "finale_fate",
    "ending",
  ];
  if (
    !s ||
    s.schemaVersion !== 1 ||
    s.contentVersion !== C.content_version ||
    !phases.includes(s.phase) ||
    !C.aspects[s.aspect] ||
    !C.rules.openings[s.opening] ||
    typeof s.seed !== "string" ||
    typeof s.runId !== "string" ||
    typeof s.guided !== "boolean"
  )
    return false;
  if (
    !["trust", "defence"].every(
      (k) => Number.isInteger(s[k]) && s[k] >= 0 && s[k] <= 8,
    ) ||
    !["mercy", "dominion"].every((k) => Number.isInteger(s[k]) && s[k] >= 0) ||
    !Number.isInteger(s.day) ||
    s.day < 1 ||
    s.day > 5
  )
    return false;
  if (
    !Array.isArray(s.inventory) ||
    s.inventory.length > 8 ||
    !s.inventory.every(
      (i) => typeof i.instanceId === "string" && C.items[i.itemId],
    ) ||
    new Set(s.inventory.map((i) => i.instanceId)).size !== s.inventory.length
  )
    return false;
  if (
    !Array.isArray(s.history) ||
    s.history.length > 5 ||
    s.awakening !== s.history.length ||
    !Array.isArray(s.acceptedPetitionIds) ||
    !s.finale ||
    !Array.isArray(s.finale.records) ||
    !C.petitions.every((p) =>
      C.rules.replay_gift_pool.includes(s.giftsByPetition?.[p.id]),
    )
  )
    return false;
  if (
    !s.history.every(
      (h, i) =>
        h.day === i + 1 &&
        petition(h.pid) &&
        C.votives[h.votive] &&
        C.aspects[h.aspectUsed] &&
        JSON.stringify(h.outcome) ===
          JSON.stringify(petition(h.pid).outcomes[h.votive]) &&
        C.items[h.reward?.itemId] &&
        h.before &&
        h.after &&
        h.lessons &&
        h.actual &&
        typeof h.id === "string" &&
        petition(h.ignoredPetitionId) &&
        (!h.catalyst || C.items[h.catalyst]),
    )
  )
    return false;
  if (
    ["prepare", "aftermath", "keep_items"].includes(s.phase) &&
    petition(s.selectedPetitionId)?.day !== s.day
  )
    return false;
  if (
    ["aftermath", "keep_items"].includes(s.phase) &&
    (!s.activeResult ||
      JSON.stringify(s.activeResult) !== JSON.stringify(s.history.at(-1)))
  )
    return false;
  if (s.phase.startsWith("finale_") || s.phase === "ending") {
    if (s.awakening !== 5 || !C.aspects[s.finale.frozenAspect]) return false;
    const expected = {
      finale_response: 0,
      finale_interpretation: 1,
      finale_fate: 2,
      ending: 3,
    }[s.phase];
    if (s.finale.records.length !== expected) return false;
    if (
      !s.finale.records.every(
        (r, i) =>
          r.step ===
            ["finale_response", "finale_interpretation", "finale_fate"][i] &&
          r.choice &&
          typeof r.choice.label === "string" &&
          typeof r.choice.text === "string" &&
          r.before &&
          r.after,
      )
    )
      return false;
  }
  if (s.phase === "ending" && !C.endings[s.endingId]) return false;
  return true;
}

export function validateSave(s) {
  try {
    return !!validateSaveShape(s);
  } catch {
    return false;
  }
}
