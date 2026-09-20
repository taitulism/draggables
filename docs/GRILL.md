# GRILL.md

Architecture & abstractions critique of `draggables`. Claims cite `file:line`.

Bugs, small stuff and test gaps moved to [BUGS.md](BUGS.md) — those are the near-term fixes.
This file is the to-be-discussed half; the plan it feeds is [pivot.md](pivot.md).
Numbering kept as-is (A1–A8); bug numbers referenced below (#N) live in [BUGS.md](BUGS.md).

## Architecture & abstractions

### A1. Configuration locus is split arbitrarily between DOM attributes and a JS options object
Axis, disabled, boundary, and role live in `data-drag-*` strings read at event time ([internals.ts:31](../src/internals.ts#L31),[89](../src/internals.ts#L89)), while `padding`/`cornerPadding` are the *only* things in the JS `DraggablesOptions` ([types.ts](../src/types.ts), [index.ts:7](../src/index.ts#L7)). There's no principle behind the split — padding is per-instance JS, but axis (equally a per-element knob) is markup. The DOM half is untyped: every read is a string cast (`dragAxis as DragAxis`, [internals.ts:96](../src/internals.ts#L96)), so typos are silent (bug #6), there's no autocomplete, and config is scattered across HTML the library doesn't own. A consumer configuring drag behavior has to know which knobs are "attribute knobs" and which are "options knobs" with no discoverable rule.

**Why it bites:** there's no single place to configure a draggable, and half the knobs get no type-checking or autocomplete — so misconfiguration shows up at runtime instead of compile time.

Summary:
Some configs are the draggable elm concerns and some are instance concerns.

Notes:
* tl;dr but i think it's intentional. 

### A2. `on`/`off` reimplements `EventTarget` and loses to the platform
The custom registry ([Draggables.ts:59-69](../src/Draggables.ts#L59-L69)) holds exactly one handler per event name, throws on unknown names at *runtime* instead of compile time, and has no `once`/multiple-listener support (bug #8). The same behavior is available for free by dispatching `CustomEvent`s on the dragged element (or extending `EventTarget`): it would compose with existing DOM tooling, allow multiple independent listeners, and bubble through the delegation tree the library already relies on. The hand-rolled abstraction is strictly weaker than the thing it replaces.

**Why it bites:** you reimplement a platform primitive worse — no multiple listeners, no `once`, errors deferred to runtime — for zero gain, and every consumer inherits those limits.

Summary:
Single event.

Notes:
* how it should throw on compile time? it has an event type
* if no more single event (bug #8) - consider the suggested approach.

### A3. Instance-level events fight the delegation model
The whole point of the design is one instance delegating for many draggables via a single `pointerdown` listener on the context ([Draggables.ts:28](../src/Draggables.ts#L28)). But the 4 event handlers are stored once on the instance ([Draggables.ts:21](../src/Draggables.ts#L21)), so all draggables under a context share one `dragEnd`, etc. With N draggables needing different behavior, the consumer must `switch (ev.elm)` inside a single handler. The one-listener *implementation* win leaks out as a per-element ergonomic *loss* — the event API doesn't scale to the multi-element scenario the library exists for. Per-element events (A2) would resolve both.

**Why it bites:** the more draggables you have — the library's whole reason to exist — the worse the API gets; every handler degenerates into a manual `switch` dispatch table.

Summary:
all draggables (within instance context elm) have the same event listeners.

Notes:
* by design but discussable (later)
* pivot/refactor might make this irrelevant

### A4. Single `activeDrag` field makes concurrent drags structurally impossible
[Draggables.ts:22](../src/Draggables.ts#L22) holds one `ActiveDrag?`. Combined with global `window` listeners and no `setPointerCapture` (`grep -r setPointerCapture src` → none), a second `pointerdown` mid-drag overwrites the in-flight drag's state. An instance that delegates for many elements still can't track two pointers at once — multi-touch dragging two elements is ruled out by the data model, not just unimplemented. Pointer capture would also fix lost-pointer-over-iframe and out-of-window release cases that the bare window listeners miss.

**Why it bites:** multi-touch / concurrent drags are impossible by construction (not just unimplemented), and a dropped pointer leaves a drag wedged with listeners still attached.

Summary:
Concurrent drags - future feature

Notes:
* what's `setPointerCapture`?

### A5. Boundary geometry is snapshotted once and goes stale
`createActiveDrag` captures both the element box ([Draggables.ts:77](../src/Draggables.ts#L77)) and `dragzoneBox = getBoundingClientRect()` ([internals.ts:95](../src/internals.ts#L95)) at drag start, then `keepInBoundary` clamps against those frozen rects for the whole drag ([internals.ts:117-142](../src/internals.ts#L117-L142)). Any scroll or layout shift during the drag (auto-scroll near an edge, async content load, sibling resize) makes the clamp wrong — the element clips against where the boundary *used to be*. The boundary abstraction silently assumes a static viewport, which is exactly false for the long-list drag cases boundaries are meant for. It also mixes coordinate spaces: `clientX/Y` (viewport) drives `translate` (layout-relative), only coincidentally correct while nothing scrolls.

**Why it bites:** clamping silently goes wrong the instant the page scrolls mid-drag — precisely the long-list / scrollable-container case boundaries are meant to handle.

Summary:
draggable's and dragzone's boxes are taken only on drag start and assume to stay static during the whole drag.
True, but i prefer not to read box on `mousemove`.

Notes:
* Think of another way

### A6. Position has no source of truth except the CSS string
The element's current offset is never retained on the instance; each drag start re-parses it out of `getComputedStyle().translate` via `split(' ')` + `parseInt` ([internals.ts:105-112](../src/internals.ts#L105-L112)). This hard-couples the library to the consumer using the `translate` property specifically (not `transform: translate`, not `top/left`) and to px units — a `translate: 10%` or a class-driven translate is mis-read as `10px`. There's also no API to read, set, or reset an element's position programmatically (restore-on-load is pushed back onto the consumer as "set the inline `translate` style yourself", [README.md](../README.md)). The position abstraction is a stringly-typed read-modify-write on one CSS property with no layer in front of it.

**Why it bites:** position can't be read or set programmatically at all, and any consumer not using px `translate` gets silently mis-parsed coordinates.

Summary:
Tight coupling with DOM (CSS).
This is the first thing to change in the refactor/pivot.

Notes:
* fix

### A7. The factory overload exists to paper over a context concept that barely earns its place
`draggables(elmOrOpts?, opts?)` ([index.ts:11-18](../src/index.ts#L11-L18)) is overloaded purely so the context element can be omitted. But the context element only determines *where one listener is attached*; boundaries are resolved independently per-element via `closest([data-drag-zone])` ([Draggables.ts:80](../src/Draggables.ts#L80)). So a concept that is really "listener attachment point" is promoted to the first positional argument and given overload complexity, while the exported `Draggables` constructor (bug #9 in [BUGS.md](BUGS.md)) demands it non-optionally — two entry points disagreeing on whether context even matters.

**Why it bites:** API complexity (an overload plus two entry points) for a concept that doesn't affect drag behavior, forcing users to reason about something that ultimately doesn't matter.

Summary:
Confusing, I don't get the point. May be a duplicate of Bug #9.

Notes:
* See Bug #9 in [BUGS.md](BUGS.md)

### A8. `ActiveDrag` is a god-bag with no model layer behind it
[types.ts](../src/types.ts)'s `ActiveDrag` bundles four unrelated concerns into one mutable struct: lifecycle flags (`hasStarted`), element refs (`elm`, `dragzoneElm`), *frozen* geometry (`box`, `dragzoneBox`), and *live* per-move deltas (`moveX/Y`, `prevX/Y`). It's mutated in place across all three handlers ([Draggables.ts:121](../src/Draggables.ts#L121),[126-127](../src/Draggables.ts#L126-L127)), and nothing in the type marks which fields are stable for the drag's lifetime vs. which churn every `pointermove` — a reader has to trace all three handlers to know. This is the shared root cause: there is no model layer at all. DOM + the `translate` string + this one bag *are* the state, which is why staleness (A5) and the CSS-string-as-memory round-trip (A6) and bug #4 ([BUGS.md](BUGS.md)) are three surfacings of the same missing abstraction.

**Why it bites:** one mutable bag with no stable-vs-live boundary means any change risks the others, and the absent model layer is the common root of A5, A6, and bug #4 — fix it once, three symptoms go away.

Summary:
Confusing, I don't get the point.
Yes, it's a god bag but I don't get "a reader has to trace all three handlers to know" - know what? "This is the shared root cause" - cause of what? "there is no model layer at all" - what for?

Notes:
* idk

## Direction: extract a headless gesture core

Most of the A-section (A2/A3/A6/A8) collapses into one move: pull the gesture logic out of the DOM layer into a standalone, DOM-agnostic **core** that other packages (`resizables`, a scrollbar/minimap, framework components) can share.

**What the core is:** a gesture state machine. Input = `down(x,y)` / `move(x,y)` / `up(x,y)` as plain numbers (not `PointerEvent`). Config = threshold + axis-lock. Output = `press` / `start` / `move{x,y,dx,dy}` / `end` events via a tiny dep-free emitter (not `EventTarget` — core must run in non-DOM environments). Coordinate-space agnostic; the consumer maps units. This is ~the logic already inlined in [onDragging](../src/Draggables.ts#L92-L128), and `ActiveDrag` minus `box`/`dragzoneBox` is already most of its state.

**What stays out of core (binding layer = `draggables`):** `PointerEvent`→core adapter, role/grip resolution and delegation ([getDraggable](../src/internals.ts#L25)), padding hit-testing, CSS `translate` movement ([moveElm](../src/internals.ts#L21)), reading computed translate, `user-select`.

**The trap — keep constraints out of core:** [keepInBoundary](../src/internals.ts#L117) is both DOM-specific and use-case-specific (resize clamps to min/max size, a scrollbar to track length, a minimap to map bounds — none is "box inside a box"). Baking it into core re-couples it to the draggables use case and kills reuse. Constraints belong consumer-side, or as a pluggable `(rawPos) => constrainedPos` the core calls.

**Distance from here:** conceptually close, structurally not started. The kernel math is written and correct but married to `ev.clientX` and entangled with clamp + DOM throughout `onDragging`; severing that is the work.

**Process pushback:** don't design the core top-down for hypothetical consumers — one consumer can't reveal the right seams. Extract it *while* building the second real consumer (`resizables`) so the boundary is validated, not guessed. Re-exposing the core emitter at the binding also resolves A2 (multi-listener) for free.
