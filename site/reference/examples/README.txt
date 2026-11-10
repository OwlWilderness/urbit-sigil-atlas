# Actual isolated API examples

Every response below was captured from a disposable loopback server. UUIDs/timestamps belong only to demo records. Curl commands replay against the documented default port; the capture used an ephemeral port. No user records were loaded. Raw response files and hashes are in [manifest.json](manifest.json).

## health

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/health'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](health.json).

```json
{
  "ok": true,
  "localOnly": true,
  "authority": false
}
```

## shapes

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/shapes'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](shapes.json).

```json
{
  "items": [
    {
      "id": "circle",
      "label": "circle"
    },
    {
      "id": "square",
      "label": "square"
    },
    {
      "id": "leaf-down",
      "label": "leaf down"
    },
    {
      "id": "leaf-up",
      "label": "leaf up"
    },
    {
      "id": "q-tl",
      "label": "q tl"
    },
    {
      "id": "q-tr",
      "label": "q tr"
    },
    {
      "id": "q-bl",
      "label": "q bl"
    },
    {
      "id": "q-br",
      "label": "q br"
    },
    {
      "id": "d-left",
      "label": "d left"
    },
    {
      "id": "d-top",
      "label": "d top"
    },
    {
      "id": "d-right",
      "label": "d right"
    },
    {
      "id": "d-bottom",
      "label": "d bottom"
    }
  ]
}
```

## glyph-list-rad

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs?kind=prefix&q=rad'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](glyph-list-rad.json).

```json
{
  "items": [
    {
      "kind": "prefix",
      "syllable": "rad",
      "shape": "q-bl"
    }
  ],
  "total": 1
}
```

## glyph-prefix-rad

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/prefix/rad'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](glyph-prefix-rad.json).

```json
{
  "kind": "prefix",
  "syllable": "rad",
  "shape": "q-bl",
  "assets": {
    "full": "/assets/glyphs/prefix-rad-default.svg",
    "silhouette": "/assets/glyphs/prefix-rad-none.svg"
  },
  "svg": {
    "full": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" fill=\"#ffffff\"/><g transform='scale(0.5)'><path d='M128 128C128 57.3076 70.6925 6.18013e-06 1.11901e-05 0L0 128L128 128Z' fill='#181820' stroke='#ffffff' stroke-width='4'/><circle cx='32' cy='96' r='11.5' fill='#181820' stroke='#181820' stroke-width='4'/><circle cx='32' cy='96' r='9' fill='#ffffff' stroke='#ffffff' stroke-width='4'/></g></svg>",
    "silhouette": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" fill=\"#ffffff\"/><g transform='scale(0.5)'><path d='M128 128C128 57.3076 70.6925 6.18013e-06 1.11901e-05 0L0 128L128 128Z' fill='#181820' stroke='#ffffff' stroke-width='4'/></g></svg>"
  }
}
```

## glyph-rad-default

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/prefix/rad/svg'
```

HTTP 200; `image/svg+xml; charset=utf-8`. [Exact response](glyph-rad-default.svg).

## glyph-rad-none

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/prefix/rad/svg?detail=none'
```

HTTP 200; `image/svg+xml; charset=utf-8`. [Exact response](glyph-rad-none.svg).

## compose-star

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~pacfyl"}' 'http://127.0.0.1:8741/api/v1/compose'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](compose-star.json).

```json
{
  "name": "~botmyr-radret",
  "id": "1082103209",
  "kind": "planet",
  "canonical": true,
  "parent": "~pacfyl",
  "mode": "star",
  "star": "~pacfyl",
  "eligible": true,
  "syllables": [
    "bot",
    "myr",
    "rad",
    "ret"
  ]
}
```

## compose-free

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["doz","zod","doz","zod"],"mode":"free"}' 'http://127.0.0.1:8741/api/v1/compose'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](compose-free.json).

```json
{
  "name": "~dozzod-dozzod",
  "id": null,
  "kind": null,
  "canonical": false,
  "parent": null,
  "mode": "free",
  "star": null,
  "eligible": true,
  "syllables": [
    "doz",
    "zod",
    "doz",
    "zod"
  ]
}
```

## compose-mismatch

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~sampel"}' 'http://127.0.0.1:8741/api/v1/compose'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](compose-mismatch.json).

```json
{
  "name": "~botmyr-radret",
  "id": "1082103209",
  "kind": "planet",
  "canonical": true,
  "parent": "~pacfyl",
  "mode": "star",
  "star": "~sampel",
  "eligible": false,
  "syllables": [
    "bot",
    "myr",
    "rad",
    "ret"
  ]
}
```

## saved-star

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~pacfyl","label":"Isolated documentation demo"}' 'http://127.0.0.1:8741/api/v1/compositions'
```

HTTP 201; `application/json; charset=utf-8`. [Exact response](saved-star.json).

```json
{
  "item": {
    "name": "~botmyr-radret",
    "id": "f3eec134-0ecb-4d09-9dd7-85895210b7dc",
    "kind": "planet",
    "canonical": true,
    "parent": "~pacfyl",
    "mode": "star",
    "star": "~pacfyl",
    "eligible": true,
    "syllables": [
      "bot",
      "myr",
      "rad",
      "ret"
    ],
    "label": "Isolated documentation demo",
    "createdAt": "2026-11-09T23:30:42.647Z"
  }
}
```

## saved-free

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["doz","zod","doz","zod"],"mode":"free","label":"Isolated creative demo"}' 'http://127.0.0.1:8741/api/v1/compositions'
```

HTTP 201; `application/json; charset=utf-8`. [Exact response](saved-free.json).

```json
{
  "item": {
    "name": "~dozzod-dozzod",
    "id": "43296a2c-f792-4e9a-8ad0-b8e1c08c567d",
    "kind": null,
    "canonical": false,
    "parent": null,
    "mode": "free",
    "star": null,
    "eligible": true,
    "syllables": [
      "doz",
      "zod",
      "doz",
      "zod"
    ],
    "label": "Isolated creative demo",
    "createdAt": "2026-11-09T23:30:42.664Z"
  }
}
```

## saved-list

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/compositions'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](saved-list.json).

```json
{
  "items": [
    {
      "name": "~botmyr-radret",
      "id": "f3eec134-0ecb-4d09-9dd7-85895210b7dc",
      "kind": "planet",
      "canonical": true,
      "parent": "~pacfyl",
      "mode": "star",
      "star": "~pacfyl",
      "eligible": true,
      "syllables": [
        "bot",
        "myr",
        "rad",
        "ret"
      ],
      "label": "Isolated documentation demo",
      "createdAt": "2026-11-09T23:30:42.647Z"
    },
    {
      "name": "~dozzod-dozzod",
      "id": "43296a2c-f792-4e9a-8ad0-b8e1c08c567d",
      "kind": null,
      "canonical": false,
      "parent": null,
      "mode": "free",
      "star": null,
      "eligible": true,
      "syllables": [
        "doz",
        "zod",
        "doz",
        "zod"
      ],
      "label": "Isolated creative demo",
      "createdAt": "2026-11-09T23:30:42.664Z"
    }
  ],
  "total": 2
}
```

## planets

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/planets?star=~pacfyl&p0=bot&p1=myr&p2=rad&p3=ret&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](planets.json).

```json
{
  "star": "~pacfyl",
  "total": 1,
  "offset": 0,
  "limit": 2,
  "items": [
    {
      "name": "~botmyr-radret",
      "id": "1082103209",
      "syllables": [
        "bot",
        "myr",
        "rad",
        "ret"
      ],
      "parent": "~pacfyl"
    }
  ],
  "availabilityChecked": false
}
```

## candidates-global

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-global.json).

```json
{
  "star": null,
  "total": 4294901760,
  "items": [
    {
      "name": "~bacbec-bacbec",
      "id": "2188024574",
      "syllables": [
        "bac",
        "bec",
        "bac",
        "bec"
      ],
      "parent": "~tilnev"
    },
    {
      "name": "~bacbec-bacbel",
      "id": "1696052275",
      "syllables": [
        "bac",
        "bec",
        "bac",
        "bel"
      ],
      "parent": "~hosmev"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-second-page

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?offset=2&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-second-page.json).

```json
{
  "star": null,
  "total": 4294901760,
  "items": [
    {
      "name": "~bacbec-bacben",
      "id": "366089125",
      "syllables": [
        "bac",
        "bec",
        "bac",
        "ben"
      ],
      "parent": "~modmex"
    },
    {
      "name": "~bacbec-bacbep",
      "id": "3730265448",
      "syllables": [
        "bac",
        "bec",
        "bac",
        "bep"
      ],
      "parent": "~savmes"
    }
  ],
  "offset": 2,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-shapes

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?shape0=circle&shape1=circle&shape2=circle&shape3=circle&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-shapes.json).

```json
{
  "star": null,
  "total": 2432040,
  "items": [
    {
      "name": "~barbet-barbet",
      "id": "4226432403",
      "syllables": [
        "bar",
        "bet",
        "bar",
        "bet"
      ],
      "parent": "~dasryn"
    },
    {
      "name": "~barbet-bardem",
      "id": "1704439484",
      "syllables": [
        "bar",
        "bet",
        "bar",
        "dem"
      ],
      "parent": "~hacbyt"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-shapes-star

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?shape0=circle&shape1=circle&shape2=circle&shape3=circle&star=~pacfyl&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-shapes-star.json).

```json
{
  "star": "~pacfyl",
  "total": 29,
  "items": [
    {
      "name": "~rolfet-liblet",
      "id": "41653673",
      "syllables": [
        "rol",
        "fet",
        "lib",
        "let"
      ],
      "parent": "~pacfyl"
    },
    {
      "name": "~ligped-dolbet",
      "id": "190354857",
      "syllables": [
        "lig",
        "ped",
        "dol",
        "bet"
      ],
      "parent": "~pacfyl"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-exact-global

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=bot&p1=myr&p2=rad&p3=ret'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-exact-global.json).

```json
{
  "star": null,
  "total": 1,
  "items": [
    {
      "name": "~botmyr-radret",
      "id": "1082103209",
      "syllables": [
        "bot",
        "myr",
        "rad",
        "ret"
      ],
      "parent": "~pacfyl"
    }
  ],
  "offset": 0,
  "limit": 50,
  "availabilityChecked": false
}
```

## candidates-exact-pacfyl

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=bot&p1=myr&p2=rad&p3=ret&star=~pacfyl'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-exact-pacfyl.json).

```json
{
  "star": "~pacfyl",
  "total": 1,
  "items": [
    {
      "name": "~botmyr-radret",
      "id": "1082103209",
      "syllables": [
        "bot",
        "myr",
        "rad",
        "ret"
      ],
      "parent": "~pacfyl"
    }
  ],
  "offset": 0,
  "limit": 50,
  "availabilityChecked": false
}
```

## candidates-exact-sampel

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=bot&p1=myr&p2=rad&p3=ret&star=~sampel'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-exact-sampel.json).

```json
{
  "star": "~sampel",
  "total": 0,
  "items": [],
  "offset": 0,
  "limit": 50,
  "availabilityChecked": false
}
```

## candidates-mixed-global

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=rad&p1=ret&p2=bot&p3=myr&join2=or&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-mixed-global.json).

```json
{
  "star": null,
  "total": 131070,
  "items": [
    {
      "name": "~bacbec-botmyr",
      "id": "2941893541",
      "syllables": [
        "bac",
        "bec",
        "bot",
        "myr"
      ],
      "parent": "~dosmex"
    },
    {
      "name": "~bacbel-botmyr",
      "id": "3768380423",
      "syllables": [
        "bac",
        "bel",
        "bot",
        "myr"
      ],
      "parent": "~dovlet"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-or-star

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=bot&p2=rad&join2=or&star=~pacfyl&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-or-star.json).

```json
{
  "star": "~pacfyl",
  "total": 536,
  "items": [
    {
      "name": "~botfyl-pinful",
      "id": "16487849",
      "syllables": [
        "bot",
        "fyl",
        "pin",
        "ful"
      ],
      "parent": "~pacfyl"
    },
    {
      "name": "~tipwes-raddeb",
      "id": "29922729",
      "syllables": [
        "tip",
        "wes",
        "rad",
        "deb"
      ],
      "parent": "~pacfyl"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-rows-global

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join2=and&join3=or&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-rows-global.json).

```json
{
  "star": null,
  "total": 261121,
  "items": [
    {
      "name": "~bacret-bacmyr",
      "id": "3893067901",
      "syllables": [
        "bac",
        "ret",
        "bac",
        "myr"
      ],
      "parent": "~laswyt"
    },
    {
      "name": "~bacret-balmyr",
      "id": "3055648563",
      "syllables": [
        "bac",
        "ret",
        "bal",
        "myr"
      ],
      "parent": "~palmev"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-rows-legacy-comparison

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join2=and&join3=or&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-rows-legacy-comparison.json).

```json
{
  "star": null,
  "total": 33553665,
  "items": [
    {
      "name": "~bacbec-bacmyr",
      "id": "2154343085",
      "syllables": [
        "bac",
        "bec",
        "bac",
        "myr"
      ],
      "parent": "~hasmug"
    },
    {
      "name": "~bacbec-balmyr",
      "id": "4124997344",
      "syllables": [
        "bac",
        "bec",
        "bal",
        "myr"
      ],
      "parent": "~tanrem"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-rows-star

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&shape0=circle&shape1=square&shape2=circle&shape3=leaf-up&join1=or&join3=or&star=~pacfyl&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-rows-star.json).

```json
{
  "star": "~pacfyl",
  "total": 3958,
  "items": [
    {
      "name": "~molser-dorbel",
      "id": "562601",
      "syllables": [
        "mol",
        "ser",
        "dor",
        "bel"
      ],
      "parent": "~pacfyl"
    },
    {
      "name": "~folren-dibben",
      "id": "3904937",
      "syllables": [
        "fol",
        "ren",
        "dib",
        "ben"
      ],
      "parent": "~pacfyl"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## candidates-rows-one-leaf

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&p1=ret&limit=2'
```

HTTP 200; `application/json; charset=utf-8`. [Exact response](candidates-rows-one-leaf.json).

```json
{
  "star": null,
  "total": 16777216,
  "items": [
    {
      "name": "~bacret-bacbec",
      "id": "3235854145",
      "syllables": [
        "bac",
        "ret",
        "bac",
        "bec"
      ],
      "parent": "~tadreb"
    },
    {
      "name": "~bacret-bacbel",
      "id": "3112638626",
      "syllables": [
        "bac",
        "ret",
        "bac",
        "bel"
      ],
      "parent": "~dornus"
    }
  ],
  "offset": 0,
  "limit": 2,
  "availabilityChecked": false
}
```

## error-row-dangling-operator

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=rows&p0=rad&p2=bot&join1=or'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-row-dangling-operator.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid or dangling row operator"
  }
}
```

## error-grouping

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?grouping=linear'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-grouping.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid grouping"
  }
}
```

## error-dangling-operator

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?p0=rad&join2=or'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-dangling-operator.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid or dangling positional operator"
  }
}
```

## error-candidate

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?shape0=CIRCLE'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-candidate.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Unknown shape"
  }
}
```

## error-blank-star

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/candidates?star='
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-blank-star.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "star must be an exact canonical star"
  }
}
```

## error-glyph-kind

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/PREFIX/rad'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-glyph-kind.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Unknown glyph kind"
  }
}
```

## error-glyph-position

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/suffix/rad'
```

HTTP 404; `application/json; charset=utf-8`. [Exact response](error-glyph-position.json).

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Glyph not found"
  }
}
```

## error-glyph-detail

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/glyphs/prefix/rad/svg?detail=unknown'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-glyph-detail.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "detail must be default or none"
  }
}
```

## error-compose

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"pacfyl"}' 'http://127.0.0.1:8741/api/v1/compose'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-compose.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "star must be an exact canonical star"
  }
}
```

## error-save-mismatch

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~sampel"}' 'http://127.0.0.1:8741/api/v1/compositions'
```

HTTP 409; `application/json; charset=utf-8`. [Exact response](error-save-mismatch.json).

```json
{
  "error": {
    "code": "INELIGIBLE_COMPOSITION",
    "message": "Composition is not a canonical planet of this star"
  }
}
```

## error-origin

```sh
curl -sS -X POST -H 'Origin: http://127.0.0.1:8741' -H 'Sec-Fetch-Site: cross-site' -H 'Content-Type: application/json' --data '{"syllables":["bot","myr","rad","ret"],"mode":"star","star":"~pacfyl"}' 'http://127.0.0.1:8741/api/v1/compose'
```

HTTP 403; `application/json; charset=utf-8`. [Exact response](error-origin.json).

```json
{
  "error": {
    "code": "CSRF_REJECTED",
    "message": "Exact same-origin Origin is required"
  }
}
```

## error-planets-star-required

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/planets'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-planets-star-required.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "star must be an exact canonical star"
  }
}
```

## error-query

```sh
curl -sS 'http://127.0.0.1:8741/api/v1/health?unknown=1'
```

HTTP 400; `application/json; charset=utf-8`. [Exact response](error-query.json).

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Unknown or duplicate query parameter"
  }
}
```
