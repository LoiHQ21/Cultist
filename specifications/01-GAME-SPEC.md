# The Last Offering — game specification v1

## 1. Product definition

### Fantasy

You are the keeper of a neglected village shrine. An army will arrive in five days. The little stone god can save the village, but it learns what protection means from the things you feed it.

### Genre and platform

- Single-player, turn-based ritual puzzle with short repeatable runs.
- Browser first; desktop and tablet are the primary presentation targets.
- Touch and keyboard support are required. A narrow-screen arrangement must remain fully playable.
- Target first run: 15–25 minutes, returning run: 10–18 minutes.
- No reaction-time requirement, combat, walking avatar, or real-time economy.
- A run is deterministic given its seed and player choices.
- No model calls or internet requests are required to resolve gameplay.

### Three design pillars

1. **Understandable offerings.** A chain binds; a seed grows; a knife separates. The player can predict enough to make an intentional choice.
2. **A god with a memory.** Feeding patterns change the god's interpretation of later requests. The player sees the lesson immediately and the changed behavior later.
3. **Useful consequences.** Miracles produce strange remnants. A dangerous harvest can become a weapon in tomorrow's ritual.

### Tone

Warm, strange, occasionally sad, and darkly funny. Villagers are people with problems rather than disposable statistics. The god is sincere and dangerous, not a sarcastic narrator. No graphic gore. No modern business terminology in game copy.

## 2. Firm MVP boundary

Included:

- Five days, two petitions offered per day, one resolved petition each day.
- Three daily votives: Chain, Seed, Knife.
- Three normal catalysts: Ring, Bell, Mirror.
- Four remnants: Biting Grain, Guardian's Tear, Loose Shadow, Forgotten Name.
- Mercy and Dominion learning values.
- Three god aspects: Listening, Merciful, Possessive.
- Trust and Defence resources.
- Thirty authored base outcomes, each with three aspect-specific interpretations.
- One decision about keeping items when inventory overflows.
- Three finale decisions and six ending categories.
- One replay mode, three opening configurations, seeded gifts.
- Persistent discovery journal; no permanent statistical bonuses.
- Complete generated visual assets, generated audio, responsive interface, local saves.

Excluded:

- Multiplayer, networking, free movement, physics interactions.
- Village building, worker assignment, food simulation, combat.
- Additional disaster types, procedural quests, relationships with numeric meters.
- Arbitrary item combinations, typing free-form prayers, runtime generative dialogue.
- More than two ritual ingredients.
- Good/evil score, hidden failure rolls, hunger or mood meter.
- Praise/scold/correction mechanics from the previous brainstorm. They are deliberately removed from this MVP; offerings alone teach the god.
- An inventory of people or playable human sacrifice. Unsettling symbolic offerings provide enough range.

## 3. Run state and initial values

| Value | Initial state | Bounds / rules |
|---|---|---|
| Day | 1 | Five ritual days; sixth dawn is the finale |
| Trust | 4 | Integer 0–8 |
| Defence | 1 | Integer 0–8 |
| Mercy | 0 in guided opening | Nonnegative integer; no artificial cap |
| Dominion | 0 in guided opening | Nonnegative integer; no artificial cap |
| Aspect | Listening | Recomputed after rituals |
| Awakening | 0 | Exactly +1 per completed ritual; maximum 5 |
| Inventory | Ring, Bell | Consumables only, capacity 5 between days |
| Daily votives | Chain, Seed, Knife available | Choose one per ritual; replenish next day |
| Learning threshold | 2 | An axis must reach 2 and lead to establish its aspect |
| Army requirement | 6 Defence | Checked after all three finale decisions |
| Community requirement | 4 Trust | A protected village below 4 is fractured |

Use `mercy` and `dominion` as internal axis IDs. Display Mercy and Dominion as labels. Internal aspect IDs are `listening`, `merciful`, `possessive`. “Dominion” is the lesson; “Possessive” is the resulting personality.

Mercy does not guarantee a better ending. It helps Trust but can leave defences weak. Dominion can stop the army while alienating the village.

Trust reaching zero does not end the run early. The village is visibly distressed but can recover. Defence reaching zero also does not end the run. Check final outcomes only after the last finale decision.

## 4. Complete loop

### Phase A — dawn

- Show the current day and remaining days before the army arrives.
- Apply no hidden time-based resource change.
- Restore the three daily votives.
- Introduce today's two visitors.
- Show one short echo from yesterday's resolved miracle, with an existing outcome prop in the scene.
- Resume directly into this phase when loading a save made between days.

### Phase B — petitions

Each visitor card contains:

- Portrait and name.
- One-sentence problem.
- A short in-character request.
- The catalyst they will give if accepted.
- The exact cost of leaving the other petition unanswered: −1 Trust.

Selecting a visitor opens their full request. The player can inspect both before committing.

“Hear this prayer” commits the petition and grants that visitor's gift exactly once. The other visitor remains visible but their petition is now unavailable today. There is no additional confirmation dialog.

The accepted gift can temporarily take the inventory above capacity. Do not force discarding until after the ritual. This allows the new gift to be used immediately.

### Phase C — prepare the offering

- Select one daily votive: Chain, Seed, or Knife.
- Optionally select one consumable from inventory.
- Both slots remain freely editable before confirmation.
- Show a readable omen, the current aspect, exact predicted Trust/Defence changes, predicted lessons, and the visible −1 Trust cost for the other petition.
- Show a silhouette for a never-discovered remnant reward; show its name if already discovered.
- One primary votive is required. A consumable is optional.
- Click/tap selection is the canonical input. Dragging is a convenience.

The statue reacts to hovered or focused objects with a subtle eye/mouth movement and a brief caption. This is atmosphere, not a hidden rule.

### Phase D — feed

“Ring the bell” commits the ritual. Disable the button while committing or animating.

1. Consume the selected catalyst instance, if any.
2. Resolve the selected petition/method under the aspect visible before feeding.
3. Apply the combined ritual deltas to Trust and Defence, clamping each once.
4. Apply lessons and update the aspect.
5. Award one remnant.
6. Apply the unchosen petition's −1 Trust penalty, clamping once.
7. Increment Awakening and mark today's ritual resolved.
8. Save this committed state before playing the result animation.

The animation presents these changes in the same order. Animation never controls whether a change occurs.

### Phase E — aftermath

Show:

- What happened in a concise narrative, using the selected aspect interpretation.
- The selected votive and catalyst as a small causal chain.
- Actual Trust/Defence changes, including clipping at bounds.
- New Mercy/Dominion lesson values.
- Any new aspect and its concrete next-ritual effect.
- The awarded remnant, with its effect.
- One line about the unanswered petition and its Trust loss.

The player clicks “Take the remnant”; this dismisses the presentation. The item was already awarded at commit, so reloading here cannot duplicate it.

When over capacity, open “What will you keep?” and require discarding down to five. Items have visible effects; there is no unseen disposal penalty. Use a separate Keep button so a mistaken tap does not instantly destroy an item.

“Rest until dawn” advances the day. After day five it becomes “Let it awaken.”

## 5. Votives and inventory

### Daily votives

These are small symbolic gifts left in three baskets by shrine attendants. Each dawn brings a fresh chain-link votive, a seed packet, and a ritual knife. The keeper can dedicate only one before the shrine closes for the day.

They are not inventory instances and do not occupy capacity. Visually and verbally distinguish the three baskets from the consumable shelf.

| Votive | Method ID | Meaning | Lesson |
|---|---|---|---|
| Chain | bind | Hold together, restrain, protect through containment | +1 Dominion |
| Seed | grow | Restore, multiply, sustain | +1 Mercy |
| Knife | sever | Remove, separate, cut away | +1 Dominion |

Every petition supports all three methods. Knife is useful but its directness tends to cost Trust. Chain tends toward a middle route. Seed usually supports people at the expense of preparation.

### Consumables

| Item | Mechanical effect on this ritual | Lesson |
|---|---|---|
| Ring | +1 Trust | +1 Mercy |
| Bell | +1 Defence | +1 Dominion |
| Mirror | Add the method's base Trust/Defence deltas one extra time | Repeat the votive's lesson once |
| Biting Grain | +2 Defence, −1 Trust | +1 Dominion |
| Guardian's Tear | +1 Defence, +1 Trust | +1 Mercy |
| Loose Shadow | +1 Defence; if the combined ritual Trust delta is negative, replace it with 0 | +1 Dominion |
| Forgotten Name | +2 Trust | +1 Mercy |

The Mirror repeats base deltas, including negative ones. It does not repeat aspect adjustments, award two remnants, duplicate another catalyst, or repeat the unanswered-petition penalty.

The Shadow protects from negative Trust in the ritual only. The ignored petition still costs Trust afterward.

Multiple copies can be held. Select a particular instance; effects depend on type only. Group duplicate icons with a count in the shelf, but retain instance IDs internally.

All items are previewable. No player should lose a run because the item description concealed a mechanical effect.

## 6. Learning and aspects

### Aspect selection

Use the previous aspect to break ties:

```text
if max(Mercy, Dominion) < 2:
    Listening
else if Mercy > Dominion:
    Merciful
else if Dominion > Mercy:
    Possessive
else:
    retain previous aspect
```

If both reach 2 together while previously Listening, the god remains Listening. Say “Two lessons in balance; no instinct prevails.” A later lead changes it.

The current ritual uses the old aspect. Lessons from that ritual affect the next ritual. Preview this explicitly: “It answers as Listening. This offering will make it Possessive.”

### Aspect effects

| Aspect | Trust adjustment | Defence adjustment | Behavior / visual language |
|---|---:|---:|---|
| Listening | 0 | 0 | Uncertain, curious, quiet |
| Merciful | +1 | −1 | Helps indiscriminately; flowers, open hands, soft light |
| Possessive | −1 | +1 | Protects through control; enclosing hands, roots, narrow gaze |

These are added to the selected method's base effects. Negative Defence can occur; clamp the result to 0 afterward.

Traits are not hidden stats. Display both counts in the god inspection panel and a compact current-aspect label near the statue. The constant HUD does not need two large progress bars.

### Narrative assembly

Each ritual outcome has:

1. A method-specific event.
2. An aspect-specific interpretation written for that event.
3. A short catalyst flavor line, if one was used.
4. A lesson line and remnant.

Use the authored strings. Do not use runtime generative AI. Do not randomize an outcome after the omen has been shown.

## 7. Authoritative ritual calculation

The JSON stores `[defence, trust]` as named fields, not positional arrays. All implementations should use named fields as well.

```text
base = selected outcome's base deltas
total = copy(base)

if catalyst is Mirror:
    total += base
else if catalyst exists:
    total += catalyst deltas

total += current aspect deltas

if catalyst is Loose Shadow:
    total.trust = max(0, total.trust)

newDefence = clamp(oldDefence + total.defence, 0, 8)
ritualTrust = clamp(oldTrust + total.trust, 0, 8)
finalTrust = clamp(ritualTrust - 1, 0, 8)

lessons = votive lesson + catalyst lesson
if catalyst is Mirror:
    lessons = votive lesson twice

apply lessons; compute next aspect
award exactly one outcome remnant
awakening += 1
```

The −1 Trust is a separate operation because at the cap an unanswered petition must still matter. Example: Trust 8, ritual +2, ignored petition −1 gives Trust 7, not 8.

Show predicted final values as well as arrows. “Trust 8 → 7” is more useful than an unclipped “+2, −1.”

### Example

Day 1, Empty Granary, Chain + Bell, Listening:

- Base: +1 Defence, 0 Trust.
- Bell: +1 Defence.
- Listening: no adjustment.
- Start D1/T4 → ritual D3/T4 → unanswered prayer D3/T3.
- Lessons: +2 Dominion.
- Next aspect: Possessive.
- Reward: Guardian's Tear.

Day 2, use that Tear with Seed under Possessive:

- The Tear adds Defence and Trust and teaches Mercy.
- The old Possessive aspect still modifies today's result.
- The new lessons can bring Mercy toward balance.
- The player can deliberately use a leftover from containment to soften the god.

## 8. Petitions and callbacks

Ten petitions and all outcomes are in the content file.

| Day | Visitor A | Visitor B |
|---|---|---|
| 1 | Mara the baker: Empty Granary | Ivo the ferryman: Missing Ferry |
| 2 | Ada the gardener: Root-Sick Orchard | Sela the bellkeeper: A Bell Nobody Hears |
| 3 | Bram the mason: Broken Wall | Nell the archivist: Names for the Forgotten |
| 4 | Mara: Refugees at the Gate | Ivo: The Last Bridge |
| 5 | Bram: A Watch That Will Not Sleep | Nell: Tomorrow's Names |

Repeated visitors acknowledge previous events through a short conditional greeting:

- If their previous petition was resolved, use its `callback_helped`.
- If it was ignored, use its `callback_ignored`.
- If no previous appearance, use the default greeting.

This changes presentation only. Do not invent hidden relationship penalties. The two later petitions remain available either way.

Yesterday's event remains represented by a small shrine/village overlay and a one-line dawn echo. Retain at most the two most recent props to avoid clutter. Remnants persist independently.

## 9. Awakening finale

After the fifth ritual and inventory selection, show the sixth dawn. The god expands beyond the shrine. The army appears as distant banners and silhouettes; no combat units or combat simulation are needed.

Freeze the aspect for the entire finale. No further lessons or remnants are awarded. Awakening remains five. Finale choices use the same capped Trust/Defence resources.

### Decision 1 — meet the army

Choose a petition:

| Choice | Base Defence | Base Trust |
|---|---:|---:|
| Strike the banners | +2 | −1 |
| Shelter our people | −1 | +2 |
| Stand at our gate | +1 | 0 |

You may add one held consumable. It is optional. Use the normal catalyst and aspect calculations, but:

- No votive is selected.
- Mirror repeats the selected finale choice's base deltas.
- No learning occurs.
- No remnant is awarded.
- No unanswered-petition penalty occurs.

Preview final values and consume the selected item exactly once on commit.

### Decision 2 — contain its interpretation

Use the frozen aspect to select the authored scene:

- Merciful: it shelters enemy soldiers alongside villagers.
- Possessive: it seals the village so nobody can leave.
- Listening: it waits for a precise instruction while the army approaches.

Choose one of two responses in the content file. These are raw deltas only: no catalyst, no aspect modifier, no lessons.

Merciful: receive everyone (−1 D, +2 T) or draw a boundary (+1 D, −1 T).

Possessive: open the gates (−1 D, +2 T) or keep them sealed (+2 D, −1 T).

Listening: protect their freedom (0 D, +1 T) or strengthen the walls (+1 D, 0 T).

### Decision 3 — its place in the world

All options are always available:

| Choice | Defence | Trust | Meaning |
|---|---:|---:|---|
| Let it sleep | −2 | +1 | Spend protection to return daily life to the village |
| Ask it to remain | +1 | −1 | Keep a divine guardian and accept its demands |
| Let it wander | −1 | 0 | Release it after it has helped; the village must stand alone |

Again, raw deltas only. No aspect modifier or catalyst. Clearly preview whether the final Defence will meet 6.

### Ending classification

Evaluate in this exact order:

1. Trust is 0 → **An Empty Sanctuary** (`abandoned`), regardless of Defence.
2. Defence < 6 → **The Banners Enter** (`overrun`).
3. Trust is 1–3 → **A Village Divided** (`fractured`).
4. Trust ≥ 4 and Defence ≥ 6:
   - Sleep → **A Quiet Dawn** (`quiet`).
   - Remain → **Under Its Hands** (`guarded`).
   - Wander → **Beyond the Hill** (`free`).

“Under Its Hands” is a valid success, not a fake bad ending. The final narration acknowledges the personality of the remaining god.

Present the result as a final illustrated scene with:

- Ending title and 2–3 sentences.
- Army stopped: yes/no.
- Community intact: yes/no.
- The god's fate.
- Three specific ritual memories drawn from the player's actual history.
- “Try another offering” and “Read the chronicle.”

Do not show arbitrary score stars. The history and outcome are the reward.

## 10. Replay rules

### First run

Use seed `FIRST-EMBER`, the Listening opening (M0/D0), fixed gifts, and contextual tutorial hints. The content schedule is fixed. The player still has full choice of petition, votive, and consumable.

### Subsequent runs

“New pilgrimage” offers:

- Seed entry, with a generated readable seed by default.
- One of three starting instincts, all unlocked immediately:
  - Listening: M0/D0.
  - Gentle: M1/D0.
  - Watchful: M0/D1.
- Optional guided hints.

Both one-point starts are still Listening until the threshold is reached.

Seed variation changes visitor gifts only. Each gift is drawn uniformly from Ring, Bell, Mirror. Use separate deterministic random keys per petition so inspecting a card, loading a save, and opening the journal do not advance randomness.

The ten petitions and their order do not change in this MVP. Be honest about this boundary: replay variety comes from planning, gifts, aspects, remnants, and endings, not an endless story generator.

Persist discovered remnants, outcome entries, and ending categories across runs. New journal entries never grant power. Allow “Clear all local data” behind a confirmation.

## 11. Screens and interaction

### Title

- Generated shrine background at night/dusk, living candle and dust effects.
- Game title as real text.
- Continue (only with valid save), New pilgrimage, Chronicle, Settings.
- One sentence: “Five days. One village. A god that learns what you feed it.”
- Start audio after the first gesture, honoring browser autoplay rules.

### Main shrine screen

The scene occupies most of the screen, with a large readable statue at center. HUD elements look like modest paper/wood objects at the edges, not a SaaS dashboard.

Desktop layout reference, 1440×900:

- Header within x24–1416, y16–78: day/awakening left; Trust/Defence right.
- Shrine world within x0–1440, y70–690.
- Statue around x535–920, y155–620.
- Current visitor left of the altar, around x100–380.
- Petition paper opens near the visitor; does not cover the statue's mouth.
- Ritual tray and inventory in y670–875.
- God inspection and Chronicle as small labeled controls.

Do not hardcode these coordinates as the only responsive layout. They define composition, not an implementation requirement.

### Narrow screen

At 390×844:

- Compact HUD.
- Shrine scene about 42% of available height.
- Petition/omen below scene.
- Two ingredient slots and confirmation button.
- Horizontally scrollable item shelf with clear overflow indication.
- Use normal vertical page scrolling when needed; never hide actions below an unscrollable viewport.

No orientation lock. Landscape mobile can use the desktop arrangement with smaller side panels.

### Ritual controls

- Click a votive to select it; click another to replace it.
- Click a consumable to select it; click it again or use the slot's Remove control to clear it.
- Dragging has visible valid drop targets, snapping, and an equivalent click path.
- Missing primary: disabled bell button with the hint “Choose a votive.”
- No catalyst: a deliberate valid state, labeled “No second offering.”
- Hover/focus reveals item descriptions. Tap opens a compact detail sheet.

### Chronicle

Three tabs or sections: This Run, Offerings, Endings.

- This Run lists the actual five days and finale decisions.
- Offerings records discovered remnants and their known source combinations.
- Endings shows earned titles and undiscovered silhouettes.
- Opening the Chronicle never consumes a turn or changes RNG.
- Avoid a giant recipe-completion checklist as the primary motivation.

### God inspection

- Current name/aspect.
- Mercy and Dominion counts with concise definitions.
- Current mechanical modifier.
- Last three lessons with their source objects.
- Tie explanation when applicable.

## 12. Presentation and timing

Feed animation target: 2.0–3.0 seconds.

1. Bell swing/sound: 250 ms.
2. Selected offering rises toward the mouth: 450 ms.
3. Mouth/eyes respond and offering disappears: 350 ms.
4. Light/particle pulse: 450 ms.
5. Result scene/prop appears: 400 ms.
6. Aftermath text begins displaying.

Use whole sentences, immediately readable. Do not require waiting through character-by-character text. Provide Skip/Continue during animation; reduced motion makes the transition under 250 ms.

Aspect transformation: approximately 800 ms crossfade plus separate eye/hand movement. Never apply a gross full-body squash to a detailed painting.

Idle movement should be localized: candle flicker, hanging charm, breath/eye shift, a villager glance. Limit parallax and avoid perpetual camera drift.

Audio has distinct success, unease, lesson, and failure cues. A grim outcome should not get a cheerful generic success jingle.

## 13. Accessibility and usability

- Full keyboard play: Tab/Shift-Tab, Enter/Space, Escape.
- Visible focus indicators with the same visual quality as hover.
- No essential information conveyed only by color, animation, sound, or hover.
- Real text, semantic buttons, meaningful accessible names.
- Screen-reader announcements for phase changes and concise results; decorative images have empty alt text.
- Reduced motion and separate music/SFX volume controls.
- Body copy at least 16 CSS px on narrow screens; preferred 18–20 px on desktop.
- Maintain readable contrast on parchment. Avoid tiny cursive body fonts.
- Click/touch targets at least 44×44 CSS px.
- Item name and icon remain visible when disabled; explain why a control is unavailable.
- No timed decisions.

## 14. Save and resilience

- Local-only saves; no account or backend required.
- Save after each committed petition, ritual, inventory discard, day transition, and finale choice.
- Include a schema version and content version.
- Reloading during animation shows the committed result with a short transition; never reapplies deltas or grants another item.
- Inventory overflow must remain unresolved after reload until the player chooses.
- Invalid or incompatible saves offer a new run with a clear message. Preserve the separate discovery journal when possible.
- If storage is blocked, allow an in-memory session and show a small “Progress cannot be saved in this browser” notice.
- Beginning a new run with an active run requires confirmation because it replaces that run.
- Settings persist independently from the run.

## 15. Playtest questions and changes worth making

Observe at least five complete sessions when people are available. These are hypotheses, not claimed results.

Measure:

- Time to first completed ritual.
- Whether the player can explain an aspect change after day two.
- Whether a remnant is deliberately reused.
- Whether someone changes a planned ritual after reading its preview.
- Which decisions feel like obvious upgrades with no tradeoff.
- Whether a player starts a second run voluntarily.

Initial goals:

- First ritual within three minutes without spoken help.
- At least four of five testers correctly explain one causal chain.
- At least three of five deliberately reuse a remnant.
- At least three materially different approaches reach a successful ending in deterministic automated simulations.
- No recipe/catalyst is best on both Trust and Defence for all ten petitions.

Potential adjustments, only after testing:

- If players always choose Knife, increase its social cost or improve selective Chain outcomes.
- If they always save every catalyst, improve preview clarity and make the day-five hand limit salient.
- If the aspect feels punitive, tune the modifier magnitude or threshold, not hidden probabilities.
- If outcomes feel repetitive, add bespoke visual aftermath props before adding more meters.
- If the ending is confusing, emphasize the two thresholds earlier and show exact finale forecasts.

Do not silently rebalance while implementing the first version. Report evidence and change the content version when tuning.
