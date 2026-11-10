# Local workshop API

Run `node server/index.cjs` from the project root after installing the root dependencies. Node 20+; native HTTP, no framework. The CLI binds **127.0.0.1**, `PORT=8741` by default. `DATA_DIR` overrides the default project `var/` directory. Import `require('./server/index.cjs').createServer({dataDir, siteDir})` for an unstarted server; the default static root is project `site/`.

This is a **local single-user workshop**, not a public hardened API, wallet, ownership service, spawner or availability checker. Parentage means original spawning star, not current sponsorship. No requests contact Urbit or a blockchain.

## Request safety and errors

- Host must be exactly `127.0.0.1:<actual-port>` or `localhost:<actual-port>` and the peer must be loopback. Do not reverse-proxy or expose this server publicly.
- Every POST requires `Origin: http://<exact-Host>` and `Content-Type: application/json` (optional `; charset=utf-8`). Missing origins and cross-site fetches fail. No CORS headers are emitted.
- JSON bodies are limited to 8,192 bytes. Encoded bodies are unsupported. Unknown fields, query parameters and duplicate query keys fail; identifiers are never trimmed, case-folded or repaired.
- JSON errors are `{ "error": { "code": "INVALID_INPUT", "message": "..." } }`. Statuses: 400 invalid input, 403 unsafe host/origin, 404 unknown route/file, 409 ineligible star save, 413 oversized body, 415 media type, 500 internal/storage error. Internal errors do not expose filesystem paths.
- Static GET/HEAD serves recognized HTML/CSS/JS/JSON/SVG/image/font/text MIME types. No directory listing, dotfiles, traversal or symlink descendants. The root maps to `index.html`. Missing static files return structured JSON 404.

## Endpoints

### `GET /api/v1/health`

`{ok:true, localOnly:true, authority:false}`

### `GET /api/v1/glyphs?kind=prefix&shape=circle&q=rad`

Returns `{items:[{kind,syllable,shape}], total}`. All filters are optional and combined with AND. `kind` is exactly `prefix` or `suffix`; `shape` is an exact atlas shape ID; `q` is a lowercase substring of the syllable, up to 40 letters (empty matches all). The snapshot contains 256 prefixes and 256 suffixes. It is loaded from `server/data/glyphs.json`; original fragment provenance is retained at `server/data/provenance.json`. SVG presentation assets are served separately by the frontend.

### `GET /api/v1/shapes`

Returns `{items:[{id,label}]}` for the 12 distinct atlas shape IDs. IDs retain the source spellings (`circle`, `square`, `leaf-down`, `leaf-up`, `q-tl`, `q-tr`, `q-bl`, `q-br`, `d-left`, `d-top`, `d-right`, `d-bottom`); labels are display strings, not input aliases.

### `GET /api/v1/glyphs/{kind}/{syllable}`

Retrieve one **specific positional glyph**, not a substring search. `kind` must be exactly `prefix` or `suffix`. `syllable` must be an exact three-letter entry in that kind's table. Wrong kind is 400; an absent entry (including a syllable from the wrong positional table) is 404. Uppercase, spaces, percent-encoded aliases and other repairs are not accepted. No query parameters are accepted.

Returns `{kind,syllable,shape,assets:{full,silhouette},svg:{full,silhouette}}`. The asset URLs are `/assets/glyphs/{kind}-{syllable}-default.svg` and `/assets/glyphs/{kind}-{syllable}-none.svg`. The `svg` fields contain the original UTF-8 SVG text, not a regenerated or simplified substitute. The silhouette is the existing `none` asset. Reads occur only after table validation, from the configured `siteDir/assets/glyphs`; missing or symlinked asset descendants are refused. The static asset root is trusted local presentation data, not arbitrary user input.

[Actual metadata request and complete response, including both SVG strings](api-examples/README.md#glyph-prefix-rad).

### `GET /api/v1/glyphs/{kind}/{syllable}/svg?detail=default`

Same exact positional identifier rules as above. `detail` is optional, default `default`; only `default` or `none` is accepted. Unknown or duplicate parameters fail 400, including blank `detail`. Returns HTTP 200 `image/svg+xml; charset=utf-8`, original file bytes, `Content-Length`, and `X-Content-Type-Options: nosniff`. There is no JSON wrapper on successful SVG responses; failures use the standard JSON error envelope.

[Actual full SVG request/response](api-examples/README.md#glyph-rad-default) and [silhouette request/response](api-examples/README.md#glyph-rad-none). Exact captured SVG files are retained beside those examples.

### `POST /api/v1/compose`

Input:

```json
{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~pacfyl"}
```

Requires exactly four valid table slots: prefix, suffix, prefix, suffix. Mode must be explicitly `free` or `star`. Star mode requires an exact canonical star, including `~`. Free mode omits `star` (or supplies null).

Returns HTTP 200:

```json
{"name":"~botmyr-radret","id":"1082103209","kind":"planet","canonical":true,"parent":"~pacfyl","mode":"star","star":"~pacfyl","eligible":true,"syllables":["bot","myr","rad","ret"]}
```

`name` always preserves the chosen slots. `canonical` requires the exact urbit-ob decode/encode roundtrip. Noncanonical combinations have null `id`, `kind`, and `parent`; they are not silently replaced with their canonical roundtrip. Free mode always reports `eligible:true` **for creative saving only**, including noncanonical combinations. Star mode reports eligible only for a canonical planet whose computed `sein(name)` is the supplied star. An otherwise valid preview outside that star returns 200 with `eligible:false`, retaining the original name.

### `POST /api/v1/compositions`

Same input as compose, plus optional `label` (string, at most 120 UTF-16 code units; no control characters). Eligible inputs return HTTP 201 `{item:{...compositionFields,id:<recordUUID>,label,createdAt}}`. `label` defaults to the empty string, `createdAt` is UTC ISO format. **In saved records, `id` is the record UUID, replacing the preview's numeric point ID.** Recompute a point ID from the canonical name if needed. `mode:"free"` identifies creative records explicitly; canonical false is preserved. Star-mode ineligible inputs fail 409 before any storage write.

Storage is lazy: one UUID-named JSON record per save, with private 0700 directory / 0600 files, exclusive temporary JSON creation, file fsync, atomic rename and directory fsync. Existing data directories must already have mode 0700 and have no symlink path components. `dataDir` and `siteDir` must not overlap. Symlink record leaves are refused. Crash-interrupted `.tmp.json` files are ignored rather than auto-deleted on startup. Disk/fsync failures return 500; after a directory-fsync failure a record may already exist, so inspect the list before retrying. Filesystem safety assumes no hostile concurrent local account rewriting directory ancestry.

### `GET /api/v1/compositions`

Returns `{items,total}` from the configured data directory, ordered by createdAt then record UUID. A nonexistent directory returns an empty list without creating it. Reads do not mutate records. No deletion endpoint or other application writes exist.

### `GET /api/v1/planets`

`star` is mandatory. Every exact canonical star is supported, not only `~pacfyl`.

Example:

```
/api/v1/planets?star=~pacfyl&endings=it,yr,oc,ef&minMatches=3&offset=0&limit=50
```

Optional filters, combined with AND:

- `syllables=rad,bot`: each distinct exact syllable must occur somewhere in the four slots. Comma lists have no spaces or empty elements.
- `endings=it,yr,oc,ef`: distinct two-letter ending patterns. A pattern matches `syllable.slice(1)`. Duplicate patterns fail; repeated occurrences in a name do not increase the pattern count.
- `minMatches`: at least this many distinct requested endings. Defaults to all requested endings. If supplied, requires endings and must be in 1..number-of-endings. Thus the three-pattern example is **at least three**, not exactly three (the known pacfyl result is 21 either way).
- `p0`, `p1`, `p2`, `p3`: one exact syllable per supplied slot, validated against the appropriate prefix/suffix table.
- `offset`: nonnegative integer, default 0.
- `limit`: integer 1..100, default 50.

Empty predicates enumerate the catalog. Empty filters supplied as values are invalid. Lists are capped at 16 distinct entries. Unknown endings not represented by a source syllable are invalid. Integer spellings are strict decimal: no signs, whitespace or leading zeros except `0`.

Returns `{star,total,offset,limit,items:[{name,id,syllables,parent}],availabilityChecked:false}`. Numeric point IDs are decimal **strings**. Stable ordering is ascending numeric point ID, not alphabetical. Each catalog exhaustively generates all 65,535 planets and checks canonical roundtrip, class, numeric ID and parentage. An in-memory LRU retains at most two star catalogs per server instance. First lookup is synchronous and can block the local event loop for several seconds; subsequent filters reuse the catalog. No catalog writes occur.

### `GET /api/v1/candidates`

**Matching valid names, not spawn availability.** Drop glyphs into one to four slots, query their base-shape families, and optionally apply a star constraint afterward. Omitting `star` means the **global canonical planet namespace**, never an implicit `~pacfyl` filter. Every returned name is a canonical planet with a validated decode/encode roundtrip and computed original parent. `availabilityChecked` is always `false`; there is no ownership, live sponsorship or availability claim.

Positional predicates are optional. Active slots combine using AND/OR connectors; the optional `star` restricts the **whole** resulting expression:

| Parameter | Meaning/default |
| --- | --- |
| `star` | Exact canonical star including `~`; omitted = global. Blank/null-like strings are invalid. |
| `p0`, `p1`, `p2`, `p3` | Exact syllable at that prefix/suffix/prefix/suffix position. Omitted = no exact predicate. |
| `shape0`, `shape1`, `shape2`, `shape3` | Exact atlas base-family ID at that slot; selects **all** appropriate prefix/suffix glyphs with that shape, not only the dropped syllable. Omitted = no shape predicate. |
| `grouping` | Optional exact `rows`; omitted preserves legacy linear semantics. Every other supplied value, including blank or `linear`, is invalid. |
| `pairPlacement` | Optional `fixed` (default) or `either`, accepted only with explicit `grouping=rows`. Empty, unknown, duplicate values or use without rows return 400. |
| `join1`, `join2`, `join3` | Exactly lowercase `and` or `or`, default `and`; legacy mode: operator **before active zero-based destination slot N**. Row mode: within first pattern / between patterns / within second pattern. |
| `offset` | Nonnegative safe integer, default 0. |
| `limit` | Integer 1..100, default 50. |

**Legacy mode (no `grouping`):** A slot is active only when `pN` or `shapeN` is supplied. Omitted slots contribute **no operand**, not an always-true wildcard operand. Clients must omit empty/disabled boxes and their unused operators; literal blank values remain invalid. A supplied `joinN` requires a predicate-bearing destination N and at least one earlier active slot. Thus `p0=rad&p2=bot&join2=or` means Box 1 prefix `rad` OR Box 3 prefix `bot`, ignoring Box 2. `p2=bot&join2=or`, `p0=rad&join2=and`, `join0`, `join4`, duplicate connectors, uppercase or blank operator values return 400.

**AND binds before OR.** For example `p0=rad&p1=ret&p2=bot&p3=myr&join2=or` means `(p0=rad AND p1=ret) OR (p2=bot AND p3=myr)`. OR is inclusive: a name satisfying both groups appears once. There are no arbitrary parentheses. Default or explicit all-AND queries retain existing behavior. One active slot requires no operator; no predicates and no operators remains unconstrained.

**Opt-in row mode (`grouping=rows`):** combine the top row (slots 0/1) with `join1`, the bottom row (slots 2/3) with `join3`, then combine the two nonempty rows with `join2`: `((A join1 B) join2 (C join3 D))`. Each join defaults to `and`; `or` is inclusive. This is real grouping, not legacy AND-before-OR. For example `grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join3=or` means `(rad at 0 OR ret at 1) AND (bot at 2 OR myr at 3)`. Removing `grouping=rows` means `rad at 0 OR (ret at 1 AND bot at 2) OR myr at 3`, a different result set.

Omitted leaves are removed, not true OR operands. A one-leaf row is that leaf; an empty row and its middle operator are omitted. Both empty rows are unconstrained. Explicit `join1` requires both slots 0 and 1 active; explicit `join3` requires both slots 2 and 3 active; explicit `join2` requires at least one active leaf in each row. Inapplicable supplied joins return 400 even when `and`. Duplicate/unknown grouping or operators and malformed values also return 400. Thus `grouping=rows&p0=rad&p2=bot&join2=or` is valid, but replacing `join2` with `join1` is invalid. Response schema, canonical exclusion, ordering and pagination do not change; selected star still fences the entire expression.

**Either-half patterns (`grouping=rows&pairPlacement=either`):** inputs 0/1 define pattern 0, inputs 2/3 define pattern 1. A pattern retains its prefix/suffix kinds, exact/shape intersections and internal operator (`join1` or `join3`). Let `M0 = (pattern0 at top OR pattern0 at bottom)` and `M1 = (pattern1 at top OR pattern1 at bottom)`; `join2` combines `M0` and `M1`. An internal AND must be satisfied within one physical half, never by splitting its leaves between top and bottom. Both overlapping patterns may match the **same** half; there is no distinct-placement rule. Empty patterns are absent, not true; a single nonempty pattern searches either half without `join2`, and both empty patterns remain unconstrained. Explicit `pairPlacement=fixed` and omission preserve existing row semantics exactly. Placement is not accepted in legacy mode.

For example, `grouping=rows&pairPlacement=either&p0=rad&p1=dev&p2=bot&p3=myr` returns exactly `~botmyr-raddev` and `~raddev-botmyr`; fixed placement returns only `~raddev-botmyr`. A single `p2=rad&p3=dev` with either placement finds the pair in top or bottom. [Seven actual additive captures](api-examples/either-half-README.md), with an independent [manifest](api-examples/either-half-manifest.json), retain these results, overlapping patterns, selected-star scope, zero-word exclusion and an invalid-placement refusal; historical captures are unchanged.

Fixed row groups compile into at most four monotone DNF masks; either placement uses up to eight occurrence bits and at most sixteen masks. Each pattern's internal join compiles before placement alternatives, then the between-pattern join combines them. The same predicate-bit calculation feeds selected-star filtering and global suffix counting. Collision-free tuple memo keys include position, full truth mask and leading-zero-word state. Only positional single-mask queries use the Cartesian fast path; moving patterns always use bounded suffix counting/unranking.

Supplying both `pN` and `shapeN` intersects **within that slot before Boolean evaluation**. Conflicting exact/family predicates make that operand false; another OR group may still match. An all-AND expression containing such a conflict returns zero, never silently broadens to a wildcard. Blank/invalid values, wrong positional syllables, aliases, unknown/duplicate keys and noncanonical stars return 400. Integers use the same strict decimal spelling as `/planets`. Pagination past the end returns an empty `items` array while preserving `total`.

Response: `{star:null|string,total,offset,limit,items:[{name,id,syllables,parent}],availabilityChecked:false}`. Numeric IDs are decimal strings.

- **Global ordering:** ascending lexical syllable tuple `(p0,p1,p2,p3)`, independent of decoded numeric point IDs. Positional all-AND queries retain the direct Cartesian fast path (at most 65,535 leading pairs). Other queries use exact memoized suffix counts over position, at most 16 fixed-placement or 256 either-placement predicate truth masks, and the leading-zero-word state, then lexical unranking. Neither counting nor high/final pagination scans or allocates the four-billion-name universe or concatenates overlapping rectangles.
- **Canonical exclusion:** installed `urbit-ob` `co.js` packs syllable pairs as 16-bit words; `ob.js` confines the reversible planet permutation to `[2^16,2^32)`. A leading `doz,zod` word is zero and decodes to a padded shorter identity, so it is excluded. Unconstrained total is **4,294,901,760 = 2^32 − 2^16**. With fixed placement, `p0=doz&p1=zod` therefore returns zero canonical planets, regardless of the last two slots; with either placement, the `doz,zod` pattern can match the bottom half only. Nonzero leading words, including a zero first prefix byte with a nonzero suffix, remain valid; this is not an exclusion of all `doz` prefixes.
- **Star ordering and scope:** ascending numeric point ID, as in legacy `/planets`. The selected star constrains **all OR branches**, outside the Boolean expression. It is the immutable original spawning-parent relation computed from the identity, not current sponsorship, ownership or live permission/availability to spawn. Filter a verified 65,535-planet catalog; the existing two-entry per-server LRU is shared by both endpoints. A first star lookup can synchronously block the local event loop for several seconds. No catalog or query writes occur. Global and star pages need not share ordering, so reset pagination when changing filters or mode.

Example shape-family search, with two results per page:

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?shape0=circle&shape1=circle&shape2=circle&shape3=circle&limit=2'
```

Actual isolated response:

```json
{"star":null,"total":2432040,"items":[{"name":"~barbet-barbet","id":"4226432403","syllables":["bar","bet","bar","bet"],"parent":"~dasryn"},{"name":"~barbet-bardem","id":"1704439484","syllables":["bar","bet","bar","dem"],"parent":"~hacbyt"}],"offset":0,"limit":2,"availabilityChecked":false}
```

Adding `&star=~pacfyl` to the same four-family combination returns total **29**, not a new interpretation of the dropped glyphs. [Actual selected-star response](api-examples/README.md#candidates-shapes-star). Exact `p0=bot&p1=myr&p2=rad&p3=ret` yields one global candidate, one under `~pacfyl`, zero under `~sampel`; all three responses are retained below.

## Complete executable examples and real responses

[The captured examples](api-examples/README.md) include curl commands, actual request JSON, status/content type and full response JSON for **every API**. SVG responses are linked as original-byte files. [The manifest](api-examples/manifest.json) records exact request paths, captured ephemeral origin, response filenames and SHA-256 hashes. These captures used an isolated server and disposable `dataDir`; saved UUIDs and timestamps are **demo records, not the user's saved records**. Curl commands replay against the default `127.0.0.1:8741` origin; every POST explicitly supplies that Origin and JSON Content-Type. The 403 example intentionally adds `Sec-Fetch-Site: cross-site` while preserving those headers.

| API / scenario | Complete request + response |
| --- | --- |
| Health | [health](api-examples/README.md#health) |
| All shapes | [shapes](api-examples/README.md#shapes) |
| Filtered glyph list (`kind=prefix&q=rad`) | [glyph list](api-examples/README.md#glyph-list-rad) |
| Specific prefix metadata with embedded original SVGs | [specific glyph](api-examples/README.md#glyph-prefix-rad) |
| Raw SVG, default and silhouette | [default](api-examples/README.md#glyph-rad-default), [none](api-examples/README.md#glyph-rad-none) |
| Compose: canonical star, creative free, mismatching star | [star](api-examples/README.md#compose-star), [free](api-examples/README.md#compose-free), [mismatch](api-examples/README.md#compose-mismatch) |
| Save demo compositions and read them back | [star POST](api-examples/README.md#saved-star), [free POST](api-examples/README.md#saved-free), [GET](api-examples/README.md#saved-list) |
| Legacy star-only planets | [planets](api-examples/README.md#planets) |
| Global candidates and next page | [first](api-examples/README.md#candidates-global), [second](api-examples/README.md#candidates-second-page) |
| Shape-family candidates, optional selected star | [global](api-examples/README.md#candidates-shapes), [star](api-examples/README.md#candidates-shapes-star) |
| Exact four slots, global versus two different stars | [global](api-examples/README.md#candidates-exact-global), [pacfyl](api-examples/README.md#candidates-exact-pacfyl), [sampel](api-examples/README.md#candidates-exact-sampel) |
| Mixed global AND/OR, OR under a selected star, dangling-operator 400 | [mixed global](api-examples/README.md#candidates-mixed-global), [OR star](api-examples/README.md#candidates-or-star), [invalid operator](api-examples/README.md#error-dangling-operator) |
| Opt-in row grouping, legacy comparison, selected star, one leaf and row refusals | [rows](api-examples/README.md#candidates-rows-global), [legacy](api-examples/README.md#candidates-rows-legacy-comparison), [star](api-examples/README.md#candidates-rows-star), [one leaf](api-examples/README.md#candidates-rows-one-leaf), [dangling](api-examples/README.md#error-row-dangling-operator), [grouping](api-examples/README.md#error-grouping) |
| 400 invalid shape / blank star / query / exact star | [shape](api-examples/README.md#error-candidate), [blank](api-examples/README.md#error-blank-star), [query](api-examples/README.md#error-query), [compose](api-examples/README.md#error-compose) |
| Specific-glyph errors | [kind 400](api-examples/README.md#error-glyph-kind), [wrong position 404](api-examples/README.md#error-glyph-position), [detail 400](api-examples/README.md#error-glyph-detail) |
| 409 ineligible save, 403 cross-site marker, 400 legacy missing star | [save](api-examples/README.md#error-save-mismatch), [Origin](api-examples/README.md#error-origin), [planets](api-examples/README.md#error-planets-star-required) |

## Focused verification

Run the retained Python runner with a fresh evidence label (labels cannot overwrite an earlier run):

```
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 -B /Users/tekh/rn/urbit-sigil-atlas/server/test/run-row-group.py local-verification api.test.cjs candidates.test.cjs boolean.test.cjs row-group.test.cjs
```

With all four basenames it runs `node --test server/test/api.test.cjs server/test/candidates.test.cjs server/test/boolean.test.cjs server/test/row-group.test.cjs`; omitting basenames preserves the earlier API-only default. It retains exact source snapshots, SHA-256 hashes (including installed `urbit-ob` boundary sources, tested original SVG assets, documentation and captured responses), command/cwd, child exit, stdout and stderr under `server/test-evidence/<label>/`. Tests use disposable owned scratch directories and actual loopback requests. No real user's composition data is loaded. Candidate coverage includes the computed global count, second/overlapping/final/high-offset pages, each of the twelve same-family four-slot combinations plus a mixed combination, exact predicates, two independently enumerated star-filter totals, canonical zero-high-word controls, strict input refusals, and byte/hash equality for both glyph details. Earlier missing-route RED receipts are scaffold failures, not proof that later refusal assertions ran; successful complete runs exercise those assertions. Earlier scaffold failures and harness mistakes remain retained; see `server/test-evidence/README.md` for classifications. Frontend/browser integration is verified separately by the parent task.

Boolean tests independently count unions by inclusion/exclusion of Cartesian intersections minus canonical exclusions, check lexical ranks (including high/final and overlapping pages), all eight connector sequences, skipped boxes, conflicting local predicates, unconstrained total, strict dangling/malformed operator refusals, and independently enumerate a selected star through `urbit-ob` to check that every OR branch remains star-constrained. The original API/candidate tests remain unchanged. The initial Boolean RED was the real candidate route returning 400 for a valid OR query, while all 13 original tests passed; added oracle/edge coverage is subsequent regression coverage, not separately claimed RED.

To intentionally refresh isolated demo captures (replaces only files under `docs/api-examples/`, and saves only to a fresh disposable scratch directory):

```sh
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 -B /Users/tekh/rn/urbit-sigil-atlas/server/test/run-row-group.py isolated-examples-refresh examples.cjs
```

The capture reads back both demo records before cleanup, verifies response hashes after writing, and shuts down only its own ephemeral server. It never restarts the running workshop or writes project `var/`.

Row-mode qualification and exact evidence paths are described in [row-group-backend.md](row-group-backend.md). That historical row seal and the earlier 18-test/33-capture Boolean seal are predecessor evidence. Current either-half qualification is [either-half-backend.md](either-half-backend.md): one retained behavioral tracer RED/GREEN, one 28-test qualified regression run (including all four unchanged prior suites), and seven additive real captures. Original API, candidate, Boolean and row-group test bytes and historical receipts/seals remain unchanged.
