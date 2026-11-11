# Public source export boundary

`public-export.json` is an explicit reviewed allowlist. New files require review and manifest changes. The exporter checks source paths, refuses symlinks, scans bounded sensitive-content patterns, verifies 1,024 artwork hashes and content-pinned imported support copies, and verifies byte-exact export readback.

```sh
python3 -B tools/public-export.py check
python3 -B tools/public-export.py export --dest ../sigformel-export-review
```

Destination must be absent. Then run the README build/tests inside that export. Generated frontend and dependencies are not source inputs. The exported source is the native frontend/build/test closure, not a separately built standalone website. The intended standalone hostname remains a plan, not a live verification claim or anonymous Eyre service.

Excluded: Git, dependencies, native runtime/evidence helpers, receipts/screenshots, private state/piers/keys/credentials, owner-bound descriptor, operational handoffs, archives, historical Node server/source API examples and `site/reference/`. A non-installable metadata template remains. This scanner is bounded engineering review, not a complete secret/security/legal audit.

The accepted R1 and `sigformel` identity are integrated. First-party MIT does not replace retained component licenses or prove rights chains. Remote synchronization requires verified repository mapping, a real relevant issue, source/history review and authorized access. This source preparation performs no production write and does not create a new repository or decide visibility.
