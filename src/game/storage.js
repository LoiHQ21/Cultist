import { validateSave, C } from "./rules.js";
export const keys = {
  run: "last-offering.run.v1",
  journal: "last-offering.journal.v1",
  settings: "last-offering.settings.v1",
};
export let storageAvailable = true;
export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}
export function loadRun() {
  let raw;
  try {
    raw = localStorage.getItem(keys.run);
  } catch {
    return { run: null, invalid: false };
  }
  if (raw === null) return { run: null, invalid: false };
  let s;
  try {
    s = JSON.parse(raw);
  } catch {
    return { run: null, invalid: true };
  }
  const valid = validateSave(s);
  return { run: valid ? s : null, invalid: !valid };
}
export function loadJournal() {
  const raw = read(keys.journal, {});
  const j = raw && typeof raw === "object" ? raw : {};
  return {
    remnants: Array.isArray(j.remnants)
      ? j.remnants.filter((x) => C.items[x]?.kind === "remnant")
      : [],
    outcomes: Array.isArray(j.outcomes)
      ? j.outcomes.filter((x) => x && typeof x.key === "string")
      : [],
    endings: Array.isArray(j.endings)
      ? j.endings.filter((x) => C.endings[x])
      : [],
  };
}
export function discover(j, s) {
  const n = structuredClone(j);
  for (const h of s.history) {
    if (!n.remnants.includes(h.reward.itemId)) n.remnants.push(h.reward.itemId);
    const key = `${h.pid}:${h.votive}:${h.aspectUsed}`;
    if (!n.outcomes.some((o) => o.key === key))
      n.outcomes.push({
        key,
        title: h.outcome.title,
        reward: h.reward.itemId,
        petition: h.pid,
        votive: h.votive,
        aspect: h.aspectUsed,
      });
  }
  if (s.endingId && !n.endings.includes(s.endingId)) n.endings.push(s.endingId);
  return n;
}
