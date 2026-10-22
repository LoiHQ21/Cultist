# Validation and first playtest

## What has actually been checked

The package contains a specification and reference calculation, not a browser game.

Run:

```bash
python3 tools/validate_spec.py
```

Completed checks:

- All ten petitions and thirty base outcomes reference valid visitors, votives, remnants, and aspects.
- Every outcome has all three aspect interpretations: ninety authored interpretation strings.
- All 720 recipe/aspect/catalyst combinations resolve deterministically without mutating the input.
- Resource bounds and inventory consumption/reward counts hold in those reference cases.
- Specific checks cover the Trust cap, ignored-petition ordering, negative Mirror results, Shadow protection, aspect timing, ties, and finale exclusions.
- All six ending categories have saved legal route witnesses.
- Every witness has been replayed independently with its actual acquired/consumed/discarded inventory.
- Additional deliberate Listening and Merciful routes reach A Quiet Dawn; sampled Possessive routes can also succeed.

The evidence is in `reference/validation-witnesses.json`. It includes every choice, explicit discards, intermediate values, and finale decisions.

These results do **not** establish:

- That the future browser implementation has passed.
- That the game is balanced, difficult, or enjoyable.
- A human win rate or replay rate.
- That production artwork has been generated.
- That the seed-generation implementation matches a particular library.
- That every possible five-day route has been enumerated.

The route sampler stops once it has the required witnesses. Finding multiple endings in a small sample is a reachability check, not an evaluation of difficulty.

## A reproducible first success

Use guided seed `FIRST-EMBER`, Listening opening.

This route is useful for implementation acceptance. Do not display it to new players as the recommended optimal strategy.

| Day | Petition | Votive | Consumable | Purpose |
|---|---|---|---|---|
| 1 | The Empty Granary | Chain | Wedding Ring | Begin protecting the village while balancing the first lessons |
| 2 | A Bell Nobody Hears | Chain | Guardian's Tear | Reuse a remnant to strengthen the warning system |
| 3 | The Broken Wall | Chain | Guardian's Tear | Build sufficient Defence while keeping lessons balanced |
| 4 | Refugees at the Gate | Chain | Guardian's Tear | Recover community Trust |
| 5 | Tomorrow's Names | Chain | Guardian's Tear | Preserve the community and obtain a final Forgotten Name |

If inventory overflows, follow the exact discards in the `balanced_guardians` witness. Keep the next Guardian's Tear and the final Forgotten Name.

Finale:

1. Stand at our gate + Forgotten Name.
2. Let our people choose.
3. Let it sleep.

Expected: A Quiet Dawn, with a Listening god. Consult the witness for exact final numbers and item history.

A second named route, `merciful_boundaries`, begins with growing grain and curing the orchard, uses a Mirror to establish Mercy, then deliberately binds defences while using gentle catalysts. It also succeeds. This checks that Mercy is not mechanically doomed.

## First browser acceptance session

Do this before inviting players:

1. Start from cleared local data.
2. Complete the first ritual without opening developer tools.
3. Explain the preview aloud and compare it with the result.
4. Refresh during the aftermath. Confirm the state is unchanged.
5. Use the acquired remnant in a second ritual.
6. Inspect the god. Confirm the displayed lesson history matches both offerings.
7. Reach inventory overflow and intentionally change which item is discarded.
8. Complete five days.
9. Refresh after the first finale choice. Confirm it cannot be repeated.
10. Reach an ending and open the chronicle.
11. Begin a new seed. Confirm discoveries survive and the old run does not.
12. Repeat one ritual using keyboard only and one in a narrow viewport.

Record browser/version, viewport, result, and any observed error. Do not count a passing build as this session.

## Human playtest protocol

Give the player only this introduction:

> “An army arrives in five days. Feed the statue to answer prayers and teach it what protection means.”

Allow them to use the in-game tutorial. Avoid explaining a recipe before they choose it.

Observe:

- First input hesitation.
- Whether they understand the difference between daily votives and consumables.
- Whether they inspect the other visitor.
- Whether the exact preview helps planning or removes too much suspense.
- Whether they notice the old aspect is used before the new lesson is applied.
- Whether they reuse a remnant on purpose.
- Whether the final thresholds feel visible and fair.

Ask afterward:

1. “What did your god learn from you?”
2. “Which offering mattered most?”
3. “Did an unexpected result give you a useful idea?”
4. “Was there a choice you felt you always had to make?”
5. “What would you try on another run?”

Do not ask only whether they liked the art. The art needs to invite play, and the rules need to sustain it.

## Risks to watch

### The game becomes simple arithmetic

Exact previews are intentional for fairness, but players may focus entirely on the resource target. Watch whether the narrative, remnant reuse, and trait shifts give them distinct plans.

If everything feels like a sum, first improve the perceptible consequences and give individual recipes clearer tradeoffs. Do not hide outcomes behind random failure chances.

### Strong remnants crowd out normal catalysts

Guardian's Tear is often stronger than Ring or Bell in immediate stats. That is acceptable as an earned payoff, but their different lessons, availability, and source methods must still matter.

Do not claim every item is equally strong. Check whether players choose among available remnants for a reason.

### Chain + Tear is too reliable

The balanced route proves the game can be won, and may also reveal a dominant strategy. Test whether players discover it immediately and then stop experimenting.

If necessary, tune a few base outcomes or change one reward source in a new content version. Avoid adding an extra resource solely to disrupt a good strategy.

### Five days feel too short to know the villagers

The recurring greetings and outcome traces are the first response. Add a few targeted callback lines before increasing the run length.

### The finale overwhelms the prior choices

The finale can change resources significantly. Confirm earlier rituals still constrain the available successful paths. If players can repair every poor run at the end, reduce a finale benefit explicitly and rerun reachability tests.

### Too much production art before the game is tested

The art-proof slice exists to prevent this. Establish the visual bar early, then complete the Day 1/Day 2 feedback loop before finishing all ending paintings.

The final requested build still includes all production assets. The order of work allows early course correction.

## Proposed acceptance decision

Continue expanding only if players can identify a causal chain, use a remnant deliberately, and express a specific second-run plan.

If the game is clear but uninteresting, revisit the offering decisions. If the game is interesting but unclear, revise feedback and tutorial pacing. If neither works, keep the art direction and reconsider the rules before adding content.
