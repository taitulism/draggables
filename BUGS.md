# BUGS.md

Bugs and small stuff in `draggables`. Worst first. Claims cite `file:line`. The important ones are fixed.

These are the concrete, near-term fixes — the starting point before the pivot.
Architecture/abstraction items live in [GRILL.md](GRILL.md); the overall plan is in [pivot.md](pivot.md).

## Strong (real bugs / design holes)

### 1. [FIXED] `destroy()` during an active drag leaves `user-select: none` stuck on the boundary
[Draggables.ts:83](src/Draggables.ts#L83) sets `user-select: none` on the dragzone at drag start; only [onDrop](src/Draggables.ts#L145) removes it. [destroy()](src/Draggables.ts#L31-L49) removes the window listeners but never calls `removeProperty('user-select')` on the active dragzone. So tearing down an instance mid-drag (e.g. component unmount while the pointer is down) permanently freezes text selection on that container — the element that was the boundary can no longer be selected by the user, with no surviving handle to fix it. No test exercises destroy-mid-drag, so it's invisible.

**Why it bites:** a page-level style leak outlives the instance that caused it; the consumer can't undo it short of a reload, and the common trigger (unmount mid-drag) is exactly what a SPA does routinely.

Summary:
cleanup `user-select` on drop.


### 2. [FIXED] `data-drag-active` is documented but never set
[Draggables.ts:43](src/Draggables.ts#L43) *deletes* `elm.dataset.dragActive` in `destroy()`, but nothing in the codebase ever assigns it (`grep dragActive src/` → only the delete). The delete is a teardown step for a "currently dragging" attribute that no code path ever sets, so it's an abandoned/half-wired feature: the obvious CSS hook for styling the active-drag state (`[data-drag-active]`) never matches anything, and the dead delete misleads any future reader into thinking the attribute is live.

**Why it bites:** the only intended hook for styling the dragging state silently never fires — consumers ship `[data-drag-active]` CSS that does nothing and have no working way to style an in-progress drag.

Summary:
`data-drag-active` is documented but never set
Its purpose: mark "currently dragging"

Notes:
* decide if i need it.
* trello task shows i removed it intentionally.
* It wasn't documented at all, just had one leftover. DELETED.

### 3. [FIXED] Mid-drag disable check reads the wrong element
[Draggables.ts:95](src/Draggables.ts#L95) gates `onDragging` on `isDisabled(evTarget.dataset)` where `evTarget = ev.target` — the element currently under the pointer, not the element being dragged. During a drag the pointer can be over any descendant or sibling. Consequence: toggling `data-drag-disabled` on the dragged element mid-drag does nothing, while dragging the pointer over an unrelated element that happens to carry `data-drag-disabled` silently freezes the drag. The intended target is `activeDrag.elm`. It's masked today only because the `isEnabled` check on the same line covers the `.disable()` path, and no test sets the *attribute* mid-drag.

**Why it bites:** `data-drag-disabled` becomes nondeterministic mid-drag — behavior depends on whatever element happens to sit under the cursor, so drags freeze or refuse to freeze with no pattern the consumer can predict.

Summary:
Bug: `event.target` is not always the draggeble elm.

**Open question surfaced by the fix — what *should* disabling mid-drag do?**
Current behavior is a *freeze*: the element stops following the pointer but the drag stays live.
Re-enabling mid-gesture then makes the element jump, since position is computed from the original
grab point, not incrementally.

Considered and rejected:
* *Drop the feature, let consumers remove `data-drag-role` instead* — destructive: the consumer must
  then store the element's axis/grip config to restore it, and the grab lookup walks up to the
  parent draggable, so disabling a child can make its parent grabbable.
* *Use the vanilla `disabled` attribute* — form-controls only, invalid on a `div`.

Decision: **abort + cleanup**. End the drag, fire `dragEnd` if it had started so save-on-drop
consumers keep the position.

### 4. [FIXED] `dragEnd` reports the wrong position when the element ends at 0
[Draggables.ts:139-140](src/Draggables.ts#L139-L140): `const translateX = moveX || prevX`. If a drag returns the element exactly to translate `0` on an axis (`moveX === 0`), the `||` falls back to `prevX`, so `dragEnd`'s `relPos` reports the pre-drag offset instead of `0`. A consumer persisting position on `dragEnd` saves stale coordinates whenever the user drags back to origin.

**Why it bites:** save-on-drop silently corrupts persisted position for the one gesture (return to origin) a user is most likely to perform deliberately.

Summary:
Bug: when dragged to `0` - value is falsy and fallsback.

Notes:
* fix
* one of three surfacings of the missing model layer — see [GRILL.md](GRILL.md) A8

### 5. [FIXED] `relPos` is misnamed and inconsistent across events
The field is typed `relPos` ([types.ts:13](src/types.ts#L13)) implying "relative to grab", but every payload after `grab` carries the *accumulated* translate — the running offset from the element's DOM position, across all drags (`prevX + move`, [Draggables.ts:122](src/Draggables.ts#L122),[130](src/Draggables.ts#L130),[147](src/Draggables.ts#L147)). Meanwhile `grab` hardcoded `[0, 0]` ([Draggables.ts:93](src/Draggables.ts#L93)) even when the element already had a translate offset, so a `grab` handler couldn't read the starting position.

**Why it bites:** `grab` can't see where the element is, and the name suggests a delta-from-grab that the number never was.

Summary:
`grab` reported `[0, 0]` regardless of the element's actual position.

Notes:
* FIXED: `grab` now reports the current accumulated translate.
* The naming/semantics question (accumulated vs. delta-from-grab) is deferred to the pivot — this behavior is likely to change with the refactor.
* related: [GRILL.md](GRILL.md) A6 (no position source of truth)

## Medium

### 6. Invalid `data-drag-axis` silently freezes the element
[internals.ts:96](src/internals.ts#L96) casts `dragAxis as DragAxis` with no validation. Any value other than `x`/`y` (typo, `"z"`, leftover `"both"`) makes both [Draggables.ts:112-113](src/Draggables.ts#L112-L113) branches evaluate to `0`, so the element is grabbable but immovable, with no error. Hard to diagnose from the consumer side.

**Why it bites:** a one-character markup typo produces a grabbable-but-frozen element and zero error pointing at the cause.

Summary:
html attribute value validation

Notes:
* fix
* symptom of the untyped-DOM-config half — see [GRILL.md](GRILL.md) A1

### 7. `padding` and `cornerPadding` are mutually exclusive
[internals.ts:64-80](src/internals.ts#L64-L80): if `padding` is truthy the function returns before the `cornerPadding` block is ever reached. You can't have both edge and corner dead-zones, and nothing in the API or types signals this — a caller setting both just silently loses `cornerPadding`.

**Why it bites:** a valid-looking config silently drops one option; the consumer gets behavior they didn't ask for with no signal as to why.

Summary: 
When using both configs, `padding` and `cornerPadding`, only `padding` is checked. `cornerPadding is ignored.

Notes:
* rethink
* rename
* bug or feature? is precedence mentioned in docs?

### 8. One handler per event, replace-not-add
[Draggables.ts:66](src/Draggables.ts#L66) overwrites `this.events[eventName]`. Two consumers (or two concerns in one app) calling `.on('dragEnd', …)` means the second silently clobbers the first. Standard `addEventListener` semantics are additive; this surprises in any non-trivial integration and forces callers to multiplex by hand.

**Why it bites:** two parts of an app listening on the same event silently clobber each other — order-dependent, no warning, painful to trace.

Summary:
One event handler per event. Bug or a feature?

Notes:
* rethink.
* the original intent was for this to be a feature, not a bug, to force consumers to handle instance events in one place.
* decision depends on [GRILL.md](GRILL.md) A2/A3

### 9. Two public entry points, no signal which one to use
`export * from './Draggables'` ([index.ts:4](src/index.ts#L4)) exposes the class next to the `draggables` factory. Strict core + convenient wrapper is a fine pattern; the issue is only that nothing marks the factory as the intended path.

**Why it bites:** mild. Nothing behaves wrong — just an unclear API surface.

Summary:
Public API improvment

Notes:
* meh. fix public api, don't expose the class or use a static fn for creation.
* see also [GRILL.md](GRILL.md) A7
