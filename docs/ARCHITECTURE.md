# Implementation notes

`rules.js` is pure: no clock, DOM, storage, sound or global randomness. `createRun` initializes gift values with UTF-8 FNV-1a and the first Mulberry32 sample keyed by `seed:petition:gift:v1`; fixed guided gifts bypass the generator. Values are stored in the run.

The reducer enforces phase, day and instance identity, not just button disabling. A ritual preview and commit call the same calculation. Mirror repeats the base (including negative values) and votive lesson only; Shadow protects the combined ritual Trust delta only. Stats clamp before the separate unanswered penalty. The old aspect applies before lessons. Ties retain the previous aspect once the threshold is met.

A committed ritual records the input aspect, base, catalyst and aspect contributions, requested/actual deltas, resource snapshots, lessons, ignored prayer, awarded item and authored interpretation. The reward is already owned when “Take the remnant” dismisses presentation. Overflow is a saved phase; the Keep action requires exactly five distinct owned IDs. Finale actions carry their originating phase so a repeated click cannot commit the next step accidentally.

Audio uses generated Ogg files and a single loop object. It starts after a gesture, pauses for hidden tabs, and catches autoplay/decode failures without interrupting gameplay. Motion is CSS with a short reduced-motion alternative. Music does not influence deterministic state.

The interface uses separate generated background, statue, visitors, foreground, traces, offerings and props. Text is DOM text. The responsive layout uses natural document scrolling. A modal traps keyboard focus and makes the underlying header/main/footer inert. Native buttons preserve keyboard equivalents for drag operations.

Future content changes must version `content/game.json` and explicitly decide migration. The current implementation rejects incompatible saves, preserving separately stored discoveries when possible. There is no telemetry or external save service.
