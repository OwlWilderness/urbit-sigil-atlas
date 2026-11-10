# Actual either-half API captures

Independent additive captures; original corpus and manifest are retained unchanged. Each response came from an ephemeral loopback server imported from the current production backend. GET only; no user data or saved records read/written. Curl commands target the usual local port; the manifest records the actual ephemeral origin.

## either-half-fixed

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=fixed&p0=rad&p1=dev&p2=bot&p3=myr'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":null,"total":1,"items":[{"name":"~raddev-botmyr","id":"3169956406","syllables":["rad","dev","bot","myr"],"parent":"~linwyd"}],"offset":0,"limit":50,"availabilityChecked":false}
```

## either-half-swapped

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=either&p0=rad&p1=dev&p2=bot&p3=myr'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":null,"total":2,"items":[{"name":"~botmyr-raddev","id":"2371871526","syllables":["bot","myr","rad","dev"],"parent":"~walsul"},{"name":"~raddev-botmyr","id":"3169956406","syllables":["rad","dev","bot","myr"],"parent":"~linwyd"}],"offset":0,"limit":50,"availabilityChecked":false}
```

## either-half-single-bottom-pattern

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=either&p2=rad&p3=dev&limit=2'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":null,"total":131070,"items":[{"name":"~bacbec-raddev","id":"2111419262","syllables":["bac","bec","rad","dev"],"parent":"~dibnub"},{"name":"~bacbel-raddev","id":"4222808651","syllables":["bac","bel","rad","dev"],"parent":"~pitsem"}],"offset":0,"limit":2,"availabilityChecked":false}
```

## either-half-overlap

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=either&p0=rad&p1=dev&p2=rad&limit=2'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":null,"total":131070,"items":[{"name":"~bacbec-raddev","id":"2111419262","syllables":["bac","bec","rad","dev"],"parent":"~dibnub"},{"name":"~bacbel-raddev","id":"4222808651","syllables":["bac","bel","rad","dev"],"parent":"~pitsem"}],"offset":0,"limit":2,"availabilityChecked":false}
```

## either-half-star

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=either&p0=bot&p1=myr&p2=rad&p3=ret&star=~pacfyl'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":"~pacfyl","total":1,"items":[{"name":"~botmyr-radret","id":"1082103209","syllables":["bot","myr","rad","ret"],"parent":"~pacfyl"}],"offset":0,"limit":50,"availabilityChecked":false}
```

## either-half-zero-word

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=either&p0=doz&p1=zod&limit=2'
```

HTTP 200; application/json; charset=utf-8

```json
{"star":null,"total":65535,"items":[{"name":"~bacbec-dozzod","id":"275337592","syllables":["bac","bec","doz","zod"],"parent":"~podfel"},{"name":"~bacbel-dozzod","id":"1197627469","syllables":["bac","bel","doz","zod"],"parent":"~noprec"}],"offset":0,"limit":2,"availabilityChecked":false}
```

## either-half-invalid

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&pairPlacement=&p0=rad'
```

HTTP 400; application/json; charset=utf-8

```json
{"error":{"code":"INVALID_INPUT","message":"Invalid pair placement"}}
```
