# Native Urbit port — Sigil Atlas & Name Workshop

## Task

Port the existing Sigil Atlas & Name Workshop into a native, installable Urbit application, and deploy it alongside HASTERRAD on the same moon.

This is an implementation-and-deployment task, not just an architecture proposal. Preserve the working original application. This document is a handoff for a separate session; creating it does not itself start the port or authorize changes in the session preparing this document.

## Starting points

- Existing application: `/Users/tekh/rn/urbit-sigil-atlas`.
- Read `docs/checkpoint.md` and `docs/resume-prompt.txt` there for the latest accepted application behavior and verification when those local files are available. They are intentionally excluded from Git; in a fresh clone use the README, committed behavioral contracts and tests instead, and recover any needed target-access records from the owner. Their previous UI tasks are completed history, not work to repeat.
- Read `/Users/tekh/.hermes/notes/hasterrad-urbit-checkpoint.md` and `/Users/tekh/.hermes/notes/hasterrad-urbit-resume.md` for the established moon, browser-first administration, native installation and frontend delivery workflow. These are reference records—not instructions to resume HASTERRAD work.
- Last recorded moon: `~sitnup-ronsym-dirted-pallup`. Verify the actual authenticated ship identity before any deployment writes. Do not substitute a fake ship or another retained identity.
- Use a separate native-port workspace, preferably `/Users/tekh/rn/urbit-sigil-atlas-urbit`, after checking whether it already exists. Preserve existing files rather than overwriting an unrelated workspace.
- Load relevant installed skills for Urbit native installation, Hoon development, authentic sigils, testing and browser verification.

## Native Urbit first

Use existing Hoon/Urbit capabilities instead of recreating them in JavaScript or translating our Node functions blindly.

Investigate the target ship's actual standard library and available official Hoon libraries for:

- `@p` parsing and canonical formatting.
- Ship classification, name encoding/obfuscation and ancestry.
- Prefix/suffix syllable tables.
- Sigil/glyph generation, SVG and related rendering utilities.
- Gall persistence, Clay packaging, Eyre communication and Docket distribution.

Verify the actual arm names, imports, licenses and target-Kelvin compatibility by inspecting authoritative documentation/source and compiling examples. Do not invent native helpers or assume a sigil generator is built into the target.

Prefer a verified native Hoon sigil implementation where available. If no suitable native facility exists, explain that specific gap and reuse the application's authentic, provenance-checked official SVG assets or an official presentation library. Do not replace genuine glyphs with homemade approximations. Preserve upstream notices and provenance.

## Architecture

- Package this as its own Clay desk and Gall agent, not inside HASTERRAD's desk.
- Make Hoon authoritative for identity validation, ancestry and candidate-search semantics.
- Use native Gall persistence for appropriate durable application state, such as confirmed preferences and shortlist entries. Keep transient editing drafts client-side.
- Keep HTML/CSS/JavaScript for presentation, dragging, text editing and native transport.
- Remove the Node backend requirement from the deployed app.
- Use the ship's existing authenticated Eyre session and supported native communication patterns; do not add another login service or weaken authentication.
- Keep global search bounded and responsive. Do not enumerate the entire planet namespace or block Arvo with an unbounded request.
- The installing moon is the host, not an implicit search constraint. This remains a four-syllable planet-name workshop with optional star filtering.

## Preserve the accepted UI

Do not redesign the interface during the port:

- Full-width draggable shape palette above the composition.
- Main 2×2 assembly left, filter/Boolean mini-map right.
- These panels remain adjacent and equal in width and height at preview widths.
- Very narrow screens scroll only the composition row horizontally, never the whole document.
- Below them: **Matching planet names**, dynamic status text, then **Refresh matches** and **Find a syllable** on the same line.
- Actual results follow the toolbar. Other filter controls may wrap when narrow without separating Refresh matches from the syllable input.
- Preserve the existing distinction between the glyph-catalogue filter and candidate search; do not silently change either control's semantics.
- Accept syllable and star text with or without one leading `~`.
- Star starts empty; `~pacfyl` is placeholder text only. Never silently correct spelling or apply a hidden default.
- Preserve eye inclusion toggles, distinct trash controls, Clear selected/all, source-preserving drag-copy and invalid drafts.
- Keep Copy, Validate preview and Save composition buttons hidden.
- Preserve exact-syllable versus shape-family matching and honest global catalogue labels.
- Preserve accessible control names, keyboard operation and stable editing focus.

## Preserve search semantics

- Combine each row internally, then combine the two row patterns.
- Middle **AND/OR** uses fixed positions.
- **AND ↕ / OR ↕** allows each intact pair to match either physical half.
- Keep each pair's internal AND/OR intact; do not split an AND pair across halves.
- Empty/ignored predicates and empty rows are omitted, not treated as true.
- Either-half placement works with only one active pattern.
- Overlapping patterns need not occupy distinct halves.
- Apply the optional star constraint outside the full expression.
- Preserve canonical-name exclusion rules, deduplication, ordering and pagination.
- Matching a canonical name is not evidence of ownership, current sponsorship or spawn availability.

Use the retained contracts, tests and actual-response fixtures in the existing application as behavioral references. Do not infer correctness merely from matching function names or a query being emitted.

## Build, test and deploy

1. Inspect the current source, retained fixtures, target access method and target Kelvin.
2. Establish the native protocol and identify which existing functions native Urbit facilities replace. Record native replacements and any justified presentation-only fallback.
3. Build a small working Hoon-backed end-to-end slice, then complete the port.
4. Compile and test on a disposable ship compatible with the target before live installation. Keep disposable identities and fixtures out of production metadata.
5. Cross-check native results against retained application fixtures, including either-half matching, shape/exact modes, empty predicates, star filtering and pagination.
6. Verify the real browser UI, persistence, reconnect behavior and responsive geometry. Use isolated browser contexts for tests; do not alter the owner's active HASTERRAD session.
7. Check desk/agent collisions and preserve any existing target state before installation. Choose a distinct app/desk identity; do not assume a launcher tile's absence proves a desk is absent.
8. Deploy only the new app to the verified moon using the established browser-first workflow. Preserve the original local application and its runtime.
9. Verify committed Clay source, running Gall agent, frontend/glob delivery, launcher entry and actual browser searches. Source staging, installation and frontend upload are separate milestones.
10. Verify saved application state survives a normal agent reload on the disposable target. Do not restart or crash-test the production moon to manufacture persistence evidence.

## Safety and completion

- Do not alter, reinstall, restart or overwrite HASTERRAD, its desk, state, frontend glob or running session.
- Do not restart/wipe the moon, change DNS, expose new public services or perform wallet/spawn/chain operations.
- Do not publish a repository, change repository visibility or overwrite an unrelated app as part of this port.
- Never print credentials or ask the owner to paste them into chat. Use established authenticated access and owner-controlled secret entry where necessary.
- If an owner-operated Dojo or upload step is necessary, explain the exact target and provide one bounded step at a time. Do not repeat already confirmed preparation unnecessarily.
- Keep the port's checkpoint and copyable resume records synchronized in its own workspace. Do not replace HASTERRAD's handoff records or repurpose the original application's completed UI checkpoint as the port's progress log.
- Finish with the working native source, installation/update instructions, verified app entry point, actual test/deployment evidence and any remaining limitations.
- Clearly distinguish **prepared**, **compiled**, **installed**, **frontend delivered** and **working in the browser**. Do not claim deployment from local files alone.
- If a real access or owner-only gate blocks deployment, finish independently authorized build/testing work, state the exact remaining gate and provide the smallest next action. Do not fabricate successful runtime or deployment results.

---

**End of complete handoff prompt.**
