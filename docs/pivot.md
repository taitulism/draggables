pivot.md
========
Main entry point for the `draggables` pivot. Work spans multiple chats — read this first.

The library reports the gesture; moving things is the consumer's job. The API itself is documented in the [README](../README.md) — this file keeps only the non-obvious *why*s and what's left.

The decisions below are settled — don't re-litigate them. Items marked **Open** are the exceptions.


Decisions log
-------------
_(append decisions here as they're made, so later chats don't re-litigate them)_


### Drag state
No incremental delta (since-last-move): it bakes clamping into the state it reads next frame, and it's derivable as `dx - prevDx`.

Values are raw, not rounded. `clientX/Y` are fractional under page zoom or OS scaling; rounding is the consumer's call.

Named `DragState`, not `DragEvent`, to avoid shadowing the DOM's global `DragEvent`, and so handler params are named `dragState` (not `ev`, which made `ev.ev`).

`dragStart` reports the real `dx/dy` — already ~3px, so the element jumps by the threshold on the first write. Below perceptual threshold, and the only option that keeps the element under the cursor. Zeroing them, or re-origining at the break, trades that invisible jump for a permanent 3px trail.

`dragEnd` recomputes `dx/dy` from the pointerup position rather than reusing the last move's. The pointer can travel between the final `pointermove` and `pointerup` — a fast flick, coalesced events, a release just past a dropzone edge — and the consumer would commit a stale position.

`dragCancel` is its own event, not a flag on `dragEnd` — consumers hold the DOM, so an abort has to tell them to revert. Unrelated to the threshold; don't fold the two together.


### Target resolving
**No magic attrs.** The old `data-drag-role` / grip / `data-drag-disabled` / `data-drag-zone` attrs are dropped. Built-in role resolving was opinionated and would keep growing (resizable roles, custom role names…). Plain selectors cover it: disabling is `:not(...)`, grip-only is `grip`.

The `target` function returns the element to drag, not a boolean — a grip resolves to its draggable. Runs once, at pointerdown.

`grip` is string-only — a function `target` already covers anything a grip function could. Returning `{elm, grip}` from `target` is a possible later, additive extension.

One handler per event (Bug #8). Going to many is additive, not breaking, so it can wait for a real need — a framework wrapper or a second consumer competing for the same event.

Free-hand drawing is out of scope; rect drawing is in — it needs only the start and current point, not a path.


### Clamping
Rects are cached on grab — the dragged element's and the container's — so moves do no DOM reads (a rect read after the consumer writes `left`/`top` forces a reflow per move). The dragged element is never re-measured mid-drag: its rect would include the movement. One container per drag; to span several, use their common parent.

Dropped `axis` (and `data-drag-axis`): it's `if (dy) dy = 0` in a handler the consumer already writes, and an axis is a runtime decision (which edge of a resize was grabbed).
Dropped `padding` / `cornerPadding` — consumers do it in a `target` function.


#### Why screen rects, not `offsetLeft`
`offsetLeft`/`offsetTop` are measured from the element's positioning parent (`offsetParent`, the nearest ancestor with `position` set). Capping them by the container's size assumes they're measured from the container's edge. When the two edges don't line up, the allowed range shifts by the gap between them: one side stops early, the other overshoots.

Board 300px wide, a wrapper (the positioning parent) starting 50px into it, a 100px note:

```
board:    0                                   300
          ├───────────────────────────────────┤
wrapper:       50
               ├──────────────────────────────...
               ↑ note's `left` is measured from here

max left = 300 - 100 = 200

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

Also wrong when the element is moved with `transform`/`translate`: `offsetLeft` ignores transforms, so the start position is wrong.

So the delta is clamped using screen rects (`getBoundingClientRect`), both on grab:

```ts
const minDx = containerRect.left - elmStartRect.left;
const maxDx = containerRect.right - elmStartRect.right;
left = startLeft + clamp(dx, minDx, maxDx);
```

Screen rects share one origin, so the positioning parent no longer matters.


### Dropzones
Helpers, not an option. Hit-testing is the consumer's, from the pointer position: the consumer knows when zones render, scroll or change; the lib doesn't.

A container isn't a default dropzone: a clamped element is always inside it, so it would carry no info.


### Structure
`src/core/` (gesture math, no DOM) + `src/dom/` (listeners, target/grip resolving) + `src/utils/` (helpers). One package. `core/` never imports `dom/`, so a package split later is a folder move. Split when a second real consumer appears.

Core `Drag` is a private helper: it owns the state and the threshold, returns what happened; `dom/` drives it and emits. Revisit if a non-pointer input (keyboard dragging) appears. Multi-touch would need one core instance per `pointerId`.

`pointermove` / `pointerup` / `keydown` listeners are bound on `window` at grab and removed on drop or cancel.


TODOs
-----
1. **`translate` silently reads `%` as `px`.** That's a quietly wrong result; it should throw or warn.
2. **Common setup is left to the user.** Every user has to set `touch-action`, block native img/link drag and prevent text selection, or the drag breaks. Most drag libraries handle these by default and let you opt out.
3. **Nested draggers both drag by default.** That's surprising, and the fix depends on `stopPropagation` and listener order. Expected: the innermost dragger wins by default. The lib can do this by having the first dragger to get a `pointerdown` mark the event as claimed (e.g. in a shared `WeakSet`), so outer draggers skip it. Unlike `stopPropagation`, this doesn't hide the event from the app's other listeners.

* grid snapping helper? - `snap(n, step)`
* DragState velocity (`vx`, `vy`) — flick/throw; consumers can't derive it without tracking state (see drag-velocity branch)
* long-press delay: `delay` option (+ `tolerance` px, maybe touch-only) so touch pages can still scroll
* a12y/keyboard: add instance methods to control drag (with events)
------------------------------
* TBD (inconclusive, keeping as-is): First move past the threshold fires only `dragStart`, not `dragging`. Fire both? fire `dragging` with a `firstMove` bool?
* multiple event listeners (EventEmitter like) - when the need arises.
* ~~ctxElm selector (multi?)~~ rare case
* ~~multiple target selectors (array) and dragState.selector?~~ consumer can pass `traget: '.aaa, .bbb'` and check `elm.matches('.aaa')` in event handlers. 


### Later, Maybeas
- Multi touch points support
- **Missed release** — releasing while away (Ctrl+Tab, alt-tab) sends no `pointerup`; back on the page the drag follows the mouse until the next click. Library's job (users have no way to end the drag). Fix: on `pointermove`, `ev.buttons === 0` → end or cancel the drag.
- **`setPointerCapture`** — probably not wanted. Window listeners already survive a release outside the window or over devtools. Capture only helps with iframes. Cost: no hover / `:hover` on other elements mid-drag (e.g.
  dropzones).
