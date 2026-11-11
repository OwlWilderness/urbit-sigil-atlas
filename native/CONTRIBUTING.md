# Contributing

This is a local, unpublished Sigformel successor with accepted R1 and final native identity integrated. First-party code is MIT; preserve scoped third-party notices and existing author credits.

## Issues, branches and commits

Every new commit, including docs, must reference a **real relevant issue in the intended repository**. Search existing issues first; discuss scope before implementation. Use `<type>/<issue-number>-<short-description>` for branches (`feat`, `fix`, `docs`, `chore`) and an outcome-oriented commit summary with the actual issue reference. Do not invent issue numbers. The local `chore/source-sync-preparation` branch is uncommitted preparation, not PR-ready. Resolve the established destination and relevant issue before committing; do not create bookkeeping issues merely to satisfy naming.

## Small, verifiable changes

- Keep Hoon authoritative for identity/search/state; keep JavaScript to presentation, drafts and native transport.
- Preserve authentic glyph bytes, provenance and all upstream notices. Do not substitute lookalike art.
- Separate display naming from native identity/storage migration. Do not change the search algorithm/protocol incidentally.
- Use Node 20+, npm and Python 3.9+: run `npm ci --ignore-scripts`, `npm run build:native`, and `python3 -B tools/public-export.py check`.
- Exercise the export in an absent directory: `python3 -B tools/public-export.py export --dest ../sigformel-export-review`. Then install dependencies/build/check from that directory. Generated frontend output is not a native runtime test.
- Include focused regressions for changed behavior and actual command results in a PR. Native changes require compatible disposable-ship acceptance; the private predecessor harness is not a clean-checkout test suite. Never run owner-specific helpers against production.
- Keep receipts, screenshots, piers, secrets and personal paths out of source and issue attachments. Use the PR checklist and explain unverified acceptance honestly.

Do not add hosted CI that pretends private runtime evidence is available. Report security issues using SECURITY.md rather than public exploit details.
