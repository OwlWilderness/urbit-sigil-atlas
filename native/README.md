# Sigformel

*sig · for · mel* — an Urbit glyph atlas and planet-name workshop.

Browse all 256 prefix and 256 suffix glyphs, compare their shapes, collect a shortlist, and assemble four-syllable planet-name searches. The artwork consists of authentic `@urbit/sigil-js@2.2.0` SVG fragments, not approximations: 512 glyphs in detailed and silhouette variants, with hashes and the original notice in `site/provenance.json` and `site/GLYPH-LICENSE.txt`.

> **Current layout3 native source.** Native desk/agent is **`sigformel`**, route `/apps/sigformel/`, app metadata version remains 0.1.1. The owner reports the current complete frontend glob installed. This is owner-reported delivery, not independent served-byte verification. The accepted R1 durability correction and Kelvin 408 source are retained. First-party code is MIT; third-party scopes are separate. See [status](docs/STATUS.md).

The separate standalone website at `sigformel.quantumtekh.com` has retained public-route acceptance; its 0.1.2 layout3 package has retained installed version/tag/running readbacks. This native source does not reproduce that Node/Nginx edition. Neither retained observation is a fresh current endpoint check.

## Native where it matters

Hoon is authoritative for canonical `@p` validation, classification, numeric spawning ancestry, exact/shape predicates, Boolean matching, totals, ordering and pagination. Gall stores validated preferences, shortlist entries and confirmed composition records. Browser JavaScript handles presentation, dragging, transient text drafts and same-origin Eyre transport; it does not enumerate candidates or decide identity validity. No Node backend is needed on the installing ship.

The app uses your existing authenticated ship session through bundled official `@urbit/http-api` 2.3.0. Gall also checks same-ship request authority. Artwork is a disclosed presentation fallback: a compatible native SVG renderer was not verified. No CDN, external identity service, wallet or spawning operation is required.

**A matching name proves neither ownership, current sponsorship nor spawn availability.** Star filtering uses numeric spawning ancestry, not a live ownership or sponsorship lookup. The hosting ship is not an implicit filter.

## Using the workshop

- Browse All glyphs, Prefixes or Suffixes; filter the catalogue by syllable, type and shape. Catalogue filtering is separate from the candidate query.
- Favorite glyphs to build a shortlist. Native writes distinguish desired and confirmed state; a failed write remains explicitly unsaved and retryable. Unconfirmed drafts recover in the same tab through sessionStorage, scoped by origin, agent and verified ship; this is not cross-tab/device persistence.
- Drag copies from the palette into the four slots. Choose exact syllable or shape-family matching; eye toggles omit predicates without deleting the draft. Invalid drafts stay editable rather than being silently repaired.
- Each row combines its own pair with AND/OR. The middle AND/OR uses fixed positions; **AND ↕ / OR ↕** allows each intact row pair in either physical half. An AND pair is never split across halves. Empty predicates/rows are omitted; overlapping patterns need not occupy distinct halves.
- Leave Star empty for global search, or enter a canonical star with or without one leading `~`. Placeholder text is not a default and spelling is not corrected. The optional star constrains the whole expression.
- Refresh matches to request results. Clear selected/all and trash controls have distinct scopes. Copy, Validate preview and Save composition buttons are intentionally hidden. On very narrow screens, scroll the composition row horizontally to reach its filter panel.

## Search bounds

Global queries count and unrank finite syllable truth categories rather than enumerating the planet namespace. A selected star visits at most 65,535 descendants in events of at most 1,024 points (at most 64 events). Four transient search jobs are retained; abandoned jobs may be evicted. Pages are capped at 100 results. These are algorithmic bounds, not a latency SLA: star searches may take several seconds. Global ordering is lexical; selected-star ordering is numeric. Canonical exclusions, deduplication and pagination are native-owned.

Preferences/shortlist and records are durable native state; transient jobs clear on load. The native agent caps favorites at 512 and confirmed compositions at 256, and migrates saved format `%1` to `%2`. Original local-server private data is not imported.

## Build from source

Requirements: Node.js **20 or newer**, npm with lockfile support, and Python **3.9 or newer**. Native runtime compatibility is **`%zuse 408` only**; prior disposable qualification used Vere 4.6. Other Kelvins are not claimed supported. Node/npm/Python are frontend build tools, not ship services.

```sh
npm ci --ignore-scripts
npm run build:native
python3 -B tools/public-export.py check
python3 -B tools/license-payload-test.py
python3 -B tools/sigformel-identity-test.py
node tools/r1-preferences.cjs
```

The build consumes the checked-in `site/` presentation, `native/frontend/native.js`, locked HTTP client and dependency notices. It writes the complete `native/public/` tree and `native/frontend-manifest.json`, preserving all 1,024 SVG bytes and both CSS files. These outputs are generated and excluded from the source export. Do not use `build:site` from the predecessor: its historical generator/reference/test closure is intentionally not part of this public preparation.

The public source includes a sanitized, **non-installable metadata template** instead of owner-bound `desk.docket-0`; replace `PUBLISHER_SHIP` only in a separately reviewed staging copy. Target-bound runtime archives are excluded; their accepted 17-file desk is not replaced by this template. A successful frontend build is not a native compile/install or permission to publish. [Installation](docs/INSTALL.md) describes the gated operator steps; [public preparation](docs/PUBLIC-PREPARATION.md) explains export and checks.

## Source layout

| Path | Role |
|---|---|
| `native/desk/` | Hoon agent/library, compatible support files and Kelvin declaration |
| `native/frontend/` | Browser/native adapter (accepted R1 desired/confirmed recovery) |
| `native/upstream/` | Retained platform reference sources; content inventory, not a proven import revision |
| `site/`, `data/` | Presentation inputs, authentic artwork, provenance and glyph metadata |
| `tools/build-native.py` | Frontend adaptation, bundling and byte-preservation checks |
| `tools/public-export.py`, `public-export.json` | Explicit export allowlist and validation |

## Contributing, security and licensing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [the license inventory](LICENSE-STATUS.md). First-party code and docs use the standard [MIT license](LICENSE), attributed to **Copyright (c) 2026 Sigformel contributors** as a collective label, not ownership verification. Existing author credits and third-party notices remain in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt), with exact scopes in LICENSE-STATUS.md. No blanket relicensing, trademark grant or legal clearance is claimed. This native-only source export rebuilds the native frontend; it does **not** reproduce or package the separately built standalone website.
