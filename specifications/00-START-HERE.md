# The Last Offering — browser MVP handoff

Working title only; title availability has not been checked.

This package specifies a single-player game, not the earlier multiplayer concept. It is self-contained: a new implementation session should not need the previous conversation.

## What to build

A polished, illustrated browser game about feeding a small god. Five daily rituals teach it Mercy or Dominion. Miracles solve villagers' problems and produce strange leftovers that become future offerings. An army arrives on the sixth dawn. A three-decision awakening tests the god and village the player has created.

**The playable promise:** “I fed it that, so it learned this. Now I can use the consequences.”

The MVP is a complete 15–25 minute run with ten authored petitions, thirty base ritual outcomes, three god aspects, ten offering types, six ending categories, deterministic replay seeds, save/resume, a journal, generated production artwork, animation, and generated sound.

This is a design and implementation specification. The included illustration is a concept reference, not a finished set of game assets. Production assets must be generated during implementation using the included art brief.

## Read order

1. `01-GAME-SPEC.md` — rules, interaction, screens, boundaries, and acceptance criteria.
2. `02-CONTENT.json` — authoritative numbers, item definitions, petitions, outcomes, finale choices, and ending text.
3. `03-ART-AND-AUDIO.md` — style bible, asset list, generation prompts, animation and audio direction.
4. `04-IMPLEMENTATION-SLICES.md` — playable increments, state model, architecture, checks, and final acceptance.
5. `reference/storybook-concept.png` — the visual reference from the brainstorm.
6. `tools/validate_spec.py` — checks the authored data and runs example routes against a reference calculation. It validates the specification, not an implemented browser game.
7. `05-VALIDATION-AND-FIRST-PLAYTEST.md` — completed spec checks, a reproducible first route, and the remaining playtest questions.
8. `reference/asset-plan.json` — machine-readable checklist of all 42 production image roles; each is explicitly marked not generated.

The content file wins if a narrative example conflicts with a number. The game spec wins on scope. The art brief wins on appearance. Resolve actual contradictions explicitly before changing the underlying design.

## Paste this into the new session

> Build the browser game described in the attached “The Last Offering” MVP package. Read all four specifications and the content JSON, and inspect the included concept image. Start by checking the available environment and applicable repository instructions.
>
> Implement the single-player five-day MVP and complete all playable slices in `04-IMPLEMENTATION-SLICES.md`. Use `02-CONTENT.json` as authored content, with deterministic rules and local saves. Make reasonable implementation choices autonomously. Do not expand the scope into multiplayer, combat, village construction, arbitrary AI-generated outcomes, or a management dashboard.
>
> Generate the production art using GPT Image or the available image-generation tool, following `03-ART-AND-AUDIO.md` and referencing the attached concept image. Generate separate, usable game assets: backgrounds, statue forms, characters, offerings, UI decorations, effects, and endings. Do not substitute emoji, unrelated stock images, generic flat icons, or a single flattened screenshot for the playable scene. All original visual and sound assets must be generated as specified; use a suitably licensed readable font.
>
> The concept sheet is a style reference, not runtime artwork. Establish one finished shrine scene early, then maintain that style across the remaining assets. Keep text and controls as real browser UI. Review the actual rendered game at desktop and mobile widths. The result should look and sound like a small finished game.
>
> Deliver a working, tested browser game, the generated assets and their manifest, and a concise handoff. If Sites is available, follow its required workflow and publish privately by default. If hosting is unavailable, finish the runnable local game and explain the exact remaining hosting blocker. Do not stop after a mockup or the first slice.

## Scope that must survive implementation

- One fixed shrine scene. Art and character expressions evolve inside it.
- Five ritual days plus a playable three-step awakening.
- One external threat: an approaching army. No alternate disasters yet.
- Three reusable daily votives; seven consumable catalyst/remnant types.
- Two learning values, Mercy and Dominion; three displayed god aspects.
- Village Trust and Defence, with exact visible numerical effects.
- Leftovers from miracles become functional offerings.
- Three starting configurations and seeded gift variation after the first guided run, without permanent power upgrades.
- A real ending, restart, save/resume, journal, settings, keyboard interaction, and reduced-motion mode.
- Generated art and generated sound integrated into the actual build.

## What counts as a successful first test

Players can explain one consequence of their own ritual without being told. They reuse a strange remnant deliberately. They understand how their god changed. They can complete a run and identify something they want to try differently.

A spectacular screenshot alone does not meet the goal. Neither does a correct rules engine surrounded by placeholder cards.
