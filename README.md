# Sigformel — native and standalone editions

This repository keeps two independently built Sigformel editions together, alongside the preserved original **Sigil Atlas & Name Workshop** application. They share authentic Urbit glyph artwork, but not runtime authority, adapters or installation artifacts.

| Edition | Source and instructions | Execution boundary |
|---|---|---|
| Native Urbit | [`native/README.md`](native/README.md) | Hoon/Gall owns validation, search and durable state; the frontend uses same-origin authenticated Eyre. Desk/agent `sigformel`, route `/apps/sigformel/`, Kelvin 408. |
| Standalone 0.1.2 | [`standalone/README.md`](standalone/README.md) | Independent Node/Nginx/Tini package, current layout3 presentation, private-network and separately configured public access. |
| Original application | Root `package.json`, `server/`, `site/`, `data/`, `tools/` and `tests/` | Preserved predecessor local Node API and static atlas; not the current native or packaged standalone build. |

## Build and check each edition separately

Use Node.js 20+, npm lockfile support and Python 3.9+. Each edition has its own lockfile and source root. Run commands from the indicated directory, not the repository root.

### Native frontend

```sh
cd native
npm ci --ignore-scripts
npm run build:native
python3 -B tools/public-export.py check
python3 -B tools/license-payload-test.py
python3 -B tools/sigformel-identity-test.py
node tools/r1-preferences.cjs
```

The nested `native/native/` directory is intentional: the outer directory is the edition root; its inner `native/desk/` and `native/frontend/` retain the accepted package layout. Generated frontend output belongs to `native/native/public/`. The sanitized metadata template is not installable without separate publisher staging. See [native installation](native/docs/INSTALL.md) and [status](native/docs/STATUS.md). A frontend build is not a Hoon compilation or ship installation.

### Standalone source

```sh
cd standalone
npm ci --ignore-scripts
node --test tests/licenses.cjs tests/public-ui.cjs tests/supervisor.cjs
python3 -B tools/package-local.py --source-only
```

The source-only exporter does not invoke Docker, upload or install anything. [Standalone instructions](standalone/README.md) describe the separate Dockerfile image build, optional SDK prerequisite, packaging and exact access/persistence boundary. Native and standalone JavaScript/authentication adapters must not be exchanged.

## Delivery status and limits

As of November 10, 2026, the owner reports both current layout3 editions installed. Retained management readbacks record standalone 0.1.2 and a running service; the native complete-frontend glob is owner-reported. These statements are not fresh endpoint health, native served-byte verification or a new image qualification. The accepted native R1 recovery correction and independently tested standalone source are included. Source organization and feature-branch publication do not install, restart or reconfigure either edition, change the public route, or alter this repository's private visibility/default branch.

The existing [native-port issue #1](../../issues/1) records the broader implementation/deployment task. Source delivery, installed artifacts and issue acceptance are separate milestones; no issue is considered complete merely because source is published.

## Preserved predecessor application

Existing root application files and their history remain in place. Their original local workflow is:

```sh
npm ci
npm start
```

Open `http://127.0.0.1:8741/`. This root service is the predecessor, not either edition above; it can conflict with another local process using that port. Do not expose it publicly as-is. Its historical native-port design handoff remains in [`docs/urbit-native-port-prompt.md`](docs/urbit-native-port-prompt.md), and API documentation in [`docs/api.md`](docs/api.md). Older root tools/tests may depend on excluded historical workstation receipts; they are retained tooling, not portable CI acceptance for either new edition. Public deployment claims for the standalone edition do not apply to this legacy root service.

## Contributing and licensing

Follow [CONTRIBUTING.md](CONTRIBUTING.md), including real issue references in commits and issue-linked feature branches. Keep editions' build contexts separate. Each edition retains its MIT license, authentic artwork provenance and scoped third-party notices: [native inventory](native/LICENSE-STATUS.md), [native notices](native/THIRD-PARTY-NOTICES.txt), and [standalone license index](standalone/site/licenses.html). These terms do not blanket-relicense the preserved predecessor or third-party components.

Do not publish piers, `.urb`, saved state, `var/`, credentials, `.env`, target-bound native metadata, dependencies, generated artifacts/images/archives, private verification receipts or workstation handoffs.
