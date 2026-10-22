import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  C,
  createRun,
  reducer,
  previewRitual,
  previewFinale,
  finaleChoices,
  petition,
  greeting,
} from "./game/rules.js";
import {
  keys,
  read,
  write,
  loadRun,
  loadJournal,
  discover,
} from "./game/storage.js";
import { sound } from "./audio/manager.js";
import manifest from "../public/assets/manifest.json";
import "./style.css";
const art = Object.fromEntries(
  manifest.assets.filter((a) => a.kind === "image").map((a) => [a.id, a]),
);
const paths = Object.fromEntries(Object.values(art).map((i) => [i.id, i.path]));
const asset = (id) => paths[id];
const names = { ...C.votives, ...C.items };
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
function Art({ id, className = "", ...props }) {
  return (
    <img
      src={asset(id)}
      width={art[id]?.width}
      height={art[id]?.height}
      alt=""
      className={className}
      draggable="false"
      {...props}
    />
  );
}
function Button({ children, primary = false, ...p }) {
  return (
    <button className={primary ? "primary" : ""} {...p}>
      {children}
    </button>
  );
}
function Item({
  id,
  selected = false,
  count = 1,
  onClick,
  disabled = false,
  dragId = null,
  onInspect = () => {},
}) {
  return (
    <button
      className={`item ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      title={`${names[id].name}: ${names[id].description}`}
      onFocus={() => onInspect(names[id].meaning || names[id].flavor)}
      onMouseEnter={() => onInspect(names[id].meaning || names[id].flavor)}
      onMouseLeave={() => onInspect("")}
      onBlur={() => onInspect("")}
      draggable={!!dragId}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", dragId)}
    >
      <Art id={id} />
      <span>{names[id].name}</span>
      {count > 1 && <b className="count">{count}</b>}
    </button>
  );
}
function App() {
  const loaded = useRef(loadRun()).current;
  const [run, setRun] = useState(loaded.run),
    [screen, setScreen] = useState("title"),
    [journal, setJournal] = useState(loadJournal),
    [settings, setSettings] = useState(() => ({
      ...{
        music: 0.3,
        sfx: 0.6,
        mute: false,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      },
      ...read(keys.settings, {}),
    }));
  const [modal, setModal] = useState(null),
    [tab, setTab] = useState("run"),
    [inspect, setInspect] = useState("granary"),
    [keep, setKeep] = useState([]),
    [anim, setAnim] = useState(false),
    [caption, setCaption] = useState(""),
    [notice, setNotice] = useState(
      loaded.invalid
        ? "This saved pilgrimage cannot be read. Your discoveries are still safe. Begin a new pilgrimage."
        : "",
    ),
    [seed, setSeed] = useState(""),
    [opening, setOpening] = useState("listening"),
    [hints, setHints] = useState(true),
    [confirm, setConfirm] = useState(null);
  const worldRef = useRef(null),
    statueRef = useRef(null);
  const liveRun = useRef(run),
    modalRef = useRef(null),
    returnFocus = useRef(null),
    phaseRef = useRef(null),
    animationTimer = useRef(null),
    soundTimers = useRef([]);
  const persist = (n) => {
    liveRun.current = n;
    setRun(n);
    if (!write(keys.run, n))
      setNotice(
        "Progress cannot be saved in this browser. You can still finish this session.",
      );
    const j = discover(journal, n);
    setJournal(j);
    write(keys.journal, j);
  };
  const act = (a) => {
    sound.unlock();
    const prev = liveRun.current,
      n = reducer(prev, a);
    if (n === prev) return;
    persist(n);
    sound.play(
      a.type === "VOTIVE" || a.type === "CATALYST"
        ? "ui_pick"
        : a.type === "REST"
          ? "day_turn"
          : a.type === "TAKE"
            ? "remnant_reveal"
            : a.type === "ACCEPT"
              ? "page_turn"
              : "ui_place",
    );
    if (a.type === "REST")
      setInspect(C.petitions.find((p) => p.day === n.day)?.id);
    if (n.phase === "keep_items")
      setKeep(n.inventory.slice(0, 5).map((i) => i.instanceId));
  };
  function openModal(m) {
    returnFocus.current = document.activeElement;
    setModal(m);
    sound.unlock();
    sound.play("page_turn");
  }
  function closeModal() {
    setModal(null);
    setConfirm(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }
  useEffect(() => {
    if (screen !== "play" || !run) return;
    const ids = [
      ...Object.keys(C.votives),
      ...Object.keys(C.items),
      ...Object.keys(C.aspects).map((a) => "statue_" + a),
      ...["guardian", "grain", "shadow", "names"].map((a) => "trace_" + a),
    ];
    for (const p of C.petitions.filter(
      (p) => p.day === run.day || p.day === run.day + 1,
    ))
      ids.push(`${p.visitor}_worried`, `${p.visitor}_relieved`);
    if (run.day >= 4)
      ids.push(...Object.keys(C.aspects).map((a) => "awakening_" + a));
    if (run.phase.startsWith("finale_"))
      ids.push("ending_quiet", "ending_guarded", "ending_desolate");
    const task = setTimeout(
      () =>
        ids.forEach((id) => {
          const image = new Image();
          image.src = asset(id);
        }),
      250,
    );
    return () => clearTimeout(task);
  }, [screen, run?.day, run?.phase]);
  useEffect(() => {
    sound.configure(settings);
    write(keys.settings, settings);
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduced"
      : "full";
  }, [settings]);
  useEffect(() => {
    sound.setScene(screen === "play" ? run?.phase : "title", run?.endingId);
  }, [screen, run?.phase]);
  useEffect(() => {
    if (run?.phase === "keep_items")
      setKeep(run.inventory.slice(0, 5).map((i) => i.instanceId));
  }, [run?.phase]);
  useEffect(() => {
    if (modal) {
      modalRef.current?.querySelector("button,input,select")?.focus();
    }
  }, [modal]);
  useEffect(() => {
    if (screen === "play" && !modal && !anim)
      phaseRef.current?.focus({ preventScroll: true });
  }, [run?.phase, run?.day, screen, anim]);
  useEffect(
    () => () => {
      clearTimeout(animationTimer.current);
      soundTimers.current.forEach(clearTimeout);
    },
    [],
  );
  useLayoutEffect(() => {
    if (!anim || !worldRef.current || !statueRef.current) return;
    const world = worldRef.current,
      statue = statueRef.current;
    const measure = () => {
      const frame = statue.getBoundingClientRect(),
        scene = world.querySelector(".scene-art").getBoundingClientRect();
      const meta = art[`statue_${run.activeResult.aspectUsed}`],
        mouth = meta.anchors.mouth;
      const scale = Math.min(
          frame.width / meta.width,
          frame.height / meta.height,
        ),
        width = meta.width * scale,
        height = meta.height * scale;
      const x =
        frame.left -
        scene.left +
        (frame.width - width) / 2 +
        mouth.x * width -
        40;
      const y =
        frame.top - scene.top + frame.height - height + mouth.y * height - 40;
      world.style.setProperty("--flight-x", `${x}px`);
      world.style.setProperty("--flight-y", `${y}px`);
      world.style.setProperty("--flight-start-y", `${scene.height * 0.84}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [anim, run?.activeResult]);
  function modalKeys(e) {
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key === "Tab") {
      const els = [
        ...modalRef.current.querySelectorAll(
          'button:not(:disabled),input,select,[tabindex="0"]',
        ),
      ];
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }
  function begin() {
    sound.unlock();
    const first = journal.outcomes.length === 0 && !run;
    const s = createRun(
      first
        ? "FIRST-EMBER"
        : seed.trim() ||
            "MOSS-" + Date.now().toString(36).slice(-5).toUpperCase(),
      first ? "listening" : opening,
      first ? true : hints && seed.trim() === "FIRST-EMBER",
    );
    s.hints = first || hints;
    persist(s);
    setScreen("play");
    setInspect("granary");
    closeModal();
  }
  function ritual() {
    if (anim) return;
    const before = liveRun.current,
      next = reducer(before, { type: "RITUAL" });
    if (next === before) return;
    persist(next);
    setCaption("");
    setAnim(true);
    sound.play("ritual_bell");
    if (!settings.reducedMotion)
      soundTimers.current = [
        setTimeout(() => sound.play("offering_take"), 450),
        setTimeout(() => sound.play("stone_breath"), 850),
      ];
    animationTimer.current = setTimeout(
      () => {
        setAnim(false);
        sound.play(
          next.activeResult.actual.trust < 0
            ? "miracle_dominion"
            : "miracle_mercy",
        );
      },
      settings.reducedMotion ? 180 : 2300,
    );
  }
  const s = run,
    p = s
      ? petition(s.selectedPetitionId) ||
        C.petitions.find((p) => p.id === inspect && p.day === s.day) ||
        C.petitions.find((p) => p.day === s.day)
      : null;
  const preview = s?.phase === "prepare" ? previewRitual(s) : null,
    r = s?.activeResult;
  const isFinal = s?.phase.startsWith("finale_"),
    isEnd = s?.phase === "ending";
  const bg =
    screen === "play" && isEnd
      ? C.endings[s.endingId].art
      : screen === "play" && isFinal
        ? `awakening_${s.finale.frozenAspect}`
        : "bg_shrine";
  const waiting = s
    ? C.petitions.find((q) => q.day === s.day && q.id !== p?.id)
    : null;
  const visitor = p?.visitor || "mara",
    expression =
      s?.phase === "aftermath" && r?.actual.trust > 0 ? "relieved" : "worried";

  function Shelf({ finale = false }) {
    const groups = Object.groupBy(s.inventory, (i) => i.itemId);
    const sel = s.inventory.find(
      (i) => i.instanceId === s.selectedCatalystInstanceId,
    );
    return (
      <section className="shelf">
        <div className="shelf-heading">
          <span className="eyebrow">
            {finale ? "One last offering" : "The keepsake shelf"}
          </span>
          <span>
            {s.inventory.length} / 5{" "}
            <small>
              {s.inventory.length > 5
                ? "· choose what to keep after the ritual"
                : "between days"}
            </small>
          </span>
        </div>
        <div className="items scroll-shelf">
          {Object.entries(groups).map(([id, list]) => (
            <Item
              onInspect={setCaption}
              key={id}
              id={id}
              count={list.length}
              selected={sel?.itemId === id}
              onClick={() =>
                act({
                  type: "CATALYST",
                  id: sel?.itemId === id ? null : list[0].instanceId,
                })
              }
              dragId={`c:${list[0].instanceId}`}
            />
          ))}
        </div>
        <p className="item-detail">
          {sel
            ? `${names[sel.itemId].name} — ${names[sel.itemId].description}`
            : "A second offering is optional. Keepsakes are consumed; daily votives return."}
        </p>
      </section>
    );
  }
  function Stats({ before = s, after }) {
    return (
      <div className="forecast">
        <span>
          Trust{" "}
          <strong>
            {before.trust}
            {after && <> → {after.trust}</>}
          </strong>
        </span>
        <span>
          Defence{" "}
          <strong>
            {before.defence}
            {after && <> → {after.defence}</>}
          </strong>
        </span>
      </div>
    );
  }
  function History() {
    return (
      <div className="history">
        {!s?.history.length && <p>The first page is still empty.</p>}
        {s?.history.map((h) => (
          <article key={h.id}>
            <span className="eyebrow">
              Day {h.day} · {petition(h.pid).title}
            </span>
            <h3>{h.outcome.title}</h3>
            <p>
              {h.outcome.event} {h.outcome.interpretations[h.aspectUsed]}
            </p>
            <p className="causal">
              {C.votives[h.votive].name}
              {h.catalyst ? ` + ${C.items[h.catalyst].name}` : ""} →{" "}
              {C.items[h.reward.itemId].name}
            </p>
            <p>
              Trust {h.before.trust} → {h.trust} · Defence {h.before.defence} →{" "}
              {h.defence}. {C.aspects[h.aspectUsed].label} answered;{" "}
              {C.aspects[h.aspect].label} followed.
            </p>
          </article>
        ))}
        {s?.finale.records.map((h) => (
          <article key={h.step}>
            <h3>{h.choice.label}</h3>
            <p>{h.choice.text}</p>
            <p>
              Trust {h.before.trust} → {h.after.trust} · Defence{" "}
              {h.before.defence} → {h.after.defence}
            </p>
          </article>
        ))}
      </div>
    );
  }
  return (
    <div
      className={`game ${screen === "title" ? "at-title" : ""} ${isFinal && screen === "play" ? "at-finale" : ""} ${isEnd && screen === "play" ? "at-ending" : ""}`}
    >
      <header className="topbar" inert={modal ? true : undefined}>
        <button
          className="wordmark"
          onClick={() => {
            setScreen("title");
            sound.unlock();
          }}
        >
          The Last Offering<span>A woodland chronicle</span>
        </button>
        {screen === "play" && s ? (
          <>
            <div className="daymark">
              <span className="eyebrow">
                {isFinal || isEnd
                  ? "The sixth dawn"
                  : `Day ${["", "I", "II", "III", "IV", "V"][s.day]} of V`}
              </span>
              <span>
                {isFinal || isEnd
                  ? "The army is here"
                  : `${6 - s.day} dawn${s.day === 5 ? "" : "s"} until the army`}
              </span>
              <span
                className="awakening"
                aria-label={`Awakening ${s.awakening} of 5`}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <i className={i <= s.awakening ? "lit" : ""} key={i} />
                ))}
              </span>
            </div>
            <div className="hudstats">
              <div>
                Trust{" "}
                <strong>
                  {s.trust}
                  <small>/8</small>
                </strong>
                <span>Keep 4 for community</span>
              </div>
              <div>
                Defence{" "}
                <strong>
                  {s.defence}
                  <small>/8</small>
                </strong>
                <span>Reach 6 to stop the army</span>
              </div>
            </div>
          </>
        ) : (
          <span className="tagline-top">
            A small god. An impossible kindness.
          </span>
        )}
        <nav aria-label="Game menu">
          <Button
            onClick={() => {
              setTab("run");
              openModal("journal");
            }}
          >
            Chronicle
          </Button>
          <Button onClick={() => openModal("settings")}>Settings</Button>
        </nav>
      </header>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <main inert={modal ? true : undefined}>
        <div
          ref={worldRef}
          className={`world ${anim ? "feeding" : ""}`}
          style={{ "--scene": `url(${asset(bg)})` }}
        >
          <div className="scene-art" aria-hidden="true">
            {!((isFinal || isEnd) && screen === "play") && (
              <>
                <div className="statue-shadow" />
                {screen === "play" &&
                  !anim &&
                  s.phase === "aftermath" &&
                  r?.aspect !== r?.aspectUsed && (
                    <Art
                      id={`statue_${r.aspectUsed}`}
                      className="statue statue-previous"
                    />
                  )}
                <Art
                  ref={statueRef}
                  id={`statue_${s && screen === "play" ? (anim && r ? r.aspectUsed : s.aspect) : "listening"}`}
                  className="statue"
                  key={anim && r ? r.aspectUsed : s?.aspect || "listening"}
                />
                {screen === "play" && (
                  <Art id={`${visitor}_${expression}`} className="visitor" />
                )}
                {screen === "play" && waiting && (
                  <Art
                    id={`${waiting.visitor}_worried`}
                    className="waiting-visitor"
                  />
                )}
                <Art id="fg_altar" className="altar" />
                <Art id="prop_bell" className="hanging-bell" />
                <Art id="prop_candles" className="candles" />
                {screen === "play" &&
                  s?.history
                    .slice(-2)
                    .map((h, i) => (
                      <Art
                        key={h.id}
                        id={`trace_${h.outcome.scene}`}
                        className={`trace trace-${i}`}
                      />
                    ))}
                <div className="candle-glow" />
                {anim && r && (
                  <>
                    <Art id={r.votive} className="flight" />
                    {r.catalyst && (
                      <Art id={r.catalyst} className="flight second-flight" />
                    )}
                  </>
                )}
              </>
            )}
            <div className="motes">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <i key={i} style={{ "--i": i }} />
              ))}
            </div>
          </div>
          {screen === "title" ? (
            <section className="title-copy">
              <span className="eyebrow">An illustrated ritual tale</span>
              <h1>
                The Last
                <br />
                <em>Offering</em>
              </h1>
              <div className="ornament">✦ ───── ✦</div>
              <p>
                Five days. One village.
                <br />A god that learns what you feed it.
              </p>
              <div className="title-actions">
                {s && (
                  <Button
                    primary
                    onClick={() => {
                      sound.unlock();
                      setScreen("play");
                    }}
                  >
                    Continue pilgrimage
                  </Button>
                )}
                <Button
                  primary={!s}
                  onClick={() => {
                    setSeed(
                      "MOSS-" + Date.now().toString(36).slice(-5).toUpperCase(),
                    );
                    openModal("new");
                  }}
                >
                  New pilgrimage
                </Button>
                <Button
                  onClick={() => {
                    setTab("offerings");
                    openModal("journal");
                  }}
                >
                  Read the chronicle
                </Button>
              </div>
              <span className="title-foot">
                A quiet story of care & consequence
                <br />
                15–25 minutes · Your progress stays in this browser
              </span>
            </section>
          ) : (
            <>
              {!isFinal && !isEnd && (
                <div className="aspect-chip">
                  <Button onClick={() => openModal("god")}>
                    {C.aspects[s.aspect].label} <span>· Inspect the god</span>
                  </Button>
                  {caption && <span className="statue-caption">{caption}</span>}
                </div>
              )}
              {!isFinal &&
                !isEnd &&
                s.history.length > 0 &&
                s.phase !== "aftermath" && (
                  <button
                    className="echo"
                    onClick={() => {
                      setTab("run");
                      openModal("journal");
                    }}
                    title="Read the miracle behind this trace"
                  >
                    {s.history.at(-1).outcome.echo}{" "}
                    <span>· Read its story</span>
                  </button>
                )}
              <section
                className={`story-panel ${isFinal ? "final-panel" : ""} ${isEnd ? "ending-panel" : ""}`}
                aria-label="Current story"
              >
                <div
                  ref={phaseRef}
                  tabIndex={-1}
                  className="phase-heading"
                  aria-live="polite"
                >
                  <span className="eyebrow">
                    {s.phase === "dawn"
                      ? "The shrine opens"
                      : s.phase === "petitions"
                        ? "Two prayers. One answer."
                        : s.phase === "prepare"
                          ? "The prayer you heard"
                          : s.phase === "aftermath"
                            ? "What the god understood"
                            : s.phase === "keep_items"
                              ? "Some things must be left behind"
                              : isEnd
                                ? "The end of this pilgrimage"
                                : `The awakening · ${s.finale.records.length + 1} of 3`}
                  </span>
                </div>
                {(s.hints ?? s.guided) &&
                  C.tutorial.find((t) => t.phase === s.phase) && (
                    <p className="tutorial">
                      {C.tutorial.find((t) => t.phase === s.phase).text}
                    </p>
                  )}
                {s.phase === "dawn" && (
                  <>
                    <h2>
                      {s.day === 1
                        ? "Something is listening."
                        : "Another dawn. Another prayer."}
                    </h2>
                    <p>
                      {s.day === 1
                        ? "An army is five days away. In the old woodland shrine, a little stone god waits to learn what protection means."
                        : s.history.at(-1).outcome.echo}
                    </p>
                    <p>
                      Offer it a way to help. Teach it Mercy or Dominion. Live
                      with what it learns.
                    </p>
                    <div className="thresholds">
                      By the sixth dawn
                      <br />
                      <strong>6 Defence</strong> to stop the army ·{" "}
                      <strong>4 Trust</strong> to keep the village whole.
                    </div>
                    <Button primary onClick={() => act({ type: "DAWN" })}>
                      Hear today's prayers
                    </Button>
                  </>
                )}
                {s.phase === "petitions" && (
                  <>
                    <h2>Who needs a miracle?</h2>
                    <div className="visitor-tabs">
                      {C.petitions
                        .filter((q) => q.day === s.day)
                        .map((q) => (
                          <button
                            key={q.id}
                            aria-pressed={p.id === q.id}
                            onClick={() => {
                              setInspect(q.id);
                              sound.play("page_turn");
                            }}
                          >
                            <span className="portrait">
                              <Art id={`${q.visitor}_worried`} />
                            </span>
                            <span>
                              {C.visitors[q.visitor].name}
                              <small>{C.visitors[q.visitor].role}</small>
                            </span>
                          </button>
                        ))}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <blockquote>“{p.request}”</blockquote>
                    <p className="greeting">{greeting(s, p)}</p>
                    <div className="gift-line">
                      A gift:{" "}
                      <strong>{C.items[s.giftsByPetition[p.id]].name}</strong>
                    </div>
                    <p className="small">
                      The other prayer goes unanswered: −1 Trust after this
                      ritual.
                    </p>
                    <Button
                      primary
                      onClick={() => act({ type: "ACCEPT", id: p.id })}
                    >
                      Hear this prayer
                    </Button>
                  </>
                )}
                {s.phase === "prepare" && (
                  <>
                    <div className="visitor-label">
                      {C.visitors[p.visitor].name} ·{" "}
                      {C.visitors[p.visitor].role}
                    </div>
                    <h2>{p.title}</h2>
                    <blockquote>“{p.request}”</blockquote>
                    {preview ? (
                      <div className="omen">
                        <span className="eyebrow">The omen</span>
                        <p>{preview.outcome.omen}</p>
                        <Stats after={preview} />
                        <details>
                          <summary>How this answer is made</summary>
                          <p>
                            Base: {signed(preview.base.trust)} Trust,{" "}
                            {signed(preview.base.defence)} Defence.
                            <br />
                            Offering:{" "}
                            {signed(
                              preview.catalystContribution.trust,
                            )} Trust,{" "}
                            {signed(preview.catalystContribution.defence)}{" "}
                            Defence.
                            <br />
                            {C.aspects[s.aspect].label}:{" "}
                            {signed(preview.aspectContribution.trust)} Trust,{" "}
                            {signed(preview.aspectContribution.defence)}{" "}
                            Defence.
                          </p>
                          {preview.catalyst === "loose_shadow" && (
                            <p>
                              Shadow prevents the combined ritual Trust loss.
                            </p>
                          )}
                          <p>
                            Trust after the miracle: {preview.ritualTrust}. The
                            other prayer then costs 1 Trust.
                          </p>
                        </details>
                        <p className="lesson">
                          Learns{" "}
                          {preview.lessons.mercy > 0 &&
                            `${preview.lessons.mercy} Mercy`}
                          {preview.lessons.mercy > 0 &&
                          preview.lessons.dominion > 0
                            ? " + "
                            : ""}
                          {preview.lessons.dominion > 0 &&
                            `${preview.lessons.dominion} Dominion`}
                          .<br />
                          Answers as{" "}
                          <strong>{C.aspects[s.aspect].label}</strong>; next{" "}
                          <strong>{C.aspects[preview.aspect].label}</strong>.
                        </p>
                        <p className="reward-preview">
                          Leaves behind:{" "}
                          {journal.remnants.includes(preview.outcome.reward) ? (
                            C.items[preview.outcome.reward].name
                          ) : (
                            <>
                              <Art
                                id={preview.outcome.reward}
                                className="silhouette"
                              />{" "}
                              an undiscovered remnant
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="empty-omen">
                        Choose a daily votive below.
                        <br />A chain binds. A seed grows. A knife separates.
                      </p>
                    )}
                    <p className="small">
                      {
                        C.visitors[
                          C.petitions.find(
                            (q) => q.day === s.day && q.id !== p.id,
                          ).visitor
                        ].name
                      }
                      's prayer waits unanswered: −1 Trust.
                    </p>
                  </>
                )}
                {s.phase === "aftermath" && (
                  <>
                    {anim ? (
                      <>
                        <h2>The stone draws breath.</h2>
                        <p>
                          Your offering has been committed. The god is
                          answering.
                        </p>
                        <Button
                          onClick={() => {
                            clearTimeout(animationTimer.current);
                            soundTimers.current.forEach(clearTimeout);
                            setAnim(false);
                            sound.play("stone_breath");
                          }}
                        >
                          Skip animation
                        </Button>
                      </>
                    ) : (
                      <>
                        <h2>{r.outcome.title}</h2>
                        <p>{r.outcome.event}</p>
                        <p>{r.outcome.interpretations[r.aspectUsed]}</p>
                        {r.catalyst && (
                          <p className="greeting">
                            {C.items[r.catalyst].ritual_line}
                          </p>
                        )}
                        <p className="causal">
                          {C.votives[r.votive].name}
                          {r.catalyst
                            ? ` + ${C.items[r.catalyst].name}`
                            : ""} → {C.items[r.reward.itemId].name}
                        </p>
                        <Stats before={r.before} after={r} />
                        <p className="small">
                          Miracle: {signed(r.actual.trust)} Trust,{" "}
                          {signed(r.actual.defence)} Defence (after bounds).
                          Unanswered: {signed(r.ignoredLoss)} Trust.
                        </p>
                        <p className="lesson">
                          Mercy {r.before.mercy} → {r.mercy} · Dominion{" "}
                          {r.before.dominion} → {r.dominion}
                          <br />
                          {r.aspect !== r.aspectUsed
                            ? C.aspects[r.aspect].arrival
                            : "The lesson stays with it."}{" "}
                          {C.aspects[r.aspect].description}
                        </p>
                        <p className="ignored">
                          {petition(r.ignoredPetitionId).ignored}
                        </p>
                        <div className="remnant">
                          <Art id={r.reward.itemId} />
                          <span>
                            <strong>{C.items[r.reward.itemId].name}</strong>
                            <small>
                              {C.items[r.reward.itemId].description}
                            </small>
                          </span>
                        </div>
                        {!s.remnantTaken ? (
                          <Button primary onClick={() => act({ type: "TAKE" })}>
                            Take the remnant
                          </Button>
                        ) : (
                          <Button primary onClick={() => act({ type: "REST" })}>
                            {s.day === 5 ? "Let it awaken" : "Rest until dawn"}
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
                {s.phase === "keep_items" && (
                  <>
                    <h2>What will you keep?</h2>
                    <p>
                      The shelf holds five keepsakes. Select exactly five to
                      carry onward. Nothing is lost until you press Keep.
                    </p>
                    <div className="keep-grid">
                      {s.inventory.map((i) => (
                        <button
                          key={i.instanceId}
                          aria-pressed={keep.includes(i.instanceId)}
                          onClick={() =>
                            setKeep(
                              keep.includes(i.instanceId)
                                ? keep.filter((k) => k !== i.instanceId)
                                : [...keep, i.instanceId],
                            )
                          }
                        >
                          <Art id={i.itemId} />
                          <span>
                            {C.items[i.itemId].name}
                            <small>{C.items[i.itemId].description}</small>
                          </span>
                          <b>
                            {keep.includes(i.instanceId) ? "Keep" : "Leave"}
                          </b>
                        </button>
                      ))}
                    </div>
                    <p>{keep.length} of 5 selected</p>
                    <Button
                      primary
                      disabled={keep.length !== 5}
                      onClick={() => act({ type: "KEEP", ids: keep })}
                    >
                      Keep these five
                    </Button>
                  </>
                )}
                {isFinal && (
                  <>
                    <h2>
                      {s.phase === "finale_response"
                        ? "What does protection mean?"
                        : s.phase === "finale_interpretation"
                          ? "This is what it learned."
                          : "What will you ask of it now?"}
                    </h2>
                    <p>
                      {s.phase === "finale_response"
                        ? C.finale.intro
                        : s.phase === "finale_interpretation"
                          ? C.finale.interpretations[s.finale.frozenAspect].text
                          : "The army waits. Your last request will decide the place of this god in the world."}
                    </p>
                    {s.finale.records.length > 0 && (
                      <p className="greeting">
                        {s.finale.records.at(-1).choice.text}
                      </p>
                    )}
                    <p className="small">
                      {s.phase === "finale_response"
                        ? `It answers as ${C.aspects[s.finale.frozenAspect].label}. You may add one keepsake below.`
                        : "Only these changes apply. No new lessons or remnants."}
                    </p>
                    <div className="final-choices">
                      {finaleChoices(s).map((c) => {
                        const f = previewFinale(s, c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              const phase = s.phase;
                              act({ type: "FINALE", id: c.id, step: phase });
                              sound.play(
                                phase === "finale_fate"
                                  ? f.trust >= 4 && f.defence >= 6
                                    ? "ending_warm"
                                    : "ending_cold"
                                  : "awakening",
                              );
                            }}
                          >
                            <strong>{c.label}</strong>
                            <span>
                              Trust {s.trust} → {f.trust} · Defence {s.defence}{" "}
                              → {f.defence}
                            </span>
                            {s.phase === "finale_fate" && (
                              <small>
                                {f.defence >= 6
                                  ? "Army stopped"
                                  : "Army enters"}{" "}
                                ·{" "}
                                {f.trust >= 4
                                  ? "Community intact"
                                  : f.trust === 0
                                    ? "Sanctuary abandoned"
                                    : "Community fractured"}
                              </small>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="small">
                      After the last choice: 6 Defence stops the army; 4 Trust
                      keeps the community intact.
                    </p>
                  </>
                )}
                {isEnd && (
                  <>
                    <h2>{C.endings[s.endingId].title}</h2>
                    <p>{C.endings[s.endingId].text}</p>
                    {C.endings[s.endingId].aspect_coda && (
                      <p>{C.endings[s.endingId].aspect_coda[s.aspect]}</p>
                    )}
                    <div className="ending-checks">
                      <span>
                        Army stopped{" "}
                        <strong>{s.defence >= 6 ? "Yes" : "No"}</strong>
                      </span>
                      <span>
                        Community intact{" "}
                        <strong>{s.trust >= 4 ? "Yes" : "No"}</strong>
                      </span>
                      <span>
                        The god{" "}
                        <strong>
                          {
                            {
                              sleep: "Returned to stone",
                              remain: "Remained",
                              wander: "Wandered away",
                            }[s.finale.fateId]
                          }
                        </strong>
                      </span>
                    </div>
                    <h3>It remembers what you gave.</h3>
                    {[s.history[0], s.history[2], s.history[4]].map((h) => (
                      <p className="memory" key={h.id}>
                        Day {h.day}: {C.votives[h.votive].name}
                        {h.catalyst
                          ? ` and ${C.items[h.catalyst].name}`
                          : ""}. {h.outcome.echo}
                      </p>
                    ))}
                    <Button
                      primary
                      onClick={() => {
                        setSeed(
                          "MOSS-" +
                            Date.now().toString(36).slice(-5).toUpperCase(),
                        );
                        openModal("new");
                      }}
                    >
                      Try another offering
                    </Button>
                    <Button
                      onClick={() => {
                        setTab("run");
                        openModal("journal");
                      }}
                    >
                      Read the chronicle
                    </Button>
                  </>
                )}
              </section>
            </>
          )}
        </div>
        {screen === "play" && s.phase === "prepare" && (
          <section className="ritual-desk">
            <div className="votives">
              <div className="shelf-heading">
                <span className="eyebrow">01 · Choose a daily votive</span>
                <small>Returns each dawn</small>
              </div>
              <div className="items">
                {Object.keys(C.votives).map((id) => (
                  <Item
                    onInspect={setCaption}
                    key={id}
                    id={id}
                    selected={s.selectedVotive === id}
                    onClick={() => act({ type: "VOTIVE", id })}
                    dragId={`v:${id}`}
                  />
                ))}
              </div>
              <p className="item-detail">
                {s.selectedVotive
                  ? C.votives[s.selectedVotive].description
                  : "One way for the miracle to work."}
              </p>
            </div>
            {Shelf({})}
            <div className="offering-tray">
              <span className="eyebrow">02 · Dedicate your offering</span>
              <div className="slots">
                {["v", "c"].map((kind) => {
                  const id =
                    kind === "v"
                      ? s.selectedVotive
                      : s.inventory.find(
                          (i) => i.instanceId === s.selectedCatalystInstanceId,
                        )?.itemId;
                  return (
                    <button
                      key={kind}
                      aria-label={
                        id
                          ? `Remove ${names[id].name}`
                          : kind === "v"
                            ? "Choose a votive"
                            : "No second offering"
                      }
                      className="slot"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const text = e.dataTransfer.getData("text/plain");
                        if (text.startsWith(kind + ":"))
                          act({
                            type: kind === "v" ? "VOTIVE" : "CATALYST",
                            id: text.slice(2),
                          });
                      }}
                      onClick={() =>
                        id &&
                        act({
                          type: kind === "v" ? "VOTIVE" : "CATALYST",
                          id: null,
                        })
                      }
                    >
                      {id ? (
                        <>
                          <Art id={id} />
                          <span>Remove</span>
                        </>
                      ) : (
                        <span>
                          {kind === "v" ? "Daily votive" : "No second offering"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                primary
                disabled={!s.selectedVotive || anim}
                onClick={ritual}
              >
                {s.selectedVotive ? "Ring the bell" : "Choose a votive"}
              </Button>
            </div>
          </section>
        )}
        {screen === "play" && s.phase === "finale_response" && (
          <div className="final-shelf">{Shelf({ finale: true })}</div>
        )}
      </main>
      <footer inert={modal ? true : undefined}>
        <span>The village remembers.</span>
        <span>
          {screen === "play" && s
            ? `${s.seed} · Saved locally`
            : "No accounts. No clocks. Only choices."}
        </span>
      </footer>
      <div className="sr-only" aria-live="polite">
        {screen === "play" && s
          ? `Day ${s.day}. ${s.phase.replaceAll("_", " ")}. Trust ${s.trust}. Defence ${s.defence}.`
          : ""}
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            ref={modalRef}
            onKeyDown={modalKeys}
            className="modal"
          >
            <button
              className="close"
              aria-label="Close dialog"
              onClick={closeModal}
            >
              ×
            </button>
            {modal === "settings" && (
              <>
                <span className="eyebrow">Make yourself at home</span>
                <h2 id="modal-title">The quiet details</h2>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.mute}
                    onChange={(e) => {
                      sound.unlock();
                      setSettings({ ...settings, mute: e.target.checked });
                    }}
                  />
                  Mute all sound
                </label>
                <label>
                  Music <span>{Math.round(settings.music * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={settings.music}
                    onChange={(e) => {
                      sound.unlock();
                      setSettings({ ...settings, music: +e.target.value });
                    }}
                  />
                </label>
                <label>
                  Sound effects <span>{Math.round(settings.sfx * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={settings.sfx}
                    onChange={(e) =>
                      setSettings({ ...settings, sfx: +e.target.value })
                    }
                    onPointerUp={() => sound.play("ritual_bell")}
                  />
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reducedMotion: e.target.checked,
                      })
                    }
                  />
                  Reduce motion
                </label>
                <p>
                  Play with Tab, Shift+Tab and Enter or Space. Escape closes a
                  page. There are no timed choices.
                </p>
                {confirm === "clear" ? (
                  <div className="confirmation">
                    <p>
                      Erase the pilgrimage, discoveries, and settings from this
                      browser?
                    </p>
                    <Button onClick={() => setConfirm(null)}>
                      Keep my story
                    </Button>
                    <Button
                      onClick={() => {
                        try {
                          Object.values(keys).forEach((k) =>
                            localStorage.removeItem(k),
                          );
                        } catch {}
                        liveRun.current = null;
                        setRun(null);
                        setJournal({ remnants: [], outcomes: [], endings: [] });
                        setSettings({
                          music: 0.3,
                          sfx: 0.6,
                          mute: false,
                          reducedMotion: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches,
                        });
                        setScreen("title");
                        setNotice("Local story cleared.");
                        closeModal();
                      }}
                    >
                      Erase all local data
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setConfirm("clear")}>
                    Clear all local data
                  </Button>
                )}
              </>
            )}
            {modal === "new" && (
              <>
                <span className="eyebrow">
                  Every offering teaches something
                </span>
                <h2 id="modal-title">A new pilgrimage</h2>
                {!journal.outcomes.length && !run ? (
                  <>
                    <p>
                      Your first pilgrimage begins with{" "}
                      <strong>FIRST-EMBER</strong> and a Listening god. The
                      visitors' gifts are fixed while you learn the shrine.
                    </p>
                    <p>
                      Five prayers, three final requests. All choices are yours.
                    </p>
                  </>
                ) : (
                  <>
                    <label>
                      Pilgrimage seed
                      <input
                        value={seed}
                        maxLength={64}
                        onChange={(e) => setSeed(e.target.value)}
                      />
                    </label>
                    <label>
                      Starting instinct
                      <select
                        value={opening}
                        onChange={(e) => setOpening(e.target.value)}
                      >
                        {Object.entries(C.rules.openings).map(([id, o]) => (
                          <option key={id} value={id}>
                            {o.label} · Mercy {o.mercy}, Dominion {o.dominion}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="small">
                      All instincts begin Listening. Seeds vary visitor gifts;
                      the ten prayers stay the same.
                    </p>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={hints}
                        onChange={(e) => setHints(e.target.checked)}
                      />
                      Show gentle guidance
                    </label>
                  </>
                )}
                {run && run.phase !== "ending" && confirm !== "replace" ? (
                  <>
                    <p>
                      Your current pilgrimage will be replaced. Discoveries and
                      settings stay.
                    </p>
                    <Button onClick={closeModal}>Keep playing</Button>
                    <Button primary onClick={() => setConfirm("replace")}>
                      Begin a different story
                    </Button>
                  </>
                ) : (
                  <>
                    <p>
                      {confirm === "replace"
                        ? "Replace the current pilgrimage?"
                        : ""}
                    </p>
                    <Button primary onClick={begin}>
                      {confirm === "replace"
                        ? "Replace and begin"
                        : "Enter the shrine"}
                    </Button>
                  </>
                )}
              </>
            )}
            {modal === "god" && (
              <>
                <span className="eyebrow">The shape of your lessons</span>
                <h2 id="modal-title">{C.aspects[s.aspect].label}</h2>
                <div className="god-portrait">
                  <Art id={`statue_${s.aspect}`} />
                  <div>
                    <p>{C.aspects[s.aspect].description}</p>
                    <p>
                      <strong>Mercy {s.mercy}</strong>
                      <br />
                      Restore, multiply, sustain.
                    </p>
                    <p>
                      <strong>Dominion {s.dominion}</strong>
                      <br />
                      Restrain, separate, contain.
                    </p>
                  </div>
                </div>
                <p>
                  {s.mercy === s.dominion && s.mercy >= 2
                    ? s.aspect === "listening"
                      ? "Two lessons in balance; no instinct prevails."
                      : "Two lessons in balance; its previous instinct remains."
                    : "An axis must reach 2 and lead to establish its aspect. Ties retain the previous aspect."}
                </p>
                <h3>Its last three lessons</h3>
                {s.history.slice(-3).map((h) => (
                  <p key={h.id}>
                    Day {h.day}: {C.votives[h.votive].name}
                    {h.catalyst
                      ? ` + ${C.items[h.catalyst].name}`
                      : ""} taught {h.lessons.mercy} Mercy and{" "}
                    {h.lessons.dominion} Dominion.
                  </p>
                ))}
              </>
            )}
            {modal === "journal" && (
              <>
                <span className="eyebrow">Knowledge, never power</span>
                <h2 id="modal-title">The chronicle</h2>
                <div
                  className="tabs"
                  role="tablist"
                  aria-label="Chronicle sections"
                >
                  {[
                    ["run", "This run"],
                    ["offerings", "Offerings"],
                    ["endings", "Endings"],
                  ].map(([id, label]) => (
                    <button
                      role="tab"
                      aria-selected={tab === id}
                      key={id}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === "run" ? (
                  <History />
                ) : tab === "offerings" ? (
                  <div className="discoveries">
                    {Object.entries(C.items)
                      .filter(([, i]) => i.kind === "remnant")
                      .map(([id, i]) => (
                        <article key={id}>
                          <Art
                            id={id}
                            className={
                              journal.remnants.includes(id) ? "" : "silhouette"
                            }
                          />
                          <div>
                            <h3>
                              {journal.remnants.includes(id)
                                ? i.name
                                : "An unknown remnant"}
                            </h3>
                            <p>
                              {journal.remnants.includes(id)
                                ? i.description
                                : "A future miracle may leave something here."}
                            </p>
                            {journal.outcomes
                              .filter((o) => o.reward === id)
                              .map((o) => (
                                <p className="small" key={o.key}>
                                  {petition(o.petition)?.title} +{" "}
                                  {C.votives[o.votive]?.name} ·{" "}
                                  {C.aspects[o.aspect]?.label}: {o.title}
                                </p>
                              ))}
                          </div>
                        </article>
                      ))}
                  </div>
                ) : (
                  <div className="endings-list">
                    {Object.entries(C.endings).map(([id, e]) => (
                      <article key={id}>
                        <span className="eyebrow">
                          {journal.endings.includes(id)
                            ? "Remembered"
                            : "Undiscovered"}
                        </span>
                        <h3>
                          {journal.endings.includes(id)
                            ? e.title
                            : "A story yet untold"}
                        </h3>
                        {journal.endings.includes(id) && <p>{e.text}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
