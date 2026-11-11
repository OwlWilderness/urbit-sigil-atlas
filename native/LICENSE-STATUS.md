# License scope and provenance

## First-party MIT

The owner selected standard MIT for first-party Sigformel code and documentation. The complete grant is in `LICENSE`. Attribution is **Copyright (c) 2026 Sigformel contributors**, a collective project label, not verification of legal ownership or an invented legal name. Existing identified author and component credits remain intact. No Source Seppuku terms apply.

First-party scope includes the project-specific agent/library (`native/desk/app/sigformel.hoon`, `native/desk/lib/sigil-atlas.hoon`), native browser adapter, original presentation/controllers, build/export/test tooling and documentation, only to the extent the contributors hold the relevant rights. This is not a blanket relicensing of third-party content, artwork, trademarks or platform source. MIT supplies no trademark grant or ownership/availability assurance.

## Third-party scopes

- Authentic SVG fragments: `site/assets/glyphs/`, `site/provenance.json`, original `site/GLYPH-LICENSE.txt` (2019 Tlon MIT), all 1,024 hashes preserved.
- Imported native support in `native/desk/lib/` other than the project library, `native/desk/mar/`, `native/desk/sur/`, and retained `native/upstream/`: original Urbit/Arvo MIT notices in `native/URBIT-LICENSE.txt` and `native/ARVO-LICENSE.txt`. `third-party-source.json` binds exact reference bytes and desk copies. Original import revisions/events remain unestablished; content parity is not historical provenance proof.
- Locked JavaScript packages, including urbit-ob and dependencies: full notices retained in `THIRD-PARTY-NOTICES.txt`. Browser HTTP client bundle embeds its own dependency snapshot; see `third-party-packages.json` for evidence and limits. Installed dependencies are not exported. Playwright testing-tool notices remain separate and are not an application license grant.

The app serves byte-identical copies of this scope document, `LICENSE` and `THIRD-PARTY-NOTICES.txt`, linked through `licenses.html`. `NATIVE-NOTICES.txt` also retains the accepted complete Urbit/Arvo and dependency texts. Engineering checks are not legal clearance or a complete rights-chain audit.
