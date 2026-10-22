# The Last Offering — implementation plan and playable slices

## 1. Implementation approach

Build a browser application with a deterministic rules module and a scene-based interface.

A straightforward stack is TypeScript, React, Vite, and CSS, with Web Audio for sound. Equivalent familiar tools are acceptable. No particular current package version is required by this document; use versions supported in the actual environment and consult official documentation when necessary.

The core game is a small state machine, not a physics simulation. A rendering engine is optional. React/DOM plus CSS animations is sufficient for the required layered artwork, buttons, draggable items, journal, and result screens.

No backend is necessary. Do not add accounts, a database, payment, analytics SDKs, or cloud AI calls to resolve rituals.

If using Sites, follow its skill and hosting instructions, reuse existing site configuration, and use private publication unless the user requests a different audience.

## 2. Suggested project organization

```text
src/
  game/
    types.ts
    content.ts
    rules.ts
    aspect.ts
    seededGifts.ts
    reducer.ts
    selectors.ts
    save.ts
  ui/
    TitleScreen.tsx
    ShrineScene.tsx
    PetitionPanel.tsx
    RitualTray.tsx
    OfferingShelf.tsx
    OmenPreview.tsx
    AftermathPanel.tsx
    KeepItemsPanel.tsx
    GodPanel.tsx
    Chronicle.tsx
    FinaleScene.tsx
    EndingScreen.tsx
    Settings.tsx
  art/
    assetManifest.ts
    sceneLayout.ts
  audio/
    AudioManager.ts
    synth.ts
  styles/
    tokens.css
    scene.css
    interface.css
content/
  game.json
public/assets/
assets-source/
tests/
```

This is a recommendation, not a requirement to generate empty files. Keep actual code proportionate to the game.

## 3. State model

Illustrative TypeScript contract:

```ts
type Aspect = "listening" | "merciful" | "possessive";
type VotiveId = "chain" | "seed" | "knife";
type ItemId =
  | "ring" | "bell" | "mirror"
  | "biting_grain" | "guardian_tear"
  | "loose_shadow" | "forgotten_name";

type Phase =
  | "dawn"
  | "petitions"
  | "prepare"
  | "aftermath"
  | "keep_items"
  | "finale_response"
  | "finale_interpretation"
  | "finale_fate"
  | "ending";

interface ItemInstance {
  instanceId: string;
  itemId: ItemId;
  source: "starting" | "gift" | "remnant";
  acquiredDay: number;
}

interface RunState {
  schemaVersion: number;
  contentVersion: string;
  runId: string;
  seed: string;
  guided: boolean;
  opening: "listening" | "gentle" | "watchful";
  day: number;
  phase: Phase;
  trust: number;
  defence: number;
  mercy: number;
  dominion: number;
  aspect: Aspect;
  awakening: number;
  inventory: ItemInstance[];
  selectedPetitionId: string | null;
  selectedVotive: VotiveId | null;
  selectedCatalystInstanceId: string | null;
  giftsByPetition: Record<string, ItemId>;
  acceptedPetitionIds: string[];
  history: RitualRecord[];
  activeResult: RitualRecord | null;
  finale: {
    frozenAspect: Aspect | null;
    responseId: string | null;
    catalystInstanceId: string | null;
    interpretationId: string | null;
    fateId: string | null;
    records: FinaleRecord[];
  };
  endingId: string | null;
}
```

`RitualRecord` must store the source state relevant to the result:

- Unique record ID and day.
- Accepted/ignored petition IDs.
- Votive and catalyst item/instance IDs.
- Aspect used and aspect after learning.
- Base deltas, catalyst contribution, aspect contribution.
- Requested deltas and actual capped deltas.
- Trust after ritual and after unanswered-petition penalty.
- Before/after resources and lessons.
- Awarded remnant and instance ID.
- Authored outcome key and current content version.

This makes the journal truthful and prevents changes in UI preview code from rewriting history.

`FinaleRecord` stores the step, choice, optional catalyst, aspect used where applicable, and before/after resources.

Transient hover, modal state, and animation progress do not belong in gameplay history. Save the semantic phase; on reload, show its stable presentation.

## 4. Pure rules interface

```ts
previewRitual(state, petitionId, votiveId, catalystInstanceId): RitualPreview
resolveRitual(state, selection): RitualResolution
selectAspect(mercy, dominion, previousAspect): Aspect
previewFinaleResponse(state, choiceId, catalystInstanceId): FinalePreview
resolveFinaleResponse(state, choiceId, catalystInstanceId): FinaleResolution
applyFinaleChoice(state, step, choiceId): FinaleResolution
classifyEnding(state): EndingId
createRun(seed, opening, guided): RunState
```

Preview and commit must call the same calculation. Do not implement a separate set of arithmetic for tooltips.

The rules module must not read the DOM, time, local storage, audio state, or global random numbers.

## 5. Seeded randomness

Use a documented stable string hash and a simple deterministic PRNG. One acceptable approach:

1. UTF-8 bytes of `${seed}:${petitionId}:gift:v1`.
2. FNV-1a 32-bit hash.
3. Seed a stable 32-bit generator such as mulberry32.
4. Take the first sample to select one of the three gift types.

Store the resulting `giftsByPetition` in the save. Never reroll when reopening a panel.

Guided `FIRST-EMBER` mode uses the authored gifts in JSON and ignores random gift selection. Opening selection is separate from the seed and is saved.

Keep flavor randomness separate from mechanics. A particle animation may use a different seed without affecting the gift sequence.

## 6. State machine

```text
Title
  New / Continue
    ↓
Dawn → Petitions → Prepare
                         ↓ commit once
                     Aftermath
                         ↓ if over capacity
                     Keep Items
                         ↓
                Dawn of next day
                         ↓ after day 5
                  Finale Response
                         ↓
               Finale Interpretation
                         ↓
                    Finale Fate
                         ↓
                       Ending
```

Aftermath without overflow may advance directly. Keep Items never advances the day itself; it returns to a resolved aftermath state with the appropriate next-day action.

Opening a journal or settings modal is an overlay, not a new gameplay phase.

Idempotency guards:

- A petition cannot be accepted twice in the same day.
- A ritual is identified by run ID + day and cannot resolve twice.
- A remnant instance ID derives from its ritual record ID.
- Each finale step can commit only once.
- UI disabling is helpful but not the only protection; reducer checks enforce the rules.

## 7. Slice 0 — foundation and art proof

### Playable deliverable

Open the title, start a run, inspect the shrine, select and remove a votive from the tray. No full ritual is required yet.

### Work

- Scaffold the application.
- Load the content JSON and validate it at build/test time.
- Implement state creation, phase structure, and basic layout.
- Generate and integrate the five art-proof assets from the art brief.
- Display a real layered scene with live text, one visitor, item selection, and accessible controls.
- Implement settings storage and audio unlock scaffolding.

### Acceptance

- Runs locally with the documented command.
- No invalid content references.
- A consistent seed initializes identical state.
- Click and keyboard selection work.
- Desktop and narrow screen show the whole interaction.
- Inspect screenshots and resolve art mismatch before bulk asset generation.

### Exit gate

The game has an established visual direction in its actual UI. A static mockup alone does not pass.

## 8. Slice 1 — one complete ritual

### Playable deliverable

Play Day 1 with either petition, all three votives, Ring or Bell as catalysts, preview, feeding animation, outcome, learning, remnant reward, and unanswered-prayer cost.

### Work

- Implement preview/resolve with pure functions.
- Add visitor inspection and one-time gift grant.
- Add catalyst selection, optional no-catalyst state, and tray editing.
- Generate all ten offering sprites.
- Add a short generated bell sound, item sound, and feeding transition.
- Display actual result values and lesson causality.
- Save the committed result before playing animation.

### Acceptance

- Empty votive slot cannot commit.
- No-catalyst ritual succeeds.
- Day 1 Granary + Chain + Bell results in D3/T3, Dominion 2, Possessive next aspect, one Guardian's Tear.
- The result uses Listening, not the newly acquired Possessive modifier.
- Restart during animation does not consume/grant twice.
- Both Day 1 petitions and all three outcomes have the right prose.
- The player can explain why the god changed by inspecting the result.

### Exit gate

One finished-feeling ritual, including real assets and sound, works end to end.

## 9. Slice 2 — the consequence becomes an offering

### Playable deliverable

Play Days 1 and 2. Use a remnant from Day 1 to alter Day 2. See the new aspect's effect and its physical transformation.

### Work

- Add all three statue forms and transitions.
- Implement all consumable effects, including Mirror and Shadow exceptions.
- Add reward discovery state and item descriptions.
- Add the inventory capacity flow.
- Generate the four trace props and display the two most recent.
- Add god inspection and day history.
- Add the relevant Day 2 visitors.

### Acceptance

- A Day 1 remnant is selectable and consumed correctly on Day 2.
- Mirror repeats only the base and votive lesson.
- Shadow prevents negative ritual Trust but does not cancel the ignored petition.
- Capped values in preview exactly match committed values.
- Ties retain the previous aspect.
- At least one visible scene change represents the prior miracle.
- Overflow requires a deliberate selection and cannot trap the player.

### Exit gate

The defining feedback loop is playable. It must feel meaningfully different to reuse a Guardian's Tear versus a Biting Grain.

## 10. Slice 3 — the full five-day pilgrimage

### Playable deliverable

Complete all five ritual days, with all ten petitions and all thirty method outcomes available across runs.

### Work

- Integrate all authored content.
- Generate remaining visitor art and expression variants.
- Add repeated-visitor greetings based on real history.
- Implement all dawn echoes and item retention.
- Add reliable save/resume for every stable phase.
- Finish shrine music, ambient effects, and narrative pacing.
- Add the tutorial's contextual hints.

### Acceptance

- Five rituals produce Awakening 5 exactly.
- No hidden early game-over at Trust 0 or Defence 0.
- Every petition has three outcomes and three aspect interpretations.
- All scenes remain readable with inventory at capacity and long copy.
- Reload works after petition acceptance, ritual commit, inventory overflow, and day transition.
- The guided first run uses the exact authored gifts.

### Exit gate

The first five days are content-complete and asset-complete. The button to awaken is available.

## 11. Slice 4 — the complete ending

### Playable deliverable

Play the three finale decisions, receive one of six ending categories, review the actual history, and begin another run.

### Work

- Generate the three awakening scenes and three ending paintings.
- Freeze the aspect at finale entry.
- Implement optional catalyst use in the first finale decision.
- Implement raw deltas for the second and third decisions.
- Implement exact ordered ending classification.
- Build ending summary and run chronicle.
- Add generated awakening and ending sound.

### Acceptance

- No learning or remnant occurs in the finale.
- Stage 1 Mirror repeats the response base; Shadow behaves normally.
- Stages 2 and 3 do not reapply aspect modifiers.
- All six ending categories can be reached by valid deterministic routes.
- Each ending has truthful resource checks and at least three actual historical references.
- New run clears run state but preserves discoveries and settings.

### Exit gate

A complete start-to-ending browser game exists. Do not stop here if replay, accessibility, or art acceptance remains unfinished.

## 12. Slice 5 — replay and polish

### Playable deliverable

Start another run with a different seed/opening, pursue a different god and ending, and use the chronicle to carry knowledge forward.

### Work

- Seeded gift variation and all three openings.
- Complete persistent journal/discoveries.
- Finish responsive layout, keyboard input, reduced motion, audio settings.
- Asset optimization, preloads, graceful audio/storage fallback.
- Finish remaining UI materials, prop animation, and tactile polish.
- Add development-only state inspector or fixture loader for efficient QA.
- Publish privately if using Sites, following its required workflow.

### Acceptance

- Same seed/opening and action sequence yields the same result.
- Different seeds vary gifts without breaking ritual availability.
- Keyboard-only play can reach an ending.
- Reduced motion suppresses long travel/swing/glow animations.
- Mute settings persist and audio does not double on tab resume.
- No missing art or production placeholders.
- All 42 image roles and generated audio are present in the manifest.
- Title, ritual, aftermath, god forms, finale, and endings have been visually reviewed.
- No browser console errors or network asset failures across a complete run.

### Exit gate

The user can open the delivered URL or local build and play a finished MVP immediately.

## 13. Meaningful rule tests

Tests should cover actual design risks, not mirror every line of UI code.

Required:

1. All thirty base recipes resolve for all three aspects and eight catalyst states (none + seven items).
2. Trust cap and ignored penalty ordering, especially T8 with positive ritual delta.
3. Defence lower-bound clamping with Merciful + low-defence Seed.
4. Mirror repeats a negative base Trust delta.
5. Shadow cancels the combined ritual Trust loss, not only the base loss.
6. Shadow does not cancel the unanswered-petition penalty.
7. The current ritual uses the aspect before learning.
8. Equal axes retain the previous aspect; below threshold is Listening.
9. Inventory consumption uses the selected instance and cannot duplicate a gift/remnant.
10. Every finale stage applies only its specified modifiers.
11. Ending order correctly prioritizes Trust 0 over invasion.
12. Same seed and actions produce the same state.
13. A round-trip save preserves inventory IDs, gifts, history, phase, and finale progress.
14. A repeated commit action does not mutate an already resolved day.

Use the provided Python reference checks as an additional specification oracle, not as a substitute for tests against the actual browser implementation.

## 14. Browser checks

Perform at least:

- One complete normal run.
- One run using Mirror and one using Shadow.
- A save/reload during aftermath and during overflow.
- A save/reload between each finale step.
- A successful ending and a loss ending through the real UI.
- Keyboard-only petition, item, ritual, modal, and finale interactions.
- Touch-sized viewport interaction.
- Reduced-motion run of one ritual.
- Muted start and unmute after gesture.
- New run cancellation and confirmation.

Use automation where available. Inspect screenshots as well as assertions. Do not claim browser testing if only a build command was run.

## 15. Balance checks

The handoff's reference simulation checks reachability, not player enjoyment or real-world win rates.

During implementation, enumerate or sample legal routes to confirm:

- At least three materially different strategies can stop the army and preserve the community.
- Pure defensive play can lose through low Trust.
- Pure benevolent play can lose through low Defence.
- All six ending categories are reachable.
- Remnant use can change at least one outcome category compared with omitting it.

Record exact route actions for reproducibility. Random policy success rates are not human difficulty estimates.

If a required category is unreachable, first inspect the implementation and data against the spec. Propose a small explicit content-versioned tuning change if the spec itself needs balancing.

## 16. No hidden scope cuts

If time or tooling blocks part of the work, clearly distinguish:

- Implemented and tested.
- Implemented but not verified.
- Missing or blocked.

Do not label a first-day demo as the full MVP. Do not claim “generated art complete” if a concept sheet is standing in for the asset set.

The required priority is:

1. Complete deterministic five-day run and ending.
2. Core remnant reuse and learned-aspect consequences.
3. Cohesive generated shrine/character/item art in the playable interface.
4. Replay, saves, keyboard/touch access.
5. Final animation, audio, and presentation acceptance.

All five are part of final acceptance; the ordering guides the work, not permission to silently omit later items.

## 17. Delivery checklist

- Working browser build and live URL when hosting is available.
- Source, lockfile, and simple local run instructions.
- Versioned content JSON and deterministic rules.
- Original generated sources plus optimized runtime exports.
- Asset manifest with prompts, references, and actual dimensions.
- Generated audio source/generator and runtime files where applicable.
- Passing relevant automated checks.
- Screenshot review at desktop and narrow sizes.
- A short explanation of how to play.
- Known limitations: one disaster, fixed petition schedule, three ending paintings reused across six ending categories, finite authored combinations.
- Actual test evidence; no invented playtest participants or metrics.
