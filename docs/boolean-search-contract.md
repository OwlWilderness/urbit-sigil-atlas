# Mixed AND/OR search — implementation contract

Status: implemented and qualified. Current source/receipt bindings are recorded in docs/verification.json; backend tests and real desktop/mobile Workshop integration passed.

The user chose separate AND/OR choices between active boxes, allowing mixed combinations. Eye/eye-off replaces checked/empty visual search icons; retain real accessible checkbox semantics and values. Hide Copy buttons for now; keep artwork selection and native drag-copy, trash clear and Clear all.

## Shared frontend/backend contract

- Candidate predicates remain positional p0/shape0 through p3/shape3. A slot is active only if a predicate for it is supplied. Within one slot, simultaneous exact and shape constraints still intersect.
- New optional URL parameters `join1`, `join2`, `join3` accept exactly lowercase `and` or `or`, default `and`. joinN is the operator BEFORE active zero-based slot N, linking it to the previous active slot. Example p0=rad&p2=bot&join2=or means Box1 prefix rad OR Box3 prefix bot. Slots1/3 (human boxes2/4) are absent, not always-true OR operands.
- Only supply joinN for an active slot with an earlier active slot. Explicit dangling operators, unknown/duplicate keys and invalid operator spellings return400. There is no join0.
- Ignore omitted/empty/eye-off slots entirely. With no active predicates and no operators, retain the existing unconstrained endpoint behavior. One active slot needs no connector.
- AND has higher precedence than OR. A AND B OR C AND D means (A AND B) OR (C AND D). OR is inclusive: matching both groups is included once. No arbitrary parentheses UI in this slice.
- Default all-AND is backward compatible. Keep response shape unchanged: star,total,offset,limit,items,availabilityChecked:false. Global lexical tuple ordering, numeric-ID ordering for selected star, canonical planet exclusion and deterministic pagination remain unchanged. The selected star applies outside the entire Boolean expression, never as an OR operand.
- Frontend persists joins=[and,and,and] in a new independent key; joins[N-1] corresponds to joinN. Validate stored values and preserve existing slots/masks/mode/star. Render stable connector controls only between active filled enabled boxes. DOM selector data-join-before=N and accessible name Join before box N+1. For example data-join-before=2 joins human box3 to its previous active box. If an intermediate box is disabled, its predicate/connector disappear while the following active destination keeps its stored operator. Reenabling restores it.
- Show a readable grouped expression and concise AND-before-OR explanation. In shape-family mode label actual shape predicates, not misleading literal-only matches. Changing a join resets pagination and cancels stale requests without modifying values/masks/preview identity.
- Frontend may omit default AND parameters to keep the existing server compatible during implementation; OR must be explicitly encoded. Only send operators for active destination slots with a predecessor.

## Runtime / ownership

Backend worker alone owns server code/tests and docs/api.md/api-examples. Frontend worker alone owns app/controller/CSS/workshop template and frontend tests/docs. Backend never regenerates site files or controls the running server. Frontend may build static output but seals only its own workshop/front-end closure, not API HTML/reference generated from concurrently edited documentation. Parent owns final site build, integrated runtime restart/readback, packaging and checkpoint/resume.

Backend must count/page global OR unions without scanning or allocating the roughly four-billion-name universe; a bounded truth-mask/digit-DP or equivalent exact disjoint method is appropriate. Independently test union/intersection, precedence, duplicate avoidance, final/high-offset pages, canonical exclusions, star restriction and strict input refusals. Reuse unaffected assets and do not mutate var/ or user browser storage.
