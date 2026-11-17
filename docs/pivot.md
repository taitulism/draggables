pivot.md
========
Main entry point for the `draggables` pivot. Work spans multiple chats — read this first.

The library was built for one project; I want it reusable. This is a big refactor — a re-shuffle, new decisions, **breaking changes expected**. The core change: emit on drag move instead of writing CSS `translate`. Movement becomes the consumer's job; the library reports the gesture.

The decisions below are settled — don't re-litigate them. Items marked **Open** are the exceptions.


Plan
----
Each chunk lands green — nothing half-broken.

Per chunk, in order: red test → code → green test → playground → my approval to move on.
The playground is part of the chunk: each step has to be playable before the next one starts.

Green is the default. If a chunk can't land green — or only can by keeping code that the pivot should be deleting — raise it and stop. Old tests don't get to veto the new design; the call is mine.


### The pivot
Old code only gets deleted or archived.

1. **Core, pure, no DOM** — `src/core/Drag.ts`. `new Drag(opts)` → `start` / `move` / `end` / `cancel`.
   Unit tests, no browser needed. Nothing else changes yet; core is unused. **Done.**

2. **Build `drag()` fresh, beside `Draggables`** — contextElm + target resolver, driving core `Drag`, emitting `dx/dy/x/y`. New tests assert emitted numbers — the library no longer moves anything. Old `Draggables` and its tests stay untouched and green. **Done.**
   Dirs: `src/dom/`, `tests/dom/`, `playground/`.
   Instance API: `on` / `off` / `destroy` — `enable` / `disable` were removed — toggle a class and exclude it in the `target` selector.

3. **Swap** — each sub-chunk waits for my approval.

   1. **Role resolver** — old tests covering rules that survive are rewritten against an exported role resolver. One sub-step per rule, approval after each. **Superseded** — the role attrs were dropped after 3.5, see [Primitive](#primitive-one-contextelm--a-target-resolver):
      1. `data-drag-role="draggable"` **Done.**
      2. grip **Done.**
      3. `data-drag-disabled` **Done.**

      Any other surviving rule found in the old tests gets its own sub-step.
   2. **Exports** — point to `drag()`. **Done.**
   3. **Port surviving tests** — old tests with no `drag()` equivalent yet, rewritten against `drag()`. One spec file at a time, approval after each. List: [Port list](#port-list).
      Then split `drag.spec.ts` into the same files and delete it. **Done.**
   4. **Archive** — `Draggables`, `internals.ts`, the old tests and the old playground move to `archive/` as-is, for reference (`moveElm`, `keepInBoundary`, `axis`, `dragzoneBox`, `relPos` go with them). Excluded from lint, typecheck and tests; imports aren't fixed.
      `src/types.ts` is copied, not moved — test helpers still import `Point` / `DragAxis`. **Done.**
   5. **Playgrounds** — become the reference. One page per case under `playground/`, core is `index.html`; `shared.ts` holds nav, log and threshold. Kanban waits for dropzones (6). **Done, but I took some notes to resolve.**

      Playgrounds notes (to discuss):
        - resize: `.handle` is like a grip. consider data-attr. The real issue is passing the `target` option bypasses the `draggable/grip/disabled` attrs handling, which i'm now thinking about removing completly. That's a big change and it means the user will have to write their own target resolver.
          **Resolved:** attrs dropped; `handle` option + `ev.handle`. See [Primitive](#primitive-one-contextelm--a-target-resolver).
        - i'm not loving 'drag's event shape `ev.ev`
          **Resolved:** type renamed `DragData`, handler param `dragData` → `dragData.ev`.
        - resize: can escape container. how to contain?
          **Resolved:** exported `clamp(n, min, max)`. See [Clamping](#clamping).
        - axis/notes: clamp/max/containment is on `onDragging`. Add parent selector?
          **Resolved:** ~~`dragData.clampTo(container)`~~ `container` option, element or selector. See [Clamping](#clamping).

   6. **Recipes** — consumer-side playground examples for the deleted features. One sub-step each, approval after each:
      1. ~~moving the element (was `moveElm`)~~ **Deprecated.**
      2. keeping it in a boundary (was `keepInBoundary` / `dragzoneBox`)
         **Done.** Notes and axis slider use the `container` option. See [Clamping](#clamping).
      3. locking an axis (was `axis`)
         **Done.** Slider writes only `left`; splitter reads only `dy`.
      4. accumulating position across drags (was `relPos`)
         **Done.** Covered by `translate: true` (`tx/ty`); tested in `clamping.spec.ts`.

7. **`button` option** — `drag(el, {button: 2})`, default `0`, applies to every target kind. **Done.**


Decisions log
-------------
_(append decisions here as they're made, so later chats don't re-litigate them)_


### Move event payload
```js
{ dx, dy,    // since drag start; clamped when the `container` option is set
  x, y,      // current pointer, client px
  left, top, // start offsetLeft/offsetTop + dx/dy
  containerX, containerY, startContainerX, startContainerY,  // with `container` or `bound: 'pointer'`
  tx, ty }   // start translate + dx/dy; with `translate: true`
```

Optional fields are typed by the options: `DragData<O>` makes them required when the matching option is passed. Exception: a `container` selector that matches nothing leaves the container fields `undefined` (see [Clamping](#clamping)).

No incremental delta (since-last-move): it bakes clamping into the state it reads next frame, and it's derivable as `dx - prevDx`.

`grab` fires before movement, so `dx: 0, dy: 0`.

Every drag starts at `dx: 0`. The old computed-`translate` read on grab goes — consumers accumulate (or opt in with `translate: true`).

`relPos` is deleted — it was the accumulated CSS translate. Resolves Bug #5.

`DragEventWrapper` becomes one `DragData` type for all events: `{ev, elm, handle, ...payload}`. Named `DragData`, not `DragEvent`, to avoid shadowing the DOM's global `DragEvent`, and so handler params are named `dragData` (not `ev`, which made `ev.ev`).

Values are raw, not rounded. `clientX/Y` are fractional under page zoom or OS scaling; rounding is the consumer's call.


### Drop targets
**Superseded:** not an option — exported helpers in `src/utils/dropzones.ts`, next to `clamp`. The lib reports the gesture; hit-testing is the consumer's, from `x/y`. The consumer knows when zones render, scroll or change; the lib doesn't.

- `findDropzone(x, y, selector, exclude?)` — live: `elementsFromPoint`, respects stacking and zones added mid-drag. Forces a reflow per move when the consumer moves the element.
- `measureZones(selector, exclude?)` + `hitZone(zones, x, y)` — cached: measure on `dragStart`, no DOM reads per move. Innermost wins (`findLast` in document order). Ignores `z-index`; re-call `measureZones` for zones added or scrolled mid-drag.

Both return the element or `null`. `exclude` skips the dragged element and its descendants. No `overlap` strategy for now.

```js
let zones
drag(board, {target: '.note'})
  .on('dragStart', () => zones = measureZones('.trash'))
  .on('dragEnd', ({x, y, elm}) => { if (hitZone(zones, x, y)) elm.remove() })
```

A container isn't a default dropzone: a clamped element is always inside it, so it would carry no info.

Playground: trash zone on the notes board.

#### Superseded: `dropzone` option

A `dropzone` selector option, not an attribute (no magic attrs — see [Primitive](#primitive-one-contextelm--a-target-resolver)). `dragEnd` reports the target like `dragging`, re-tested at the pointerup position rather than reusing the last move's.

Strategy: `'pointer' | 'overlap'` (option name open). Opt-in — no `dropzone` selector means no hit-testing and no `dropzone` field, so resize and scroller consumers pay nothing for a DOM read per move.

- `pointer` — `elementsFromPoint(x, y)` (plural), first `dropzone` match that isn't the dragged element. Plural avoids mutating `pointer-events` on the dragged element, and survives consumer overlays sitting on top.
- `overlap` — dragged element's box against each dropzone; largest overlap area wins (not DOM order — that would let a 2px overlap earlier in the markup beat the intended zone).

Hit-tested continuously, exposed on the `dragging` payload as `dropzone` (the element, or `null`).
No id — the consumer reads whatever it needs off the element. Consumers derive transitions by comparing against the previous value.

`dragStart` carries it too, giving consumers the origin zone for "moved from A to B".


### Clamping
- `container` option — `drag(el, {container})`. `dragData.dx`/`dy` arrive clamped so the dragged element stays inside `container`'s padding box. For moving things: notes, a slider thumb. Works with `left`/`top` and `translate` alike, since it's a delta.
- `instance.refreshContainerBounds()` — re-reads the container's rect mid-drag (scroll, resize).
  No-op without an active drag.
- `bound: 'pointer'` option — clamps the pointer instead of the element's box, and adds `containerX/Y` / `startContainerX/Y` (pointer relative to the container). Without `container`, the container is the dragged element itself. For drawing and resizing: a selection rect, a gesture line, resize handles.
- `translate: true` option — reads the computed `translate` on grab, adds `tx/ty`.
- `clamp(n, min, max)` — exported for everything else: a splitter, min/max sizes.

`container` is an element or a selector (matched against the dragged element's ancestors). No match → a `console.warn` on grab, and the unclamped value.

Rects are cached on grab — the dragged element's and the container's — so moves do no DOM reads (a rect read after the consumer writes `left`/`top` forces a reflow per move). The dragged element is never re-measured mid-drag: its rect would include the movement. One container per drag; to span several, use their common parent. `dragData.clampTo()` and `clampPointTo()` are removed.


#### ~~Known bug: `clampTo` with a container that isn't the positioning parent~~ **Fixed** by the `container` option
`clampTo` builds `left`/`top` from `offsetLeft`/`offsetTop`, measured from the element's positioning parent (`offsetParent`, the nearest ancestor with `position` set). It caps them by the container's size, as if they were measured from the container's edge. When the two edges don't line up, the allowed range shifts by the gap between them: one side stops early, the other overshoots.

Board 300px wide, a wrapper (the positioning parent) starting 50px into it, a 100px note:

```
board:    0                                   300
          ├───────────────────────────────────┤
wrapper:       50
               ├──────────────────────────────...
               ↑ note's `left` is measured from here

clampTo(board) → max left = 300 - 100 = 200

note at left=200 (from wrapper):
               ├────── 200 ──────┤
board coords:  50               250      350
                                 ┌─────────┐
                                 │  note   │
                                 └─────────┘
                                       ↑ 300 = board's edge
                                       note sticks out 50px
```

Same at the other end: `left=0` lands at board x=50, 50px short of the edge.

Also hit when the element is moved with `transform`/`translate`: `offsetLeft` ignores transforms, so the start position is wrong.

Fix: clamp the delta using screen rects (`getBoundingClientRect`), both on grab:

```ts
const minDx = containerRect.left - elmStartRect.left;
const maxDx = containerRect.right - elmStartRect.right;
left = startLeft + clamp(dx, minDx, maxDx);
```

Screen rects share one origin, so the positioning parent no longer matters.

Drops: `keepInBoundary`, `dragzoneBox`, `axis` — including the `data-drag-axis` attribute. It's `if (dy) dy = 0` in a handler the consumer already writes, and an axis is a runtime decision (which edge of a resize was grabbed).
Removed: `padding`, `cornerPadding` — consumers do it in a `target` function. `data-drag-zone` / `dragzoneElm` are dropped — `user-select` is always set on `<body>`.

Consumer side:

```js
drag(board, {target: '.note', container: board})
  .on('dragging', ({elm, left, top}) => {
    elm.style.left = `${left}px`
    elm.style.top = `${top}px`
  })
```


### Structure
`moveElm` goes — the library doesn't touch the DOM's position.

`src/core/` (gesture math, no DOM) + `src/dom/` (PointerEvent listeners, target/handle resolving, `user-select`) + `src/utils/` (`clamp`, dropzone helpers). One package. `core/` never imports `dom/`, so a package split later is a folder move. Split when a second real consumer appears.

Core emits `{dx, dy, x, y}`; `dom/` adds `elm` and `handle` before the consumer sees it.

Start threshold lives in core, configurable via `threshold`, default 3px.

`dom/` drives core and owns the emitter. Core's methods return what happened.

Core is a reusable `Drag` class with `#private` state: config in the constructor, one gesture per `start()`. It returns plain positions; `dom/` names the events.

```ts
const d = new Drag({threshold})   // state: idle
d.start(x, y)                     // idle → pending
d.move(x, y)                      // → {isStart, dx, dy, x, y}, or null below threshold; pending → dragging on threshold
d.end(x, y)                       // → {dx, dy, x, y}, or null if it never started; → idle
d.cancel()                        // → true if it was dragging; Esc, pointercancel, destroy; → idle
```

`move` / `end` / `cancel` throw while idle.

`dragEnd` recomputes `dx/dy` from the pointerup position rather than reusing the last move's. The pointer can travel between the final `pointermove` and `pointerup` — a fast flick, coalesced events, a release just past a dropzone edge — and the consumer would commit a stale position. Two subtractions.

Synchronous and testable without subscribing. Multiple listeners are a binding-layer concern.
Core state is just `startX`, `startY`, `state`, plus the `threshold` config.

One core instance per `drag()` instance, reused across gestures. Multi-touch would need one per `pointerId`.

`end` returns `null` if the threshold was never passed (a plain click).

`dragCancel` is its own event, not a flag on `dragEnd` — consumers hold the DOM, so an abort has to tell them to revert. Unrelated to the threshold; don't fold the two together.

Fired by Esc, and by `destroy()` mid-drag: destroy aborts and cleans up.

`pointermove` / `pointerup` / `keydown` listeners are bound on `window` at grab and removed on drop or cancel. `setPointerCapture` is under [Think about](#think-about).

`dragStart` reports the real `dx/dy` — already ~3px, so the element jumps by the threshold on the first write. Below perceptual threshold, and the only option that keeps the element under the cursor.
Zeroing them, or re-origining at the break, trades that invisible jump for a permanent 3px trail.

**Touch:** see [TODO](#todo).


### Primitive: one contextElm + a target resolver
One primitive for every case (notes, kanban, resize, mouse gesture, rect drawing). Free-hand drawing is out of scope; rect drawing is in — it needs only the start and current point, not a path.

```js
drag(canvas)                                    // contextElm is the dragged thing (rect, scroller, splitter)
drag(area, {button: 2})                         // gesture
drag(board, {target: '.note:not(.locked)', handle: '.grip'})
drag(panel, {handle: '[data-side]'})            // resize; reads ev.handle
drag(board, {target: (ev) => HTMLElement | null})  // escape hatch
```

The resolver gets the whole `PointerEvent` (padding needs `clientX/Y`, gesture needs `button`) and returns the element to drag, not a boolean — a grip resolves to its draggable. `null` means no drag.

Runs once, at pointerdown.

**No magic attrs.** The `data-drag-role` / grip / `data-drag-disabled` / `data-drag-zone` attrs are dropped. Built-in role resolving was opinionated and would keep growing (resizable roles, custom role names…). Plain selectors cover it: disabling is `:not(...)`, grip-only is `handle`.

- No `target` → contextElm.
- `target` selector → closest match inside contextElm.
- `handle` selector → drag only starts on a handle inside contextElm; the dragged element is the `target` closest to it (or contextElm). Exposed as `ev.handle` (`=== elm` when unset).
- `target` function → replaces both; `handle` is ignored, `ev.handle === elm`. Returning `{elm, handle}` is a possible later, additive extension.
- `button` (default `0`) applies to every kind, functions included.

`handle` is string-only — a function `target` already covers anything a handle function could.

Tests: `tests/dom/construct-destruct.spec.ts` (options).

Core `Drag` stays as a private helper of this layer. It owns the state and the threshold; `drag()` drives it and emits. Revisit if a non-pointer input (keyboard dragging) appears.

One handler per event stays (Bug #8). Going to many is additive, not breaking, so it can wait for a real need — a framework wrapper or a second consumer competing for the same event.


Port list
---------
Old tests with no `drag()` equivalent yet (3.3). New files mirror the old split, under `tests/dom/`.

`dragging.spec.ts`
1. emits nothing on move before pointerdown or after pointerup (was "only moves when supposed to")
2. no `dragging` below the threshold, one per move after it breaks (was "Threshold")
3. `dragging` dx/dy track the pointer across moves, back to `0` at the origin (was "continous dragging")
4. `dragEnd` reports `0` when released at the origin
5. `user-select` cleared on drop when the threshold never broke

`events.spec.ts`
1. every event carries `ev` and `elm` (was "passes `DragEventWrapper`…")
2. `.off` stops `dragStart`
3. `.off` stops `dragging`
4. `.off` stops `dragEnd`

`api.spec.ts`
1. `.on` is chainable
2. `.off` is chainable

`construct-destruct.spec.ts`
1. nested contexts: only the inner one triggers

Not ported:
- already covered by the new `tests/dom/` specs: per-event `.on`, no `dragEnd` on click, `grab` position, `user-select` set/clear, `.off('grab')`, `.destroy()` stops emitting / cleans `user-select` mid-drag
- deleted (recipes): basic X/Y/both moves, sequential grabbing points, boundary, no reset on click, `data-drag-axis`
- dropped: `draggables()` with no args (`drag()` requires a contextElm), "is a function" / "returns an instance"


TODOs
-----
* Improve README
* Dropzones: not in scope.


### Later, Maybeas
- Multi touch points support
- **Helpers** — e.g. a pointer's distance from the element's edges, for padding / corner zones in a `target` function. Maybe more helpers of this kind.
- **Missed release** — releasing while away (Ctrl+Tab, alt-tab) sends no `pointerup`; back on the page the drag follows the mouse until the next click. Library's job (users have no way to end the drag). Fix: on `pointermove`, `ev.buttons === 0` → end or cancel the drag.
- **`setPointerCapture`** — probably not wanted. Window listeners already survive a release outside the window or over devtools. Capture only helps with iframes. Cost: no hover / `:hover` on other elements mid-drag (e.g.
  dropzones).