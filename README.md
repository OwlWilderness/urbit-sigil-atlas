# Sigil Atlas & Name Workshop

A domain-neutral, static Urbit glyph atlas with a separate local API. All 256 prefixes and 256 suffixes use authentic, provenance-checked SVG glyphs from `@urbit/sigil-js` 2.2.0.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm start
```

Open `http://127.0.0.1:8741/`. The server serves `site/` plus `/api/v1/` from one origin. It defaults to loopback, not the public internet. No wallet, keys, chain connection or Urbit ship connection is required.

## Website

- Persistent header and footer navigation on all six pages: all glyphs, prefixes, suffixes, shortlist, workshop and API reference.
- Grouped by base shape, with shape navigation, text/wildcard search, and type filters.
- Glyph inspector with full/detail-free artwork, previous/next, arrow keys, Escape and focus return.
- Browser-local glyph shortlist.
- Workshop has a separate full-width draggable-shape panel across the top, a native 2×2 assembly left and an equally sized filter card right, then Matching planet names and its status, followed by a shared Refresh matches / Find a syllable toolbar and results. The two panels stay beside one another across preview widths; very narrow screens scroll only that row horizontally rather than stacking it. The redundant shape sidebar is removed only from Workshop.
- Drag a shape or glyph into boxes 1–4, or drag-copy between compatible boxes without removing the source. Artwork clicks select only; Copy buttons are hidden.
- Compact syllable textboxes and icon-only native search checkboxes sit side-by-side outside the artwork borders. `zod` is placeholder text only, never a default value.
- Text entry accepts one optional leading `~` in syllables and catalogue search. The star input accepts `pacfyl` or `~pacfyl`, starts empty with `~pacfyl` as placeholder only, and never silently corrects spelling. An empty selected star requests input instead of applying a default. Validate preview and Save composition buttons are hidden; Refresh matches remains available.
- Open eye includes a position in search; crossed-out eye ignores it while keeping the value visible. Values and checkbox choices survive reload.
- One compact mini 2×2 shows each glyph once. Top and bottom AND/OR controls combine each row. The middle control offers **AND / OR** for fixed positions, plus **AND ↕ / OR ↕** to let each pair match either half without moving the artwork. Placement works with a single pair too and persists separately from the operators. Empty/ignored cells stay dimmed and their predicates are omitted; legacy linear settings remain untouched.
- Distinct trash-can controls clear individual boxes. Clear selected follows artwork/input focus; Clear all empties all four without resetting star/mode, operators or checkbox choices.
- Prefixes and Suffixes each show the complete 256-glyph catalogue, explicitly labeled **All stars — no star filter**. Workshop star filtering does not silently filter those tabs.
- Matching names update automatically. Empty boxes are wildcards; shape-family mode includes every compatible glyph variant, while exact-syllable mode matches only the chosen syllables.
- Results initially span all stars. Apply any canonical spawning-star filter afterward, or remove it to restore global results.
- Click/tap alternatives, individual box clearing, native 2×2 preview and paginated results.
- The static catalogue and shortlist work without the backend. API-only actions explain their offline state.

## Name modes

**Free / fun** combines syllables without a star restriction. Canonical-name status and actual parentage are still reported. A noncanonical glyph combination is only visual play, not a valid ship identity.

**Star-filtered** accepts any exact canonical star identifier, not only `~pacfyl`. A final saved name must be a canonical planet belonging to that star's fixed spawning space. Search can use the chosen syllables in their selected positions, including partially filled slots.

**Saving means a local composition record, never spawning a ship.** Parentage is computed with pinned `urbit-ob` 5.0.1. Live ownership, spawn availability and current sponsorship are not checked.

## Backend

See `docs/api.md`, `docs/api-examples/README.md`, and the website's API page. Every endpoint has executable request examples and actual captured responses, including either-half placement and error cases. Specific glyph routes return exact prefix/suffix metadata and original full/silhouette SVG text or raw bytes. `/api/v1/candidates` searches shape families or exact slots globally, with an optional star; `/api/v1/planets` retains the earlier star-only syllable/ending search. Other versioned routes cover health, glyph lists, shapes, compose/validate and saved compositions. Saved API compositions are separate from browser-local glyph favorites. Back up the backend data directory to retain saved compositions.

Do not expose this local service to the internet as-is. Authentication, TLS/reverse-proxy configuration, rate limiting and production operation are separate deployment work. Public hosting and DNS have not been configured.

## Static deployment / offline use

The `site/` directory is a complete static website with relative links and no remote fonts/CDNs. Open `site/index.html` directly, or upload the directory to a static host. No build is needed to view it.

The API is a separate process. A deployed site must route `/api/v1/` to that backend under the same origin for workshop validation, planet queries and saved API compositions. Do not configure wildcard CORS just to connect a public page to a private local service.

Rebuild static HTML after modifying the catalogue or page generator:

```sh
npm run build:site
```

`data/glyphs.json` is the canonical metadata input; the authentic SVGs live in `site/assets/glyphs/`. `site/provenance.json` retains exact source hashes and `site/GLYPH-LICENSE.txt` retains the upstream notice. Do not substitute a newly drawn emblem for an original glyph.

## Repository and native-port handoff

This private repository preserves the working web application and the complete next-session instructions in [`docs/urbit-native-port-prompt.md`](docs/urbit-native-port-prompt.md). The native Urbit port has **not** been implemented or deployed by this source import; progress is tracked in issue #1.

Saved records, dependencies, ZIP exports, local checkpoints and raw browser/runtime evidence are intentionally excluded. Historical browser and packaging verification scripts reference the author's local Hermes/Playwright harness and excluded receipts; they are retained development tooling, not a claim of portable CI. The checked-in site, runtime data, lockfile and server are sufficient for the normal `npm ci` / `npm start` workflow above.

## Scope

The first composition API targets four-syllable **planet** names. It is a base to extend to other Urbit name/object types, not an implementation of every Urbit object class. No on-chain create, spawn, transfer, ownership or transaction endpoint exists.
