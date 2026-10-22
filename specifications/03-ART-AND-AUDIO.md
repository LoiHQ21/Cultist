# The Last Offering — generated art and audio production brief

## 1. Required outcome

The browser game should look like an interactive haunted storybook: a composed illustrated scene, tactile offering objects, little villagers with clear personalities, and a god that visibly changes.

The supplied `reference/storybook-concept.png` is the accepted visual direction. It shows three concepts, not three screens to paste into the game. Inspect it at the start of the art pass. Use it as an image reference when generating the first production assets.

**This package contains the reference illustration and production instructions. It does not claim the production assets have already been generated.**

The next implementation session must generate and integrate the art listed below. Preserve source images and generation prompts. If image generation is unavailable, finish the functional slice with explicitly temporary blocks, identify the missing capability, and do not call that an art-complete delivery.

## 2. Style bible

### Visual language

- Flat illustrated 2D with layered cutout depth.
- Hand-inked contours with slight irregularity and varied line weight.
- Muted painterly fills and subtle paper grain.
- Small, expressive, rounded people; believable clothing and recognizable faces.
- Stone with warm grey-brown planes, moss in cracks, and restrained etched marks.
- Gothic fairy-tale village rather than a cathedral or a realistic medieval simulation.
- Unease comes from scale, gestures, and impossible behavior.
- Warm candlelight against cool forest shadows.
- Little gold/mint supernatural accents; they should not overwhelm the natural palette.

### Palette anchors

These are compositing/UI guidance, not a demand that generated paintings use only these colors.

| Role | Color |
|---|---|
| Deep ink | `#25251F` |
| Forest shadow | `#343D35` |
| Moss | `#64704D` |
| Warm stone | `#8B8066` |
| Rust cloth | `#995B43` |
| Ochre light | `#CCA15C` |
| Parchment | `#E7D7AF` |
| Dark parchment text | `#332D25` |
| Mercy accent | `#AFC7A2` |
| Dominion accent | `#B99668` |
| Distant twilight | `#635165` |

### Maintain these characteristics

- Statue occupies a large, unmistakable portion of the composition.
- Its rounded head, sun mark, and dark mouth stay recognizable through every form.
- Painterly edges and tangible materials remain visible at gameplay size.
- The scene has calm negative space for actual UI.
- Item silhouettes read at 48 CSS px.
- Characters look like members of the same small community.

### Avoid

- Photorealism, 3D renders, glossy mobile-game UI.
- Anime faces or chibi proportions that conflict with the reference.
- Neon magic, excessive bloom, generic purple-black horror gradients.
- Highly detailed textures everywhere; the play area must remain legible.
- Copied characters or recognizable symbols from other games.
- Emoji, icon-library replacements for game objects, stock photographs.
- Gibberish lettering, fake game text painted into artwork.
- A generated screenshot used as the background behind invisible click regions.
- An application dashboard of identical rectangular panels.

## 3. Composition and layer order

Build the shrine as separate layers:

1. Background sky/forest/distant village.
2. Optional color/light treatment for dawn/dusk.
3. Statue shadow.
4. Current statue form.
5. Recent miracle traces near the shrine.
6. Current villager and optional waiting visitor.
7. Foreground altar, candle cluster, and hanging bell.
8. Particles, light spill, and offering-flight sprite.
9. Real UI: text, inventory, buttons, counts, focus rings.

DOM/CSS layers are sufficient. A canvas is optional for particles, not required for the whole game.

The statue's mouth is the visual target for the offering animation. Store its normalized anchor per asset in the manifest. Adjust the anchor by visually checking the actual export; do not assume a generated mouth lands on an exact requested pixel.

The primary background should have an empty center where the statue belongs. It must not include a second statue, a baked-in villager, interface cards, or text.

Retain a little irregularity in the scenery. Keep functional controls geometrically reliable.

## 4. Generation workflow

### Step 1 — establish the art direction

Generate:

1. Empty shrine background.
2. Listening statue, transparent.
3. Mara worried, transparent.
4. Chain offering, transparent.
5. Parchment panel texture.

Compose them into a real browser screen immediately. Do not generate the remaining thirty-seven images before checking that these five work together.

Review at 1440×900 and 390×844. Confirm scale, contrast, outline weight, statue mouth position, and readability. If the styles clash, revise the mismatched assets using the accepted pieces as image references.

### Step 2 — create related variants from approved assets

- Reference the approved Listening statue for Merciful and Possessive forms.
- Reference each worried character to generate its relieved expression.
- Reference the approved Chain object and the concept sheet for the other offering objects.
- Reference the approved background and statue forms for awakening and ending illustrations.
- When using local references, inspect them and pass their absolute file paths to the image tool as required by that tool.
- Request actual transparency for isolated sprites. A painted checkerboard is a failed asset.

### Step 3 — export and record

Save originals separately from browser exports.

```text
assets-source/
  images/
  prompts/
public/assets/
  backgrounds/
  statues/
  characters/
  offerings/
  props/
  endings/
  ui/
  audio/
  manifest.json
```

Use the image-generation tool for creation and visual editing, including removal of unwanted baked-in elements. Use ordinary export tools only for file conversion, compression, or packaging as allowed in the implementation environment.

Each required sprite must be a separate usable file. A labeled contact sheet is useful for review but is not a replacement for individual sprites. Avoid relying on generated grids for precise sprite extraction.

### Step 4 — asset QA

For every accepted asset:

- Correct subject and number of objects.
- Matching line weight, texture, palette, and lighting direction.
- No accidental text, signature, watermark, or unwanted backdrop.
- No clipped fingers, feet, ornaments, or essential silhouettes.
- No halos around transparent edges at gameplay scale.
- Transparent images have actual alpha.
- Clearly readable as a thumbnail in its intended context.
- Sprite pivots and anchors recorded.
- Prompt, references, source path, export path, and acceptance status recorded.

Do not silently accept inconsistent assets just to fill the manifest.

## 5. Runtime image inventory

The full MVP requires **42 image assets**. An implementation may add small technical variants, but must not omit the listed visual roles.

Dimensions below are desired working/export sizes. Generate at a supported size and retain enough resolution for the intended use. Browser exports may be smaller than originals.

| IDs | Count | Desired working size | Alpha | Purpose |
|---|---:|---|---|---|
| `bg_shrine` | 1 | 1920×1080 landscape | No | Main scene and title |
| `fg_altar` | 1 | 1600×500 wide | Yes | Separate foreground surface |
| `statue_listening`, `statue_merciful`, `statue_possessive` | 3 | 1024×1536 portrait | Yes | God forms; consistent ground pivot |
| Six visitors × `worried`, `relieved` | 12 | 768×1024 portrait | Yes | Full-body characters; face reused in portrait UI |
| Three votives + seven consumables | 10 | 512×512 square | Yes | Offering shelf, tray, animation |
| `trace_guardian`, `trace_grain`, `trace_shadow`, `trace_names` | 4 | 768×768 square | Yes | Persistent signs of miracles |
| Three `awakening_*` aspect scenes | 3 | 1920×1080 landscape | No | Finale scene |
| `ending_quiet`, `ending_guarded`, `ending_desolate` | 3 | 1920×1080 landscape | No | Ending tableaux |
| `ui_parchment`, `ui_wood`, `ui_card` | 3 | 1024×768 / 1024×512 / 512×640 | As appropriate | Tactile UI surfaces |
| `prop_bell`, `prop_candles` | 2 | 512×768 portrait | Yes | Local motion and ritual response |

42 = 1 + 1 + 3 + 12 + 10 + 4 + 3 + 3 + 3 + 2.

Portraits may display the upper portion of the same character sprite through CSS positioning. They do not require another six artworks.

Do not generate text into UI textures. Ordinary text, focus outlines, borders, bars, and basic control geometry are native UI, not missing artwork. Fonts should be suitably licensed and bundled or use a reliable serif fallback. Do not invent unreadable generated letterforms.

## 6. Master image prompt

Prepend this direction to each asset-specific prompt. Attach the approved concept/reference assets rather than asking the model to infer them from the name.

> Original art for “The Last Offering,” a single-player haunted-storybook ritual game. Match the supplied visual reference: hand-inked irregular outlines, painterly muted moss green, terracotta, warm grey stone, ochre candlelight and cream parchment, fine paper grain, flat illustrated 2D with layered cutout depth. Warm and inviting at first glance, quietly unsettling on inspection. Strong readable silhouette, intentional restrained detail, professional cohesive indie-game art. Lighting from warm candles below-left, cool woodland ambient light. No text, no letters, no UI, no watermark, no photorealism, no 3D render, no glossy gradients, no neon, no graphic gore. Preserve clear edges and readable forms at gameplay scale.

When generating a transparent asset, explicitly request `transparent_background: true` in the tool input. A sentence in the prompt is not sufficient if the tool exposes a dedicated transparency option.

## 7. Background and foreground prompts

### `bg_shrine`

> Wide landscape game background, fixed frontal three-quarter view of a small woodland shrine courtyard at dusk. A distant village with steep roofs on the upper right, layered dark trees on the left, a winding path, low stone steps, moss and a few hanging charms. Large empty shrine plinth in the center-right where a separate statue will be composited later. Keep the central area behind the future statue quieter and less detailed. Leave the left foreground open for a full-body visitor and the bottom quarter visually calm for a separate altar and interface. Warm ochre sky against cool moss forest. No statue, no people, no altar table, no interface, no text, no giant foreground obstructions. A composed game scene, not a panoramic landscape full of competing landmarks.

### `fg_altar`

> One low stone offering altar and immediate foreground ledge, frontal view matching the shrine reference. Worn warm-grey stone, restrained carved grooves, a rust-colored cloth draped near one side, an open central tabletop for two separate offering objects. No offerings, no candles, no background, no text. Wide silhouette with clean transparency; allow generous transparent margin around the altar. The top surface should be readable as a place objects can rest.

## 8. Statue prompts and continuity

### Shared design

- Squat ancient stone body and rounded arch-like head.
- Simple sun carving on the forehead; original generic design.
- Heavy eyelids; expressive but not cartoon googly eyes.
- Large dark open mouth, a few worn irregular stone teeth.
- Moss and tiny pale flowers in cracks.
- Rust cloth ornaments near the shoulders.
- A broad stable base.
- Neutral body approximately 1.6 times the on-screen villager height.

### `statue_listening`

> A single small ancient shrine god statue, full body and base, isolated on genuine transparent background. Rounded arch-like stone head, simple etched sun on forehead, heavy curious eyelids, large dark open mouth with a few worn stone teeth, squat reassuring shape, tiny moss patches and sparse pale flowers, rust cloth charms near its shoulders. Almost cute, with a trace of uncertainty. Frontal three-quarter pose matching the supplied shrine scene. No pedestal environment, no candles, no people, no extra objects. Entire silhouette visible with clear margin. This is the master design for all future forms.

### `statue_merciful`

> Edit the supplied master statue into its Merciful form. Preserve exactly the identity, forehead sun, dark mouth placement, view, stone color, base height and main silhouette. More pale flowers bloom around the eyes and shoulders. Add two open stone hands near its sides, palms gently upward, staying within a similar overall bounding box. Expression tender and a little exhausted; thin mint-tinted light in the eyes. Keep the full figure isolated on genuine transparency. Do not add scenery or villagers. It must align with the master at the same base pivot.

### `statue_possessive`

> Edit the supplied master statue into its Possessive form. Preserve identity, forehead sun, dark mouth placement, view, stone texture and base height. Long stone fingers curl inward at the edges of its body, as if enclosing something precious. Eyes narrow with anxious vigilance, roots grip its base, and cloth charms hang more tautly. Ominous affection rather than rage. Keep comparable bounding box and the same ground pivot. Full figure on genuine transparency, no scenery, no people.

A mathematically exact silhouette is not guaranteed by generation. Align exports in layout using recorded bounds and pivots. If a variant changes identity or viewpoint materially, regenerate it.

## 9. Character prompts

Shared prompt:

> One full-body village character for the same haunted-storybook game, isolated on genuine transparency. Small adult with gently stylized rounded proportions, expressive human face, hand-inked clothing folds, practical worn shoes, standing three-quarter view facing right toward a shrine. Warm light from lower right. Clear silhouette, limited fine detail, entire body visible with margin, no scenery, no text. Keep the proportions and outline style of the approved Mara sprite.

Generate the worried version first. Generate the relieved version by editing that approved character, keeping clothing, face identity, accessories, pose scale, viewpoint, and lighting.

| Character | Add to worried prompt | Relieved variant direction |
|---|---|---|
| Mara | Broad silhouette, ochre apron, rolled sleeves, flour on one cheek, tied-back dark hair, clasping a plain bread cloth. Concerned but practical. | Shoulders relax; small tired smile; same bread cloth. |
| Ivo | Tall and narrow, moss coat, knit cap, weathered face, small oar-shaped charm. One hand rubs the other anxiously. | Wry half-smile, more open posture; no new equipment. |
| Ada | Short sturdy elder, rust shawl, silver braid, basket of roots, practical boots. Firm worried expression. | Proud restrained smile; cradles the same basket. |
| Sela | Young adult, indigo cloak, round spectacles, copper bell clasp. Leaning forward to be heard. | Upright, bright attentive expression; mouth relaxed. |
| Bram | Square shoulders, faded brick-red vest, bushy grey brows, stone-dust hands, small tool belt. Weary determination. | Grateful nod and eased brow, same silhouette. |
| Nell | Middle-aged, long cream scarf, plum coat, cropped dark hair, small closed ledger held to chest. Quiet concern. | Thoughtful warmth, ledger held less tightly. |

Use the relieved expression when the ritual's actual Trust delta is positive. Otherwise keep worried. This is an explicit approximation for the MVP, not a facial animation system.

## 10. Offering prompts

Shared prompt:

> A single hand-painted game offering object, centered and isolated on genuine transparent background. Clear bold silhouette, three-quarter view, hand-inked contour, muted tactile materials and fine paper grain. Soft warm light from upper left. Readable at 48 pixels. No label, no border, no card, no other objects, no scenery. Fill approximately 75 percent of the square canvas and retain transparent margin.

Append:

| ID | Subject prompt |
|---|---|
| `chain` | A short votive chain of three heavy worn iron links, gently curved; warm brown-grey metal, no sharp shine. |
| `seed` | A small opened earth-colored paper seed packet holding three plump seeds and one tiny green shoot; no printed markings. |
| `knife` | A short ceremonial iron knife with a dark wood handle and a small rust cloth tie; blunt storybook styling, no blood. |
| `ring` | One old gold wedding ring tilted in space, worn edges, a tiny warm reflection, simple and emotionally precious. |
| `bell` | One little weathered brass handbell with a short wooden handle and a visible dark clapper. |
| `mirror` | One small oval hand mirror in a tarnished bronze frame, glass reflecting an abstract pale crescent, no face. |
| `biting_grain` | A compact wheat head whose open husks reveal tiny ivory teeth; funny and unsettling, recognizable wheat, no gore. |
| `guardian_tear` | A smooth teardrop-shaped piece of warm grey stone with a tiny moss seam and a pale mint glint inside. |
| `loose_shadow` | A curled ribbon of dark charcoal shadow that almost resembles a little seated person; delicate irregular edge, restrained violet rim light. |
| `forgotten_name` | One curled cream paper slip with a warm luminous knot of abstract ink strokes; marks must not resemble readable letters or words. |

The Forgotten Name's actual name, effect, and source are rendered in UI, not inside the painting.

## 11. Miracle traces

These are small remnants left around the shrine, not literal representations of every remote event. Display a caption on interaction linking them to the relevant miracle.

Shared prompt:

> Small environmental vignette for the shrine, isolated on genuine transparency, same ink and paper storybook style. Ground-level composition, no background, no people, no text. Clear as a small decorative object without dominating the statue.

| ID | Subject |
|---|---|
| `trace_guardian` | A little mossy stone hand cupping a single tear-shaped pebble, beside two worn stones. |
| `trace_grain` | A low cluster of strange wheat with a few visibly toothy husks, roots gripping a patch of earth. |
| `trace_shadow` | A dark folded ribbon of shadow resting beside a pale stone, impossible but quiet. |
| `trace_names` | A small flowering twig with cream paper-like petals and warm points of light, no readable writing. |

## 12. Awakening and ending scenes

Use the approved shrine background, character scale, and corresponding statue as references.

### `awakening_listening`

> Wide storybook scene of the same shrine at cold dawn. The Listening god has stood up and grown larger than the nearby village houses, still unmistakably the same rounded stone face with forehead sun and open dark mouth. It looks down toward the shrine keeper's implied position. Small distant army banners on the far-right road, villagers as tiny unobtrusive silhouettes. Leave a calm bottom band for real dialogue UI. Uneasy anticipation. No readable text, no interface.

### `awakening_merciful`

> Same viewpoint and village as the accepted awakening scene. The Merciful god towers over the village with open stone hands and pale flowers around its eyes. Its hands shelter tiny figures on both sides of the road, including approaching soldiers. Mint dawn light, bittersweet tenderness, immense scale. Keep bottom space quiet for dialogue UI. No gore, text or interface.

### `awakening_possessive`

> Same viewpoint and village as the accepted awakening scene. The Possessive god's enormous curled stone hands enclose the village houses, leaving a narrow gate. Distant army banners remain outside. Protective, anxious, unsettling; the god is guarding its loved ones too tightly. Ochre light between fingers against plum-grey dawn. Quiet bottom space for dialogue UI. No text, no interface.

### `ending_quiet`

> Wide peaceful dawn view of the same village and shrine, after the crisis. A quiet old stone shrine partly hidden by flowers in the middle distance, villagers opening shutters and walking between houses, pale warm sunlight, no army, a path continuing over a distant hill. Ambiguous enough to accompany a sleeping god or a god that has departed. Tender and slightly strange. Calm space for an ending title and real UI, no text painted in the image.

### `ending_guarded`

> Wide dawn view of the same village living beneath enormous weathered stone hands at the edges of the composition. Warm windows, small villagers beginning daily work, no active combat. The hands are watchful but their owner's face remains out of frame so the image works with all three learned aspects. Beautiful, protective and a little claustrophobic. Quiet space for title and text, no painted lettering.

### `ending_desolate`

> Wide overcast morning view of the same shrine and village after a difficult outcome. Empty foreground path, dim houses, abandoned baskets, a few small distant figures heading away, cold candles, uncertain banners far beyond the hill. No corpses, fire or graphic destruction. Sorrowful ambiguity suitable for invasion, abandonment, or a divided village. Quiet area for ending UI, no text.

Using three illustrations for six ending categories is an explicit MVP compromise. Distinguish the ending through accurate text, lighting, optional composited banners, and the actual run history. Do not imply all six have bespoke paintings.

## 13. Interface materials and props

### `ui_parchment`

> An empty cream parchment panel for a haunted-storybook game, subtle paper grain, gently irregular aged edges, broad calm center, restrained ink flourishes only at the corners. No writing, symbols, stamps or illustrations. Front view, evenly lit. Edges usable as a scalable frame.

### `ui_wood`

> A wide dark warm wooden shelf face with restrained hand-inked edges, subtle grain and two tiny iron nails near the corners. Front view, simple quiet center, no objects, no writing. A tactile interface backing, not a photorealistic wood photograph.

### `ui_card`

> One blank offering card, warm cream paper on a thin worn dark border, softly irregular corners, subtle handmade grain, simple empty center. Portrait orientation, no text, illustration, numbering or symbols. Genuine transparency outside the card.

### `prop_bell`

> One hanging weathered brass ritual bell with a short section of rope above and below, frontal three-quarter view, same storybook shrine style. Full silhouette with generous margin, isolated on genuine transparency. No support beam, no scenery, no text. Clear top attachment point for a small swinging animation.

### `prop_candles`

> A cluster of three uneven cream beeswax candles on a small worn stone saucer, dripped wax, small warm flames, restrained glow. Same storybook style, isolated on genuine transparency. Full silhouette, no altar or background.

## 14. Animation using the generated assets

No frame-by-frame character walk cycles are needed. The game has no walking avatar.

| Element | Motion | Limits |
|---|---|---|
| Statue | Very slight vertical settling, localized glow, crossfade between forms | No continuous large scaling |
| Villager | Subtle breathing translation, brief expression crossfade | Preserve feet position |
| Ritual bell | Rotate around rope anchor, damped swing | Short, on interaction |
| Offering | Lift, ease toward mouth, reduce scale, fade at mouth anchor | Respect reduced motion |
| Candle | Generated warm light variation plus small flame overlay | No fast flashing |
| Remnant reward | Rise from altar with a short light pulse | Keep text static/readable |
| Particles | Sparse dust/motes with seeded motion | Decorative, never hide controls |
| Dawn | Gentle color treatment and 500 ms transition | No prolonged fade to black |
| Ending | Slow light emergence, optional static particles | No forced cinematic wait |

All particle shapes and glow textures can be procedurally generated in code. Keep them stylistically subordinate to the paintings. This satisfies the generated-asset requirement without using stock effects.

## 15. Generated audio

All original game sound must be generated, with no stock music or sound-library downloads.

The guaranteed MVP path is deterministic procedural audio generated in code and rendered to WAV/OGG where useful. If an authorized music/audio generation tool is available, a generated ambient composition can replace the procedural score after matching the brief. Do not make completion depend on an unavailable external service.

### Music brief

- Quiet, sparse, slightly imperfect music-box/wooden-pluck tones.
- Approximately 60–70 BPM feel, but no driving beat.
- Dorian or pentatonic color, avoiding syrupy fantasy orchestration.
- Low warm drone, soft high overtones, plenty of silence.
- Shrine loop 45–60 seconds with a seamless tail.
- Awakening adds a lower octave and a distant, restrained dissonance.
- Ending variations: warm resolving interval for intact village; unresolved hollow interval for loss.
- No voices or lyrics.

### Sound list

| ID | Sound / generation brief |
|---|---|
| `ui_pick` | Soft paper/wood tap, 50–90 ms |
| `ui_place` | Slightly lower soft tap, 90–130 ms |
| `page_turn` | Filtered noise with quick rise and 200 ms fall |
| `ritual_bell` | Three to five inharmonic sine partials with independent decay, about 1.5 s |
| `stone_breath` | Low filtered noise and gentle resonant movement, 800 ms |
| `offering_take` | Soft cloth flutter into a small dark thump, 500 ms; avoid exaggerated eating |
| `miracle_mercy` | Airy rising interval with a warm tail, 1 s |
| `miracle_dominion` | Low stone resonance with two close upper partials, 1 s |
| `remnant_reveal` | Tiny plucked note and paper rustle, 400 ms |
| `day_turn` | Distant bird-like two-tone call, 600 ms |
| `awakening` | Low three-layer swell with restrained bell overtone, 2.5 s |
| `ending_warm` | Quiet resolved chord, 2 s |
| `ending_cold` | Quiet unresolved chord, 2 s |

Generate noise buffers from a seeded PRNG. Never emit full-volume oscillators. Use gain envelopes and conservative peak levels; avoid clipping. A master limiter or conservative gain staging is sufficient. Mute and separate music/SFX controls must work.

Audio starts only after a user gesture. A blocked audio context must never block gameplay. Resuming a hidden tab should not stack music loops.

## 16. Manifest contract

Every runtime asset entry should contain:

```json
{
  "id": "statue_listening",
  "kind": "image",
  "path": "/assets/statues/statue-listening.webp",
  "sourcePath": "assets-source/images/statue-listening.png",
  "promptPath": "assets-source/prompts/statue-listening.md",
  "references": ["reference/storybook-concept.png"],
  "width": 1024,
  "height": 1536,
  "alpha": true,
  "pivot": {"x": 0.5, "y": 0.96},
  "anchors": {"mouth": {"x": 0.5, "y": 0.48}},
  "generationMethod": "image-generation-tool",
  "status": "accepted"
}
```

Dimensions and anchor values above are examples, not measured values. The implementation must record actual outputs and anchors. For audio include duration, format, generator/prompt reference, and loop metadata.

## 17. Quality and performance gates

- Initial scene payload target: at most 4 MB compressed, excluding later endings.
- Full image payload target: at most 20 MB compressed.
- Lazy-load endings and later visitors; preload tomorrow's two visitors during idle time.
- Use appropriately sized browser exports rather than shipping every giant source image.
- Preload every asset required before starting the unskippable part of a transition; ideally no transition is unskippable.
- Reserve image dimensions to avoid layout jumps.
- Prefer opacity/transform animation over layout recalculation.
- No missing-image symbols or asset flashes in a full run.
- Test on a modest laptop and mobile viewport; record actual measurements if available.

These are targets to measure, not claims that the unbuilt game already meets them.

## 18. Art-complete definition

The game is art-complete for the MVP when all 42 roles have accepted generated assets, all required sounds exist, all phases use the correct assets, and the rendered scene visibly follows the reference.

Take review screenshots of title, first petition, populated ritual tray, remnant reveal, each god aspect, awakening, at least one success ending, one loss ending, and a narrow-screen state.

Review those screenshots visually. Fix clipped sprites, unreadable textures, conflicting styles, awkward overlaps, and overly tiny controls. Automated checks alone cannot judge this.
