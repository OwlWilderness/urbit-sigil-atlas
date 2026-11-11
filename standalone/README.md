# Sigformel — standalone layout3 release 0.1.2

Authentic Urbit glyph catalogue and six-page name workshop. This source preserves the current 0.1.2 standalone runtime inputs, including the layout3 toolbar, HTML and CSS. It is independent of the Hoon-authoritative native edition: do not exchange their JavaScript adapters or authentication code.

## Delivery status

As of November 10, 2026, the owner reports both current editions installed. Retained management readbacks independently record standalone package version 0.1.2, expected `web.sigformel-web.public.dappnode.eth:0.1.2` tag, web service running, MIT, Linux/AMD64, expected private link and no volumes or published host ports. These are retained readbacks, not fresh endpoint health or an engine-digest observation. The public route has prior acceptance; current layout3 served-byte confirmation is not claimed. Repository synchronization does not install or restart anything.

- Dappnode **Open UI**: `http://web.sigformel-web.public.dappnode.private:8088` on the existing private network.
- Separate public hostname: `sigformel.quantumtekh.com`; ingress preserves its literal Host. Public TLS terminates at ingress; origin HTTP does not itself provide TLS.

## Source-only checks

Requirements: Node.js 20+, npm lockfile support and Python 3.9+. Run from this directory:

```sh
npm ci --ignore-scripts
node --test tests/licenses.cjs tests/public-ui.cjs tests/supervisor.cjs
python3 -B tools/package-local.py --source-only
```

`site/` already contains the editable current HTML/CSS and all assets; no unavailable historical page generator is needed. There is no `build:site` script. Native generation is a different package. Source-only export performs no Docker command, upload or install, and includes the current packaging helpers and tests.

## Build an image from source

```sh
docker build --platform linux/amd64 -t web.sigformel-web.public.dappnode.eth:0.1.2 .
python3 -B tools/package-local.py
```

Use a fresh artifacts directory for each export: the builder refuses overwrites. The Dockerfile is the source-build path, with pinned Node base digest, Nginx and Tini versions and locked npm dependencies. Registry/APK availability remains an external requirement. A new source build is not claimed byte-identical to the installed historical Docker-save archive and has not been built during this source synchronization. Full packaging expects the exact tag already built locally and validates the exported archive. Source-only and image exports use the same output name; retain/move the first output before requesting another.

Optional SDK descriptor validation requires a separately installed `@dappnode/dappnodesdk` 0.3.55 and an **absolute** `DAPPNODE_SDK_ROOT`; it is not silently supplied by `npm ci` here:

```sh
DAPPNODE_SDK_ROOT=/absolute/path/to/dappnodesdk node tools/validate-package.mjs .
```

The historical `package-layout3.py` two-file archive-layer derivation is deliberately omitted: it requires a private predecessor image and operational baseline. The Dockerfile builds current HTML/CSS and runtime directly from the included source instead.

## Access and persistence boundary

Literal admitted pairs are private Host `web.sigformel-web.public.dappnode.private:8088` / Origin `http://web.sigformel-web.public.dappnode.private:8088`, and public Host `sigformel.quantumtekh.com` / Origin `https://sigformel.quantumtekh.com`. Unknown, altered, duplicate and cross-paired authorities are refused. No wildcard CORS or forwarded-authority trust. Same-origin stateless JSON compose retains its 8192-byte cap. Shared records and normalized aliases remain unavailable before core/storage dispatch.

Nginx 8088 fronts loopback gateway 8742 and core 8741. Tini/supervisor, worker admission/deadline and limits are retained. Browser preferences/shortlist are local per origin, not synchronized or encrypted. No ship account, credentials, persistent volume or host-port publication is needed. Source Compose includes build; packaged release Compose removes it.

## Licensing and exact source scope

First-party MIT `LICENSE` is byte-identical to served `site/LICENSE.txt`, attributed to Copyright (c) 2026 Sigformel contributors. Each page links to `licenses.html`. Glyph provenance, npm notices and Node/Nginx/Tini notices retain separate scopes/full text; no blanket relicensing or exhaustive legal/base-component audit is claimed.

Executable application inputs, assets, runtime configuration, locked dependencies and deployment descriptors are unchanged from the accepted release. Documentation, portable packaging helpers and package scripts are deliberate source-only corrections; the package-script change makes package.json differ from the historical image, without changing dependencies or application behavior. Operational handoffs, Git history, dependencies, images/archives, evidence, owner state, piers and native metadata are excluded. A source ZIP is not an installable image. No source-sync step changes deployed descriptors, provider configuration, package version, route or live target.
