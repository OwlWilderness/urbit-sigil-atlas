/+  default-agent, sigil-atlas
=,  sigil-atlas
|%
+$  card  card:agent:gall
+$  saved-v1  [%1 preferences=json revision=@ud]
+$  record  [request=@t input=json item=json]
+$  saved  [%2 preferences=json revision=@ud records=(list record)]
+$  job  [q=query next=@ud r=result]
--
=|  s=saved
=|  jobs=(map @t job)
=<  agent
|%
++  agent
  ^-  agent:gall
  |_  =bowl:gall
  +*  this  .
      def  ~(. (default-agent this %|) bowl)
  ++  on-init
    ^-  (quip card _this)
    `this(s [%2 [%o ~] 0 ~])
  ++  on-save  !>(s)
  ++  on-load
    |=  old=vase
    ^-  (quip card _this)
    ?:  ?=(%1 -.q.old)
      =/  prior  !<(saved-v1 old)
      `this(s [%2 (clean-preferences preferences.prior) revision.prior ~], jobs ~)
    =.  s  !<(saved old)
    =.  preferences.s  (clean-preferences preferences.s)
    `this(jobs ~)
  ++  on-poke
    |=  [=mark =vase]
    ^-  (quip card _this)
    ?>  =(our.bowl src.bowl)
    ?>  =(%json mark)
    =/  j  !<(json vase)
    ?>  ?=(%o -.j)
    =/  action  (text p.j 'action')
    ?:  =('composition' action)
      ?>  =(3 (lent ~(tap by p.j)))
      =/  id  (text p.j 'id')
      ?>  &((gth (met 3 id) 0) (lte (met 3 id) 64))
      =/  value  (~(got by p.j) 'value')
      ?>  ?=(%o -.value)
      =/  existing  (skim records.s |=(r=record =(request.r id)))
      ?^  existing
        ?>  =(input.i.existing value)
        `this
      ?>  (lth (lent records.s) 256)
      =/  label  (text p.value 'label')
      ?>  (lte (met 3 label) 120)
      ?>  (levy (trip label) |=(c=@tD &((gte c 32) !=(c 127))))
      =/  payload  [%o (~(del by p.value) 'label')]
      =/  preview  (compose payload)
      ?>  ?=(%o -.preview)
      ?>  =([%b %.y] (~(got by p.preview) 'eligible'))
      =/  info  p.preview
      =.  info  (~(put by info) 'id' [%s (rap 3 ~['native-' (decimal +(revision.s))])])
      =.  info  (~(put by info) 'createdAt' [%s (scot %da now.bowl)])
      =.  info  (~(put by info) 'requestId' [%s id])
      =.  info  (~(put by info) 'label' [%s label])
      =.  s  s(revision +(revision.s), records (weld records.s ^-((list record) ~[[id value [%o info]]])))
      `this
    ?:  =('preferences' action)
      ?>  =(2 (lent ~(tap by p.j)))
      =/  prefs  (~(got by p.j) 'value')
      ?>  ?=(%o -.prefs)
      ?>  (lte (met 3 (en:json:html prefs)) 8.192)
      ?>  (preferences-valid prefs)
      =/  old  preferences.s
      ?>  ?=(%o -.old)
      =/  merged  (~(gas by p.old) ~(tap by p.prefs))
      =.  s  [%2 [%o merged] +(revision.s) records.s]
      [[[%give %fact ~[/state] %json !>((state-json our.bowl s))] ~] this]
    ?>  =('search' action)
    ?>  =(3 (lent ~(tap by p.j)))
    =/  id  (text p.j 'id')
    ?>  &((gth (met 3 id) 0) (lte (met 3 id) 64))
    =/  q  (decode (~(got by p.j) 'query'))
    =/  entries  ~(tap by jobs)
    =.  jobs  ?:((lth (lent entries) 4) jobs ?~(entries jobs (~(del by jobs) p.i.entries)))
    ?~  star.q
      =.  jobs  (~(put by jobs) id [q 65.536 (search q)])
      `this
    =.  jobs  (~(put by jobs) id [q 1 [0 ~]])
    :_  this
    ~[[%pass [%scan id ~] %arvo %b %wait (add now.bowl (div ~s1 100))]]
  ++  on-watch
    |=  =path
    ^-  (quip card _this)
    ?>  =(our.bowl src.bowl)
    ?>  =(/state path)
    [[[%give %fact ~[/state] %json !>((state-json our.bowl s))] ~] this]
  ++  on-leave
    |=  =path
    ^-  (quip card _this)
    `this
  ++  on-peek
    |=  =path
    ^-  (unit (unit cage))
    ?>  =(our.bowl src.bowl)
    ?+  path  (on-peek:def path)
      [%x %state ~]  ``json+!>((state-json our.bowl s))
      [%x %compositions ~]
        ``json+!>((pairs:enjs:format ~[['total' (numb:enjs:format (lent records.s))] ['items' [%a (turn records.s |=(r=record item.r))]]]))
      [%x %result @ ~]
        =/  id  i.t.t.path
        =/  found  (~(get by jobs) id)
        ?~  found  ``json+!>(~)
        =/  j  u.found
        ?:  (lth next.j 65.536)
          ``json+!>((pairs:enjs:format ~[['pending' [%b %.y]] ['scanned' (numb:enjs:format next.j)]]))
        ``json+!>((response q.j r.j))
      [%x %compose @ ~]
        =/  hex  i.t.t.path
        ?>  (lte (met 3 hex) 2.048)
        =/  body  (slav %ux (rap 3 ~['0x' hex]))
        ``json+!>((compose (need (de:json:html body))))
    ==
  ++  on-agent  on-agent:def
  ++  on-arvo
    |=  [=wire =sign-arvo]
    ^-  (quip card _this)
    ?.  ?=([%scan @ ~] wire)  (on-arvo:def wire sign-arvo)
    ?.  ?=([%behn %wake ~] sign-arvo)  `this
    =/  id  i.t.wire
    =/  found  (~(get by jobs) id)
    ?~  found  `this
    =/  j  u.found
    ?:  (gte next.j 65.536)  `this
    =/  stop  (min 65.536 (add next.j 1.024))
    =/  res  (star-chunk q.j next.j stop r.j)
    =.  jobs  (~(put by jobs) id [q.j stop res])
    ?:  =(stop 65.536)  `this
    :_  this
    ~[[%pass wire %arvo %b %wait (add now.bowl (div ~s1 100))]]
  ++  on-fail  on-fail:def
  --
++  state-json
  |=  [host=@p s=saved]
  ^-  json
  %-  pairs:enjs:format
  :~  ['ship' [%s (scot %p host)]]
      ['nativeAuthority' [%b %.y]]
      ['preferences' preferences.s]
      ['revision' (numb:enjs:format revision.s)]
      ['compositionsCount' (numb:enjs:format (lent records.s))]
  ==
--
