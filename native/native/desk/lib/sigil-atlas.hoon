!:
|%
+$  query
  [slots=(list @t) shapes=(list @t) joins=(list ?) either=? star=(unit @p) offset=@ud limit=@ud rows=?]
+$  choice  [syllable=@t mask=@ud special=?]
+$  bucket  [mask=@ud special=? count=@ud]
+$  result  [total=@ud items=(list json)]
++  text
  |=  [o=(map @t json) key=@t]
  ^-  @t
  =/  v  (~(get by o) key)
  ?~  v  ''
  ?>  ?=(%s -.u.v)
  p.u.v
++  uint
  |=  [o=(map @t json) key=@t default=@ud max=@ud]
  ^-  @ud
  =/  v  (~(get by o) key)
  ?~  v  default
  =/  n  (ni:dejs:format u.v)
  ?>  (lte n max)
  n
++  decode
  |=  j=json
  ^-  query
  ?>  ?=(%o -.j)
  =/  o  p.j
  ?>  (levy ~(tap by o) |=([k=@t v=json] (lien ^-((list @t) ~['p0' 'p1' 'p2' 'p3' 'shape0' 'shape1' 'shape2' 'shape3' 'join1' 'join2' 'join3' 'grouping' 'pairPlacement' 'star' 'offset' 'limit']) |=(x=@t =(x k)))))
  =/  grouping  (text o 'grouping')
  ?>  %+  levy  ~(tap by o)
      |=  [k=@t v=json]
      ?:  |(=('offset' k) =('limit' k))  %.y
      ?>  ?=(%s -.v)
      !=('' p.v)
  ?>  |(=('rows' grouping) =('' grouping))
  =/  row-grouping  =('rows' grouping)
  =/  placement  (text o 'pairPlacement')
  ?>  |(=('' placement) &(row-grouping |(=('fixed' placement) =('either' placement))))
  =/  slots  (turn ~['p0' 'p1' 'p2' 'p3'] |=(k=@t (text o k)))
  =/  shapes  (turn ~['shape0' 'shape1' 'shape2' 'shape3'] |=(k=@t (text o k)))
  =/  joins
    %+  turn  ~['join1' 'join2' 'join3']
    |=  k=@t
    =/  v  (text o k)
    ?>  |(=('' v) =('and' v) =('or' v))
    =('or' v)
  =/  star  (text o 'star')
  =/  parent=(unit @p)
    ?:  =('' star)  ~
    =/  s  (slaw %p star)
    ?>  ?=(^ s)
    ?>  &(=(%king (clan:title u.s)) =(star (scot %p u.s)))
    `u.s
  =/  lim  (uint o 'limit' 50 100)
  ?>  (gth lim 0)
  =/  q=query  [slots shapes joins =('either' placement) parent (uint o 'offset' 0 9.007.199.254.740.991) lim row-grouping]
  ?>  (valid q)
  =/  applicable=(list ?)
    ?.  row-grouping
      :~  &((active q 1) (active q 0))
          &((active q 2) |((active q 0) (active q 1)))
          &((active q 3) |((active q 0) (active q 1) (active q 2)))
      ==
    :~  &((active q 0) (active q 1))
        &(|((active q 0) (active q 1)) |((active q 2) (active q 3)))
        &((active q 2) (active q 3))
    ==
  ?>  (levy (gulf 0 2) |=(i=@ud |(=('' (text o (snag i ^-((list @t) ~['join1' 'join2' 'join3'])))) (snag i applicable))))
  q
++  active
  |=  [q=query i=@ud]
  |(!=('' (snag i slots.q)) !=('' (snag i shapes.q)))
++  valid
  |=  q=query
  ^-  ?
  %+  levy  (gulf 0 3)
  |=  i=@ud
  =/  s  (snag i slots.q)
  =/  shape  (snag i shapes.q)
  =/  syllable-ok
    ?:  =('' s)  %.y
    ?:  =(0 (mod i 2))  ?=(^ (ins:po (slav %tas s)))
    ?=(^ (ind:po (slav %tas s)))
  &(syllable-ok |(=('' shape) (lien ^-((list @t) ~['circle' 'square' 'leaf-down' 'leaf-up' 'q-tl' 'q-tr' 'q-bl' 'q-br' 'd-left' 'd-right' 'd-top' 'd-bottom']) |=(x=@t =(shape x)))))
++  domain
  |=  pos=@ud
  ^-  (list @t)
  =/  xs  (turn (gulf 0 255) |=(i=@ud ?:(=(0 (mod pos 2)) (tos:po i) (tod:po i))))
  (sort xs aor)
++  shape-of
  |=  [pos=@ud syllable=@t]
  ^-  @t
  (~(got by shape-table) [(mod pos 2) syllable])
++  choices
  |=  [q=query pos=@ud]
  ^-  (list choice)
  %+  turn  (domain pos)
  |=  syl=@t
  =/  i  0
  =/  mask  0
  |-  ^-  choice
  ?:  =(4 i)  [syl mask |(&(=(0 pos) =('doz' syl)) &(=(1 pos) =('zod' syl)))]
  ?:  &((active q i) ?:(either.q =((mod i 2) (mod pos 2)) =(i pos)))
    =/  exact  (snag i slots.q)
    =/  shape  (snag i shapes.q)
    ?:  &(|(=('' exact) =(syl exact)) |(=('' shape) =(shape (shape-of pos syl))))
      $(i +(i), mask (con mask (bex (add i ?:(&(either.q (gte pos 2)) 4 0)))))
    $(i +(i))
  $(i +(i))
++  row-value
  |=  [q=query row=@ud shift=@ud truth=@ud]
  ^-  ?
  =/  a  (mul row 2)
  =/  b  +(a)
  =/  av  !=(0 (dis truth (bex (add a shift))))
  =/  bv  !=(0 (dis truth (bex (add b shift))))
  ?.  (active q a)  bv
  ?.  (active q b)  av
  ?:((snag ?:(=(row 0) 0 2) joins.q) |(av bv) &(av bv))
++  legacy-accepts
  |=  [q=query truth=@ud]
  ^-  ?
  =/  pos  0
  =/  prior=?  %.n
  =/  any=?  %.n
  =/  term=?  %.y
  |-  ^-  ?
  ?:  =(4 pos)  ?:(prior |(any term) %.y)
  ?.  (active q pos)  $(pos +(pos))
  =/  value  !=(0 (dis truth (bex pos)))
  ?:  &(prior (gth pos 0) (snag (dec pos) joins.q))
    $(pos +(pos), prior %.y, any |(any term), term value)
  $(pos +(pos), prior %.y, term ?:(prior &(term value) value))
++  accepts
  |=  [q=query truth=@ud]
  ^-  ?
  ?.  rows.q  (legacy-accepts q truth)
  =/  top  |((active q 0) (active q 1))
  =/  bot  |((active q 2) (active q 3))
  ?:  !|(top bot)  %.y
  =/  a  |((row-value q 0 0 truth) &(either.q (row-value q 0 4 truth)))
  =/  b  |((row-value q 1 0 truth) &(either.q (row-value q 1 4 truth)))
  ?.  top  b
  ?.  bot  a
  ?:((snag 1 joins.q) |(a b) &(a b))
++  histogram
  |=  xs=(list choice)
  ^-  (list bucket)
  =/  counts  *(map [@ud ?] @ud)
  |-  ^-  (list bucket)
  ?~  xs  (turn ~(tap by counts) |=([k=[@ud ?] n=@ud] [-.k +.k n]))
  =/  key  [mask.i.xs special.i.xs]
  =/  old  (~(get by counts) key)
  $(xs t.xs, counts (~(put by counts) key ?~(old 1 +(u.old))))
++  suffix-count
  |=  [q=query hist=(list (list bucket)) pos=@ud truth=@ud leading=?]
  ^-  @ud
  ~+
  ?:  =(pos 4)  ?:((accepts q truth) 1 0)
  =/  xs  (snag pos hist)
  =/  sum  0
  |-  ^-  @ud
  ?~  xs  sum
  ?:  &(=(pos 1) leading special.i.xs)  $(xs t.xs)
  =/  n  (suffix-count q hist +(pos) (con truth mask.i.xs) &(=(pos 0) special.i.xs))
  $(xs t.xs, sum (add sum (mul count.i.xs n)))
++  row-json
  |=  syllables=(list @t)
  ^-  json
  =/  name  (rap 3 ~['~' (snag 0 syllables) (snag 1 syllables) '-' (snag 2 syllables) (snag 3 syllables)])
  =/  point  (slav %p name)
  ?>  &(=(name (scot %p point)) =(%duke (clan:title point)))
  %-  pairs:enjs:format
  :~  ['name' [%s name]]
      ['id' [%s (decimal point)]]
      ['syllables' [%a (turn syllables |=(s=@t [%s s]))]]
      ['parent' [%s (scot %p (end 4 point))]]
  ==
++  search
  |=  q=query
  ^-  result
  ?>  ?=(~ star.q)
  =/  cs  (turn ~[0 1 2 3] |=(p=@ud (choices q p)))
  =/  hist  (turn cs histogram)
  =/  total  (suffix-count q hist 0 0 %.n)
  =/  rank  offset.q
  =/  items  *(list json)
  |-  ^-  result
  ?:  |((gte rank total) =(limit.q (lent items)))  [total (flop items)]
  =/  pos  0
  =/  truth  0
  =/  leading=?  %.n
  =/  remaining  rank
  =/  syllables  *(list @t)
  =/  tuple
    |-  ^-  (list @t)
    ?:  =(pos 4)  (flop syllables)
    =/  xs  (snag pos cs)
    |-
    ?>  ?=(^ xs)
    ?:  &(=(pos 1) leading special.i.xs)  $(xs t.xs)
    =/  next  (con truth mask.i.xs)
    =/  lead  &(=(pos 0) special.i.xs)
    =/  n  (suffix-count q hist +(pos) next lead)
    ?:  (gte remaining n)  $(xs t.xs, remaining (sub remaining n))
    ^$(pos +(pos), truth next, leading lead, syllables [syllable.i.xs syllables])
  $(rank +(rank), items [(row-json tuple) items])
++  decimal
  |=  n=@ud
  (crip (skim (trip (scot %ud n)) |=(c=@tD !=('.' c))))
++  syllables
  |=  point=@p
  ^-  (list @t)
  =/  s  (crip (skim (trip (scot %p point)) |=(c=@tD &((gte c 'a') (lte c 'z')))))
  =/  out  *(list @t)
  |-  ^-  (list @t)
  ?:  =(0 s)  (flop out)
  $(s (rsh [3 3] s), out [(cut 3 [0 3] s) out])
++  star-chunk
  |=  [q=query start=@ud end=@ud prior=result]
  ^-  result
  ?>  ?=(^ star.q)
  =/  maps
    %+  turn  ~[0 1 2 3]
    |=  pos=@ud
    %-  ~(gas by *(map @t @ud))
    (turn (choices q pos) |=(c=choice [syllable.c mask.c]))
  =/  n  start
  =/  r  prior
  |-  ^-  result
  ?:  (gte n end)  r
  =/  point=@p  (add u.star.q (mul n 65.536))
  =/  ss  (syllables point)
  =/  truth  0
  =/  i  0
  =/  mask
    |-  ^-  @ud
    ?:  =(i 4)  truth
    $(i +(i), truth (con truth (~(got by (snag i maps)) (snag i ss))))
  ?.  (accepts q mask)  $(n +(n))
  =/  keep  &((gte total.r offset.q) (lth (lent items.r) limit.q))
  $(n +(n), r [+(total.r) ?:(keep (weld items.r ~[(row-json ss)]) items.r)])
++  response
  |=  [q=query r=result]
  ^-  json
  %-  pairs:enjs:format
  :~  ['star' ?~(star.q ~ [%s (scot %p u.star.q)])]
      ['total' (numb:enjs:format total.r)]
      ['offset' (numb:enjs:format offset.q)]
      ['limit' (numb:enjs:format limit.q)]
      ['items' [%a items.r]]
      ['availabilityChecked' [%b %.n]]
  ==
++  compose
  |=  j=json
  ^-  json
  ?>  ?=(%o -.j)
  ?>  (levy ~(tap by p.j) |=([k=@t v=json] (lien ^-((list @t) ~['syllables' 'mode' 'star']) |=(x=@t =(x k)))))
  =/  arr  (~(got by p.j) 'syllables')
  ?>  ?=(%a -.arr)
  =/  ss  p.arr
  ?>  =(4 (lent ss))
  =/  slots
    %+  turn  ss
    |=  v=json
    ?>  ?=(%s -.v)
    p.v
  =/  q=query  [slots ~['' '' '' ''] ~[%.n %.n %.n] %.n ~ 0 1 %.y]
  ?>  (valid q)
  =/  name  (rap 3 ~['~' (snag 0 slots) (snag 1 slots) '-' (snag 2 slots) (snag 3 slots)])
  =/  point  (slav %p name)
  =/  canonical  &(=(name (scot %p point)) =(%duke (clan:title point)))
  =/  mode  (text p.j 'mode')
  ?>  |(=('free' mode) =('star' mode))
  =/  raw-star  (~(get by p.j) 'star')
  =/  star=@t
    ?~  raw-star  ''
    ?~  u.raw-star  ''
    ?>  ?=(%s -.u.raw-star)
    p.u.raw-star
  ?>  ?:  =('free' mode)
        ?~(raw-star %.y ?~(u.raw-star %.y %.n))
      =/  ship  (slaw %p star)
      ?~  ship  %.n
      &(=(star (scot %p u.ship)) =(%king (clan:title u.ship)))
  =/  parent  (scot %p (end 4 point))
  %-  pairs:enjs:format
  :~  ['name' [%s name]]
      ['id' ?:(canonical [%s (decimal point)] ~)]
      ['kind' ?:(canonical [%s 'planet'] ~)]
      ['canonical' [%b canonical]]
      ['parent' ?:(canonical [%s parent] ~)]
      ['mode' [%s mode]]
      ['star' ?:(=('free' mode) ~ [%s star])]
      ['eligible' [%b |(=('free' mode) &(canonical =(star parent)))]]
      ['syllables' [%a ss]]
  ==
++  preference-ok
  |=  [key=@t val=json]
  ^-  ?
  ?:  =('sigil-atlas:favorites' key)
    ?.  ?=(%a -.val)  %.n
    ?>  (lte (lent p.val) 512)
    ?.  =((lent p.val) (lent ~(tap in (silt p.val))))  %.n
    %+  levy  p.val
    |=  v=json
    ?.  ?=(%s -.v)  %.n
    =/  kind  (cut 3 [0 7] p.v)
    ?.  |(=('prefix-' kind) =('suffix-' kind))  %.n
    (~(has by shape-table) [?:(=('prefix-' kind) 0 1) (rsh [3 7] p.v)])
  ?:  =('sigil-atlas:slots' key)
    ?.  ?=(%a -.val)  %.n
    ?.  =(4 (lent p.val))  %.n
    ?.  (levy p.val |=(v=json |(?=(~ v) ?=(%s -.v))))  %.n
    =/  slots  (turn p.val |=(v=json ?~(v '' ?>(?=(%s -.v) p.v))))
    (valid [slots ~['' '' '' ''] ~[%.n %.n %.n] %.n ~ 0 1 %.y])
  ?:  =('sigil-atlas:slotEnabled' key)
    ?.  ?=(%a -.val)  %.n
    &(=(4 (lent p.val)) (levy p.val |=(v=json ?=(%b -.v))))
  ?:  =('sigil-atlas:rowJoins' key)
    ?.  ?=(%a -.val)  %.n
    &(=(3 (lent p.val)) (levy p.val |=(v=json &(?=(%s -.v) |(=([%s 'and'] v) =([%s 'or'] v))))))
  ?.  ?=(%s -.val)  %.n
  ?:  |(=('sigil-atlas:starInput' key) =('sigil-atlas:star' key))
    ?:  =('' p.val)  %.y
    =/  name  ?:(=('~' (cut 3 [0 1] p.val)) p.val (rap 3 ~['~' p.val]))
    =/  ship  (slaw %p name)
    ?~  ship  %.n
    &(=(name (scot %p u.ship)) =(%king (clan:title u.ship)))
  ?:  =('sigil-atlas:pairPlacement' key)  |(=('fixed' p.val) =('either' p.val))
  ?:  =('sigil-atlas:mode' key)  |(=('free' p.val) =('star' p.val))
  ?:  =('sigil-atlas:matchMode' key)  |(=('shape' p.val) =('exact' p.val))
  %.n
++  preferences-valid
  |=  j=json
  ^-  ?
  ?.  ?=(%o -.j)  %.n
  &((lte (lent ~(tap by p.j)) 9) (levy ~(tap by p.j) |=([k=@t v=json] (preference-ok k v))))
++  clean-preferences
  |=  j=json
  ^-  json
  ?.  ?=(%o -.j)  [%o ~]
  [%o (~(gas by *(map @t json)) (skim ~(tap by p.j) |=([k=@t v=json] (preference-ok k v))))]
++  shape-table
  ^-  (map [@ud @t] @t)
  %-  ~(gas by *(map [@ud @t] @t))
  ^-  (list [[@ud @t] @t])
  :~  [[0 'bar'] 'circle']
      [[0 'bol'] 'circle']
      [[0 'dar'] 'circle']
      [[0 'dib'] 'circle']
      [[0 'dol'] 'circle']
      [[0 'dop'] 'circle']
      [[0 'doz'] 'circle']
      [[0 'fol'] 'circle']
      [[0 'fop'] 'circle']
      [[0 'hap'] 'circle']
      [[0 'har'] 'circle']
      [[0 'hol'] 'circle']
      [[0 'hop'] 'circle']
      [[0 'lar'] 'circle']
      [[0 'lib'] 'circle']
      [[0 'lig'] 'circle']
      [[0 'lop'] 'circle']
      [[0 'mar'] 'circle']
      [[0 'mol'] 'circle']
      [[0 'mop'] 'circle']
      [[0 'nar'] 'circle']
      [[0 'nib'] 'circle']
      [[0 'nol'] 'circle']
      [[0 'nop'] 'circle']
      [[0 'par'] 'circle']
      [[0 'pol'] 'circle']
      [[0 'rib'] 'circle']
      [[0 'rig'] 'circle']
      [[0 'rol'] 'circle']
      [[0 'rop'] 'circle']
      [[0 'sar'] 'circle']
      [[0 'sib'] 'circle']
      [[0 'sig'] 'circle']
      [[0 'sol'] 'circle']
      [[0 'sop'] 'circle']
      [[0 'tap'] 'circle']
      [[0 'tar'] 'circle']
      [[0 'tol'] 'circle']
      [[0 'top'] 'circle']
      [[0 'wol'] 'circle']
      [[0 'bin'] 'square']
      [[0 'das'] 'square']
      [[0 'din'] 'square']
      [[0 'div'] 'square']
      [[0 'dov'] 'square']
      [[0 'fas'] 'square']
      [[0 'fin'] 'square']
      [[0 'has'] 'square']
      [[0 'hin'] 'square']
      [[0 'las'] 'square']
      [[0 'lin'] 'square']
      [[0 'liv'] 'square']
      [[0 'lom'] 'square']
      [[0 'mas'] 'square']
      [[0 'min'] 'square']
      [[0 'nom'] 'square']
      [[0 'nov'] 'square']
      [[0 'pas'] 'square']
      [[0 'pin'] 'square']
      [[0 'rin'] 'square']
      [[0 'riv'] 'square']
      [[0 'rov'] 'square']
      [[0 'sip'] 'square']
      [[0 'siv'] 'square']
      [[0 'som'] 'square']
      [[0 'sov'] 'square']
      [[0 'tas'] 'square']
      [[0 'tin'] 'square']
      [[0 'tom'] 'square']
      [[0 'win'] 'square']
      [[0 'bal'] 'leaf-down']
      [[0 'bit'] 'leaf-down']
      [[0 'dal'] 'leaf-down']
      [[0 'fit'] 'leaf-down']
      [[0 'lit'] 'leaf-down']
      [[0 'loc'] 'leaf-down']
      [[0 'mal'] 'leaf-down']
      [[0 'mit'] 'leaf-down']
      [[0 'moc'] 'leaf-down']
      [[0 'nal'] 'leaf-down']
      [[0 'pal'] 'leaf-down']
      [[0 'pit'] 'leaf-down']
      [[0 'poc'] 'leaf-down']
      [[0 'rac'] 'leaf-down']
      [[0 'ral'] 'leaf-down']
      [[0 'rit'] 'leaf-down']
      [[0 'roc'] 'leaf-down']
      [[0 'sal'] 'leaf-down']
      [[0 'sit'] 'leaf-down']
      [[0 'tal'] 'leaf-down']
      [[0 'toc'] 'leaf-down']
      [[0 'doc'] 'leaf-up']
      [[0 'fal'] 'leaf-up']
      [[0 'hal'] 'leaf-up']
      [[0 'soc'] 'leaf-up']
      [[0 'wal'] 'leaf-up']
      [[0 'wit'] 'leaf-up']
      [[0 'fad'] 'q-tl']
      [[0 'fos'] 'q-tl']
      [[0 'had'] 'q-tl']
      [[0 'han'] 'q-tl']
      [[0 'bac'] 'q-tr']
      [[0 'ban'] 'q-tr']
      [[0 'bat'] 'q-tr']
      [[0 'bic'] 'q-tr']
      [[0 'bid'] 'q-tr']
      [[0 'bis'] 'q-tr']
      [[0 'bos'] 'q-tr']
      [[0 'dab'] 'q-tr']
      [[0 'dac'] 'q-tr']
      [[0 'dap'] 'q-tr']
      [[0 'dat'] 'q-tr']
      [[0 'dif'] 'q-tr']
      [[0 'dir'] 'q-tr']
      [[0 'dos'] 'q-tr']
      [[0 'fab'] 'q-tr']
      [[0 'fid'] 'q-tr']
      [[0 'fir'] 'q-tr']
      [[0 'hab'] 'q-tr']
      [[0 'hac'] 'q-tr']
      [[0 'hat'] 'q-tr']
      [[0 'hav'] 'q-tr']
      [[0 'hid'] 'q-tr']
      [[0 'hos'] 'q-tr']
      [[0 'lac'] 'q-tr']
      [[0 'lap'] 'q-tr']
      [[0 'lat'] 'q-tr']
      [[0 'lid'] 'q-tr']
      [[0 'los'] 'q-tr']
      [[0 'mac'] 'q-tr']
      [[0 'mat'] 'q-tr']
      [[0 'mid'] 'q-tr']
      [[0 'mir'] 'q-tr']
      [[0 'mos'] 'q-tr']
      [[0 'nac'] 'q-tr']
      [[0 'nat'] 'q-tr']
      [[0 'nav'] 'q-tr']
      [[0 'nid'] 'q-tr']
      [[0 'nos'] 'q-tr']
      [[0 'pac'] 'q-tr']
      [[0 'pad'] 'q-tr']
      [[0 'pan'] 'q-tr']
      [[0 'pat'] 'q-tr']
      [[0 'pid'] 'q-tr']
      [[0 'pos'] 'q-tr']
      [[0 'rap'] 'q-tr']
      [[0 'rav'] 'q-tr']
      [[0 'rid'] 'q-tr']
      [[0 'ros'] 'q-tr']
      [[0 'sab'] 'q-tr']
      [[0 'san'] 'q-tr']
      [[0 'sap'] 'q-tr']
      [[0 'sat'] 'q-tr']
      [[0 'sic'] 'q-tr']
      [[0 'sid'] 'q-tr']
      [[0 'tab'] 'q-tr']
      [[0 'tac'] 'q-tr']
      [[0 'tad'] 'q-tr']
      [[0 'tan'] 'q-tr']
      [[0 'tic'] 'q-tr']
      [[0 'tid'] 'q-tr']
      [[0 'tir'] 'q-tr']
      [[0 'wac'] 'q-tr']
      [[0 'wan'] 'q-tr']
      [[0 'wat'] 'q-tr']
      [[0 'wid'] 'q-tr']
      [[0 'wis'] 'q-tr']
      [[0 'lis'] 'q-bl']
      [[0 'mic'] 'q-bl']
      [[0 'pic'] 'q-bl']
      [[0 'rad'] 'q-bl']
      [[0 'ric'] 'q-bl']
      [[0 'bon'] 'q-br']
      [[0 'dis'] 'q-br']
      [[0 'don'] 'q-br']
      [[0 'fog'] 'q-br']
      [[0 'fon'] 'q-br']
      [[0 'lab'] 'q-br']
      [[0 'lad'] 'q-br']
      [[0 'lav'] 'q-br']
      [[0 'lon'] 'q-br']
      [[0 'map'] 'q-br']
      [[0 'mip'] 'q-br']
      [[0 'mis'] 'q-br']
      [[0 'mog'] 'q-br']
      [[0 'mon'] 'q-br']
      [[0 'nap'] 'q-br']
      [[0 'nis'] 'q-br']
      [[0 'pon'] 'q-br']
      [[0 'rab'] 'q-br']
      [[0 'ris'] 'q-br']
      [[0 'ron'] 'q-br']
      [[0 'sog'] 'q-br']
      [[0 'son'] 'q-br']
      [[0 'tip'] 'q-br']
      [[0 'tog'] 'q-br']
      [[0 'ton'] 'q-br']
      [[0 'wic'] 'q-br']
      [[0 'bil'] 'd-left']
      [[0 'bor'] 'd-left']
      [[0 'bot'] 'd-left']
      [[0 'dan'] 'd-left']
      [[0 'dav'] 'd-left']
      [[0 'dig'] 'd-left']
      [[0 'dil'] 'd-left']
      [[0 'dor'] 'd-left']
      [[0 'dot'] 'd-left']
      [[0 'fam'] 'd-left']
      [[0 'fan'] 'd-left']
      [[0 'fig'] 'd-left']
      [[0 'fil'] 'd-left']
      [[0 'fip'] 'd-left']
      [[0 'fod'] 'd-left']
      [[0 'for'] 'd-left']
      [[0 'fot'] 'd-left']
      [[0 'hil'] 'd-left']
      [[0 'hoc'] 'd-left']
      [[0 'hod'] 'd-left']
      [[0 'lag'] 'd-left']
      [[0 'lan'] 'd-left']
      [[0 'lod'] 'd-left']
      [[0 'lor'] 'd-left']
      [[0 'mag'] 'd-left']
      [[0 'mig'] 'd-left']
      [[0 'mil'] 'd-left']
      [[0 'mod'] 'd-left']
      [[0 'mor'] 'd-left']
      [[0 'mot'] 'd-left']
      [[0 'nam'] 'd-left']
      [[0 'nil'] 'd-left']
      [[0 'noc'] 'd-left']
      [[0 'nod'] 'd-left']
      [[0 'nor'] 'd-left']
      [[0 'pag'] 'd-left']
      [[0 'pil'] 'd-left']
      [[0 'pod'] 'd-left']
      [[0 'rag'] 'd-left']
      [[0 'ram'] 'd-left']
      [[0 'ran'] 'd-left']
      [[0 'ril'] 'd-left']
      [[0 'rip'] 'd-left']
      [[0 'sam'] 'd-left']
      [[0 'sav'] 'd-left']
      [[0 'sil'] 'd-left']
      [[0 'sor'] 'd-left']
      [[0 'tag'] 'd-left']
      [[0 'tam'] 'd-left']
      [[0 'til'] 'd-left']
      [[0 'tod'] 'd-left']
      [[0 'tor'] 'd-left']
      [[0 'wor'] 'd-left']
      [[0 'hob'] 'd-top']
      [[0 'nim'] 'd-top']
      [[0 'sim'] 'd-top']
      [[0 'tim'] 'd-top']
      [[0 'tob'] 'd-top']
      [[1 'bet'] 'circle']
      [[1 'dem'] 'circle']
      [[1 'det'] 'circle']
      [[1 'dul'] 'circle']
      [[1 'fed'] 'circle']
      [[1 'fet'] 'circle']
      [[1 'ful'] 'circle']
      [[1 'het'] 'circle']
      [[1 'hul'] 'circle']
      [[1 'led'] 'circle']
      [[1 'let'] 'circle']
      [[1 'lun'] 'circle']
      [[1 'med'] 'circle']
      [[1 'met'] 'circle']
      [[1 'mul'] 'circle']
      [[1 'mun'] 'circle']
      [[1 'ned'] 'circle']
      [[1 'nem'] 'circle']
      [[1 'net'] 'circle']
      [[1 'nul'] 'circle']
      [[1 'ped'] 'circle']
      [[1 'pem'] 'circle']
      [[1 'pet'] 'circle']
      [[1 'pun'] 'circle']
      [[1 'red'] 'circle']
      [[1 'rem'] 'circle']
      [[1 'ret'] 'circle']
      [[1 'rul'] 'circle']
      [[1 'sed'] 'circle']
      [[1 'sem'] 'circle']
      [[1 'set'] 'circle']
      [[1 'sul'] 'circle']
      [[1 'sun'] 'circle']
      [[1 'ted'] 'circle']
      [[1 'tem'] 'circle']
      [[1 'tul'] 'circle']
      [[1 'wed'] 'circle']
      [[1 'wet'] 'circle']
      [[1 'zod'] 'circle']
      [[1 'ben'] 'square']
      [[1 'deb'] 'square']
      [[1 'deg'] 'square']
      [[1 'den'] 'square']
      [[1 'dut'] 'square']
      [[1 'feb'] 'square']
      [[1 'fen'] 'square']
      [[1 'heb'] 'square']
      [[1 'hut'] 'square']
      [[1 'leb'] 'square']
      [[1 'leg'] 'square']
      [[1 'len'] 'square']
      [[1 'lut'] 'square']
      [[1 'meb'] 'square']
      [[1 'meg'] 'square']
      [[1 'mut'] 'square']
      [[1 'neb'] 'square']
      [[1 'nut'] 'square']
      [[1 'peg'] 'square']
      [[1 'pen'] 'square']
      [[1 'put'] 'square']
      [[1 'reb'] 'square']
      [[1 'reg'] 'square']
      [[1 'ren'] 'square']
      [[1 'rut'] 'square']
      [[1 'seb'] 'square']
      [[1 'seg'] 'square']
      [[1 'sen'] 'square']
      [[1 'sut'] 'square']
      [[1 'teb'] 'square']
      [[1 'teg'] 'square']
      [[1 'ten'] 'square']
      [[1 'web'] 'square']
      [[1 'weg'] 'square']
      [[1 'wen'] 'square']
      [[1 'def'] 'leaf-down']
      [[1 'lyd'] 'leaf-down']
      [[1 'nyd'] 'leaf-down']
      [[1 'ref'] 'leaf-down']
      [[1 'ryd'] 'leaf-down']
      [[1 'sef'] 'leaf-down']
      [[1 'syd'] 'leaf-down']
      [[1 'tyd'] 'leaf-down']
      [[1 'wyd'] 'leaf-down']
      [[1 'bel'] 'leaf-up']
      [[1 'byr'] 'leaf-up']
      [[1 'del'] 'leaf-up']
      [[1 'dyr'] 'leaf-up']
      [[1 'fel'] 'leaf-up']
      [[1 'fyr'] 'leaf-up']
      [[1 'lyr'] 'leaf-up']
      [[1 'mel'] 'leaf-up']
      [[1 'myr'] 'leaf-up']
      [[1 'nel'] 'leaf-up']
      [[1 'nyr'] 'leaf-up']
      [[1 'pel'] 'leaf-up']
      [[1 'rel'] 'leaf-up']
      [[1 'sel'] 'leaf-up']
      [[1 'syr'] 'leaf-up']
      [[1 'tel'] 'leaf-up']
      [[1 'tyr'] 'leaf-up']
      [[1 'tyv'] 'leaf-up']
      [[1 'wel'] 'leaf-up']
      [[1 'bur'] 'q-tl']
      [[1 'byl'] 'q-tl']
      [[1 'byn'] 'q-tl']
      [[1 'dux'] 'q-tl']
      [[1 'dyn'] 'q-tl']
      [[1 'fur'] 'q-tl']
      [[1 'fyl'] 'q-tl']
      [[1 'fyn'] 'q-tl']
      [[1 'lux'] 'q-tl']
      [[1 'lyn'] 'q-tl']
      [[1 'lyx'] 'q-tl']
      [[1 'myl'] 'q-tl']
      [[1 'myn'] 'q-tl']
      [[1 'nym'] 'q-tl']
      [[1 'nyx'] 'q-tl']
      [[1 'pur'] 'q-tl']
      [[1 'pyx'] 'q-tl']
      [[1 'rum'] 'q-tl']
      [[1 'ryg'] 'q-tl']
      [[1 'rym'] 'q-tl']
      [[1 'ryn'] 'q-tl']
      [[1 'ryp'] 'q-tl']
      [[1 'ryx'] 'q-tl']
      [[1 'sum'] 'q-tl']
      [[1 'syl'] 'q-tl']
      [[1 'sym'] 'q-tl']
      [[1 'syn'] 'q-tl']
      [[1 'syp'] 'q-tl']
      [[1 'syx'] 'q-tl']
      [[1 'tyn'] 'q-tl']
      [[1 'typ'] 'q-tl']
      [[1 'wyn'] 'q-tl']
      [[1 'wyx'] 'q-tl']
      [[1 'ryl'] 'q-tr']
      [[1 'bec'] 'q-bl']
      [[1 'bes'] 'q-bl']
      [[1 'bud'] 'q-bl']
      [[1 'bus'] 'q-bl']
      [[1 'dec'] 'q-bl']
      [[1 'duc'] 'q-bl']
      [[1 'dus'] 'q-bl']
      [[1 'dyl'] 'q-bl']
      [[1 'dys'] 'q-bl']
      [[1 'fep'] 'q-bl']
      [[1 'fus'] 'q-bl']
      [[1 'hec'] 'q-bl']
      [[1 'hep'] 'q-bl']
      [[1 'hus'] 'q-bl']
      [[1 'lec'] 'q-bl']
      [[1 'luc'] 'q-bl']
      [[1 'lud'] 'q-bl']
      [[1 'lur'] 'q-bl']
      [[1 'lus'] 'q-bl']
      [[1 'lys'] 'q-bl']
      [[1 'mec'] 'q-bl']
      [[1 'mes'] 'q-bl']
      [[1 'mud'] 'q-bl']
      [[1 'mur'] 'q-bl']
      [[1 'mus'] 'q-bl']
      [[1 'nec'] 'q-bl']
      [[1 'nep'] 'q-bl']
      [[1 'nub'] 'q-bl']
      [[1 'num'] 'q-bl']
      [[1 'nus'] 'q-bl']
      [[1 'nux'] 'q-bl']
      [[1 'nyl'] 'q-bl']
      [[1 'nys'] 'q-bl']
      [[1 'pec'] 'q-bl']
      [[1 'pub'] 'q-bl']
      [[1 'pyl'] 'q-bl']
      [[1 'rec'] 'q-bl']
      [[1 'ruc'] 'q-bl']
      [[1 'rud'] 'q-bl']
      [[1 'rus'] 'q-bl']
      [[1 'rux'] 'q-bl']
      [[1 'ryc'] 'q-bl']
      [[1 'rys'] 'q-bl']
      [[1 'sec'] 'q-bl']
      [[1 'sub'] 'q-bl']
      [[1 'sud'] 'q-bl']
      [[1 'sur'] 'q-bl']
      [[1 'tec'] 'q-bl']
      [[1 'tuc'] 'q-bl']
      [[1 'tud'] 'q-bl']
      [[1 'tus'] 'q-bl']
      [[1 'tux'] 'q-bl']
      [[1 'tyc'] 'q-bl']
      [[1 'tyl'] 'q-bl']
      [[1 'wyc'] 'q-bl']
      [[1 'wyl'] 'q-bl']
      [[1 'bep'] 'q-br']
      [[1 'dep'] 'q-br']
      [[1 'des'] 'q-br']
      [[1 'fes'] 'q-br']
      [[1 'hes'] 'q-br']
      [[1 'lep'] 'q-br']
      [[1 'mep'] 'q-br']
      [[1 'nes'] 'q-br']
      [[1 'pes'] 'q-br']
      [[1 'rep'] 'q-br']
      [[1 'res'] 'q-br']
      [[1 'sep'] 'q-br']
      [[1 'tep'] 'q-br']
      [[1 'tes'] 'q-br']
      [[1 'wep'] 'q-br']
      [[1 'wes'] 'q-br']
      [[1 'ber'] 'd-right']
      [[1 'bex'] 'd-right']
      [[1 'byt'] 'd-right']
      [[1 'dev'] 'd-right']
      [[1 'dex'] 'd-right']
      [[1 'dun'] 'd-right']
      [[1 'dyt'] 'd-right']
      [[1 'fer'] 'd-right']
      [[1 'fex'] 'd-right']
      [[1 'hex'] 'd-right']
      [[1 'ler'] 'd-right']
      [[1 'lev'] 'd-right']
      [[1 'lex'] 'd-right']
      [[1 'lug'] 'd-right']
      [[1 'lup'] 'd-right']
      [[1 'lyt'] 'd-right']
      [[1 'mer'] 'd-right']
      [[1 'mev'] 'd-right']
      [[1 'mex'] 'd-right']
      [[1 'mug'] 'd-right']
      [[1 'ner'] 'd-right']
      [[1 'nev'] 'd-right']
      [[1 'nex'] 'd-right']
      [[1 'nup'] 'd-right']
      [[1 'nyt'] 'd-right']
      [[1 'pex'] 'd-right']
      [[1 'rev'] 'd-right']
      [[1 'rex'] 'd-right']
      [[1 'run'] 'd-right']
      [[1 'rup'] 'd-right']
      [[1 'ryt'] 'd-right']
      [[1 'sev'] 'd-right']
      [[1 'sug'] 'd-right']
      [[1 'sup'] 'd-right']
      [[1 'syt'] 'd-right']
      [[1 'tev'] 'd-right']
      [[1 'tex'] 'd-right']
      [[1 'tug'] 'd-right']
      [[1 'wex'] 'd-right']
      [[1 'wyt'] 'd-right']
      [[1 'fun'] 'd-top']
      [[1 'tun'] 'd-top']
      [[1 'der'] 'd-bottom']
      [[1 'dur'] 'd-bottom']
      [[1 'per'] 'd-bottom']
      [[1 'ser'] 'd-bottom']
      [[1 'ter'] 'd-bottom']
      [[1 'wer'] 'd-bottom']
  ==
--
