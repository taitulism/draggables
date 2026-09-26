# pivot.md

Main entry point for the `draggables` pivot. Work spans multiple chats — read this first.

The library was built for one project; I want it reusable. This is a big refactor — a re-shuffle,
new decisions, **breaking changes expected**. The core change: emit on drag move instead of writing
CSS `translate`. Movement becomes the consumer's job; the library reports the gesture.

The decisions below are settled — don't re-litigate them. Items marked **Open** or **Deferred** are
the exceptions.

## Plan

Each chunk lands green — nothing half-broken.

Per chunk, in order: red test → code → green test → playground → my approval to move on.
The playground is part of the chunk: each step has to be playable before the
next one starts.

Green is the default. If a chunk can't land green — or only can by keeping
code that the pivot should be deleting — raise it and stop. Old tests don't get to veto the new
design; the call is mine.

### The pivot

Old code only gets deleted.

1. **Core, pure, no DOM** — `src/core/startDrag.ts`. `startDrag(x, y, opts) → {move, end, cancel}`.
   Unit tests, no browser needed. Nothing else changes yet; core is unused. **Done.**

2. **Build `drag()` fresh, beside `Draggables`** — surface + target resolver, driving `startDrag`,
   emitting `dx/dy/x/y`. New tests assert emitted numbers — the library no longer moves anything. Old `Draggables` and its tests stay untouched and green.

3. **Swap** — exports point to `drag()`; delete `Draggables`, `internals.ts` and the old tests
   (`moveElm`, `keepInBoundary`, `axis`, `dragzoneBox`, `relPos` go with them). Old tests covering
   rules that survive (grip, disabled, padding) are rewritten against the default resolver first.
   Playground pages become the reference: notes, resize, mouse gesture.

### Later

4. **`setPointerCapture`** — drops the window listeners. Behavioral, own chunk.
5. **`dragCancel`** — Esc + destroy-mid-drag.
6. **Dropzones** — `dropDetection` opt-in, both strategies. Playground: kanban.

## Decisions log

_(append decisions here as they're made, so later chats don't re-litigate them)_

### Move event payload

```js
{ dx, dy,    // since drag start
  x, y }     // current pointer, client px
```

No incremental delta (since-last-move): it bakes clamping into the state it reads next frame,
and it's derivable as `dx - prevDx`.

`grab` fires before movement, so no delta: `{ev, elm, x, y}`.

Every drag starts at `dx: 0`. The computed-`translate` read in `createActiveDrag` goes — consumers
accumulate.

`relPos` is deleted — it was the accumulated CSS translate. Resolves Bug #5.

`DragEventWrapper` splits into a type per event: `grab` has no deltas, `dragStart`/`dragging` carry
`dx/dy`, and the dropzone pair only appears when `dropDetection` is on.

### Drop targets

Marked with `data-drag-dropzone="<id>"`. `dragEnd` reports the target with the same `dropzoneElm` /
`dropzoneId` pair as `dragging`, re-tested at the pointerup position rather than reusing the last
move's.

`dropDetection: 'pointer' | 'overlap' | undefined`. Opt-in — undefined means no hit-testing and no
`dropzone` field, so resize and scroller consumers pay nothing for a DOM read per move.

- `pointer` — `elementsFromPoint(x, y)` (plural), first `[data-drag-dropzone]` that isn't the
  dragged element. Plural avoids mutating `pointer-events` on the dragged element, and survives
  consumer overlays sitting on top.
- `overlap` — dragged element's box against each dropzone; largest overlap area wins
  (not DOM order — that would let a 2px overlap earlier in the markup beat the intended zone).

Hit-tested continuously, exposed on the `dragging` payload as `dropzoneElm` (the element) and
`dropzoneId` (the attribute's value). Consumers derive transitions by
comparing against the previous value.

`dragStart` carries the pair too, giving consumers the origin zone for "moved from A to B".

### No clamping — consumer's job

The library can't clamp meaningfully once it doesn't position the element: `dx` may mean position,
width, or scroll offset, and only the consumer knows which.

Drops: `keepInBoundary`, `dragzoneBox`, `axis` — including the `data-drag-axis` attribute. It's
`if (dy) dy = 0` in a handler the consumer already writes, and an axis is a runtime decision (which
edge of a resize was grabbed).
Stays: `DragzoneSelector`, `dragzoneElm` (still needed for `user-select`), `padding`, `cornerPadding`.

Consumer side — measure on `dragStart`, arithmetic on `dragging`:

```js
let startX, maxX

drag.on('dragStart', ({elm}) => {
  startX = elm.offsetLeft
  maxX = elm.parentElement.offsetWidth - elm.offsetWidth
})

drag.on('dragging', ({elm, dx}) => {
  const x = Math.min(Math.max(startX + dx, 0), maxX)
  elm.style.translate = `${x - startX}px 0`
})
```

### Structure

`moveElm` goes — the library doesn't touch the DOM's position.

`src/core/` (gesture math, no DOM) + `src/dom/` (PointerEvent listeners, `getDraggable`, padding,
`user-select`, dropzones). One package. `core/` never imports `dom/`, so a package split later is
a folder move. Split when a second real consumer appears.

Core emits `{dx, dy, x, y}`; `dom/` adds `elm` before the consumer sees it.

Start threshold lives in core, configurable (currently hardcoded 3px).

`dom/` drives core and owns the emitter. Core's methods return what happened.

Core is a closure: private state without `#`, no `this` binding, and a drag is a short-lived
process. Named for what it models:

```ts
type Step =
  | {type: 'dragStart' | 'dragging' | 'dragEnd', dx, dy, x, y}
  | {type: 'dragCancel'}
  | null                                   // below threshold, or a click ended

const d = startDrag(x, y, {threshold})    // start point is the call; phase: pending → dragging → done
d.move(x, y)                              // → Step; pending → dragging on threshold
d.end(x, y)                               // → dragEnd, or null if it never started; done
d.cancel()                                // → dragCancel if dragging; Esc, pointercancel, destroy; done
```

`dragEnd` recomputes `dx/dy` from the pointerup position rather than reusing the last move's. The
pointer can travel between the final `pointermove` and `pointerup` — a fast flick, coalesced events,
a release just past a dropzone edge — and the consumer would commit a stale position. Two
subtractions.

Synchronous and testable without subscribing. Multiple listeners are a binding-layer concern.
Core state is just `startX`, `startY`, `phase`.

One core instance per drag, disposed on `end` / `cancel`. Allocation is negligible; a drag is a
human action.

`end` returns `null` if the threshold was never passed (a plain click).

`dragCancel` is its own event, not a flag on `dragEnd` — consumers hold the DOM, so an abort has to
tell them to revert. Unrelated to the threshold; don't fold the two together.

Fired by Esc, and by `destroy()` mid-drag: destroy aborts and cleans up.

`setPointerCapture` on grab, replacing the window-level listeners. Without it a drag that leaves the
window (taskbar, second monitor, devtools, an iframe) stops receiving moves and never sees the
release — the drag stays stuck. Capture routes both to the captured element wherever the pointer goes.

`dragStart` reports the real `dx/dy` — already ~3px, so the element jumps by the threshold on the
first write. Below perceptual threshold, and the only option that keeps the element under the cursor.
Zeroing them, or re-origining at the break, trades that invisible jump for a permanent 3px trail.

**Deferred:** everything about disabling mid-drag — `disable()` and `data-drag-disabled` both.

**Deferred (touch):** library sets `touch-action: none` on grab and removes it on drag end — not
permanently in CSS, which would kill scrolling for anyone swiping over a draggable. Without it the
browser claims vertical touch drags as page scrolls. Also listen for `pointercancel` and treat it as
`dragCancel`; today it leaves listeners bound and `activeDrag` set, so the next `pointerdown` throws.

### Primitive: one surface + a target resolver

One primitive for every case (notes, kanban, resize, mouse gesture). Free-hand drawing is out of scope.

```js
drag(surface)                                   // resize, gesture: surface is the dragged thing
drag(board, {target: '.note'})                  // selector → ev.target.closest(selector)
drag(board, {target: (ev) => HTMLElement | null})
```

The resolver gets the whole `PointerEvent` (padding needs `clientX/Y`, gesture needs `button`) and
returns the element to drag, not a boolean — a grip resolves to its draggable. `null` means no drag.

Runs once, at pointerdown. Mid-drag stays deferred.

Today's `data-drag-role` / grip / `data-drag-disabled` / `padding` / `cornerPadding` rules become the
default resolver. Consumers who want other rules replace it whole.

`startDrag` stays as a private helper of this layer. It owns
the phase and the threshold; `drag()` drives it and emits. Revisit if a non-pointer input (keyboard
dragging) appears.

One handler per event stays (Bug #8). Going to many is additive, not breaking, so it can wait for a
real need — a framework wrapper or a second consumer competing for the same event.
