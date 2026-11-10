# Either-half row-pair search contract

## Owner confirmation
Owner accepted the current adjacent/equal panel layout and requested: “now the middle and/or should also allow pairs to be on top or bottom”. Clarification confirmed: “Yes—allow either pair in either half”. Example: rad + dev may match ~raddev-______ OR ~______-raddev regardless of which input row contains that pair.

## API and logic
- Add optional `pairPlacement=fixed|either`, accepted ONLY alongside explicit `grouping=rows`. Omitted means `fixed` and preserves existing rows and legacy queries exactly. Unknown/empty/duplicate values or placement without rows return400.
- Inputs p0/p1 and shape0/shape1 define the first prefix/suffix pattern; p2/p3 and shape2/shape3 define the second. Within-pattern joins remain join1 and join3; the middle is join2. Moving a pattern never swaps prefix and suffix or splits its two predicates between physical rows.
- Fixed placement: existing `(pattern0 at top) join2 (pattern1 at bottom)`.
- Either placement: `M0=(pattern0 at top OR pattern0 at bottom)` and `M1=(pattern1 at top OR pattern1 at bottom)`; combine M0 join2 M1. Each pattern's internal AND/OR stays intact. Both patterns may be satisfied by the same half when their predicates overlap: no hidden distinct-placement requirement.
- Empty/ignored leaves and wholly empty patterns are absent, not Boolean true. A single pattern can search either half without a dangling middle join. All empty is unconstrained. A selected star constrains the whole expression. Preserve canonical short-name exclusion, deduplication, stable pagination/order and truthful availabilityChecked:false.
- Reuse bounded DNF/suffix counting; never enumerate the global planet namespace. Moving patterns can require up to8 occurrence bits. Do not reuse a4-bit memo key or the positional Cartesian fast path for a non-positional expression.

## Compact middle control, unchanged layout
- Keep the EXISTING middle native select, same location and geometry, with options `AND`, `OR`, `AND ↕`, `OR ↕`. Fixed options retain exact old values `and`, `or`; new option values `and-either`, `or-either`.
- Explain ↕ through title/accessible wording as searching each pair in either half, not moving artwork. No new panel, prose block, duplicate mini-map or layout change. Keep current CSS, HTML, template and builder byte-identical if options can be added once at runtime.
- Keep rowJoins as3 strict and/or values. Persist the separate flag as validated `sigil-atlas:pairPlacement` (`fixed` default, `either` opt-in); do not reinterpret old storage. Emit pairPlacement=either only when selected. Centre select must remain usable with ONE nonempty pattern so its placement can be changed; disable it only when no pattern exists. Emit join2 only with both patterns.
- Retain all values, invalid drafts, enabled eyes, exact/shape mode, source-preserving native COPY drag, select/clear behavior, hidden Copy buttons, star filtering and save/validation authority. Changing placement changes candidate search only, never physically shuffles slots.

## Bounded acceptance
- Retain old tests/evidence; add focused backend tests for default compatibility, strict validation, single pattern top/bottom, two-pattern AND/OR, internal OR staying within one physical half, overlapping patterns, shapes, empty/ignored patterns, star scope, canonical zero-high-word exclusion, deduplication and pagination. Use independent oracles/finite selected-star enumeration, not the implementation as its own oracle.
- UI proof: four middle options, single-pattern enabled centre, strict separate persistence/reload, unchanged legacy joins, exact/shape params and AND/OR behavior, actual native interactions, no JS exceptions. A still-old live API can prove emission only; actual successful results require parent runtime cutover/integration.
- Re-run the focused existing geometry child on current JS, with current unchanged CSS: equal adjacent panels at preview widths, row-only narrow scrolling. Do not re-open the historical campaign.
- Parent integrates the qualified backend, proves actual fixed-vs-either counts/results and single-pattern UI with a real browser, reloads the existing preview without clearing preferences, and refreshes verified delivery archives. No public deployment, DNS, wallet, spawn, chain, installs, Git publication or user-data resets.
