[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
![Build Status](https://github.com/taitulism/draggables/actions/workflows/ci.yml/badge.svg)


draggables
==========
Event-based drag gestures.

Each drag reports where it started, where it is now, and how far it moved. You decide what happens: move, resize, draw, etc.


### Table of Contents
* [Quick Start](#quick-start)
* [Installation](#installation)
* [Setup](#setup)
	* [Context Element](#context-element)
	* [Options](#options)
* Usage:
	* [Events](#events)
	* [Drag State](#drag-state)
	* [Other Methods](#other-methods)
* [Caveats](#caveats)
* Helper Utils:
	* [Clamp](#clamp)
	* [Edge Proximity](#edge-proximity)
	* [Auto-Scroll](#auto-scroll)
	* [Dropzones](#dropzones)


Quick Start
-----------
```js
import {createDragger} from 'draggables';

// define drag elements and behavior
const dragger = createDragger(contextElm, {...options})

// Listen to events and call your handlers
dragger.on('dragStart', (dragState) => {...});
dragger.on('dragging', (dragState) => {...});
dragger.on('dragEnd', (dragState) => {...});

/* dragState contains:
   ------------------
   ev     - the pointer event
   elm    - the dragged element (not always ev.target)
   x, y   - pointer position relative to the container
   dx, dy - distance moved since drag start
   
   ...and more
*/
```


### Example - dragging sticky notes on a board
```html
<div id="board">
   <div class="sticky-note"></div>
   <div class="sticky-note"></div>
   <div class="sticky-note"></div>
</div>
```

```js
import {createDragger} from 'draggables';

const board = document.getElementById('board');
const notesDragger = createDragger(board, {target: '.sticky-note'})

notesDragger.on('dragging', ({elm, left, top}) => {
   elm.style.left = `${left}px`;
   elm.style.top = `${top}px`;
});
```


Installation
------------
```sh
$ npm install draggables
```


Setup
-----
Configure what can be dragged and how it behaves.


```js
import {createDragger} from 'draggables';

createDragger(contextElement, options);
```

* `contextElement` (`HTMLElement`, required) - The element that will get a single pointerdown listener. It can be a drag surface or contain draggables.
* `options` (`DraggerOptions`, optional) - See [Options](#options) below.

The context element never moves. It plays a different role depending on the `target` option:

* With no `target` option, the context element is a surface to drag on (e.g. a canvas to draw on, a viewport to pan).
* With a `target` option, the context element is a common ancestor that delegates `pointerdown` to the matching draggable targets inside it (e.g. a board with notes on it).

To move an element freely around the page (e.g. a floating dialog), use `document.body` as the context element and target the dialog.

The context element is also the default [container](#option-container).


### Options
| Option                               | Value                                     | Default         |
|--------------------------------------|-------------------------------------------|-----------------|
| [`target`](#option-target)           | `string` \| `(ev) => HTMLElement \| null` | context element |
| [`grip`](#option-grip)               | `string`                                  | -               |
| [`container`](#option-container)     | `HTMLElement` \| `string`                 | context element |
| [`clamp`](#option-clamp)             | `"element"` \| `"pointer"`                | -               |
| [`button`](#option-button)           | `number`                                  | `0`             |
| [`translate`](#option-translate)     | `boolean`                                 | `false`         |
| [`cancelOnEsc`](#option-cancelonesc) | `boolean`                                 | `true`          |
| [`threshold`](#option-threshold)     | `number` (px)                             | `3`             |

&nbsp;


### Option: `target`
What to drag. A selector or a function. When omitted the context element becomes the target.

**Selector** - the closest match to the pointer, inside the context element.

```js
createDragger(board, {target: '.card'});
```

**Function** - gets the `pointerdown` event, returns the element to drag or `null` for no drag. To use a [grip](#option-grip), check for it inside the function.

```js
createDragger(board, {target: (ev) => HTMLElement | null});
```

Use a function when the decision depends on app state a selector can't express. For example, drag only the cards the current user can edit:

```js
createDragger(board, {
   target: (ev) => {
      const card = ev.target.closest('.card');
      return card && canEdit(card) ? card : null;
   }
});
```

To toggle draggability, toggle a class on the element (e.g. ".locked") and exclude it:

```js
createDragger(board, {target: '.card:not(.locked)'});
// or:
createDragger(board, {
   target: (ev) => ev.target.closest('.card:not(.locked)')
});
```


### Option: `grip`
The handle selector. When set, a drag only starts on a grip.

The dragged element is the closest `target` to it (or the context element).

For example, drag a card by grabbing its header:

```js
createDragger(board, {target: '.card', grip: '.card-header'});
```


### Option: `container`
An element or a selector. The element the container fields in the [drag state](#drag-state) are relative to, and the area to stay in with [`clamp`](#option-clamp).
A selector picks the nearest ancestor of the dragged element that matches it.

Defaults to the context element. Set it to use a different element:

```js
createDragger(slider, {target: '.thumb', container: '.track'});
```

A selector that matches nothing falls back to the context element.


### Option: `clamp`
Keeps the drag inside the container's padding box by clamping the distance values reported to your handlers (`dx`/`dy`). Off by default. The unclamped values stay available as `rawDx`/`rawDy`.

What to keep inside the container:

* `"element"` - the dragged element's box.
* `"pointer"` - the pointer. For drawing and resizing.

```js
createDragger(canvas, {clamp: 'pointer'});
```

Example - Dragging a box against its container's right edge (`*` is the pointer):
```
clamp: 'element'                  clamp: 'pointer'
┌─ container ─────────┐          ┌─ container ─────────┐
│          ┌──────────┤          │              ┌──────┴──┐
│          │  *       │          │              │      *  │
│          └──────────┤          │              └──────┬──┘
└─────────────────────┘          └─────────────────────┘
 box stops at the edge,           pointer stops at the edge
 pointer can keep going           box may overflow
```


### Option: `button`
The mouse button that starts a drag (`0` left, `1` middle, `2` right). Applies to every kind of `target`. Default: `0`.

```js
// right-click gesture
createDragger(surface, {button: 2});
```


### Option: `translate`
Default: `false`. Use it to move an element with CSS `translate`. Your handlers get `tx`/`ty`, the element's new translate (its translate at grab plus `dx`/`dy`).

> **Pixels only (`%` is read as `px`).**

```js
createDragger(board, {target: '.card', translate: true})
   .on('dragging', ({elm, tx, ty}) => {
      elm.style.translate = `${tx}px ${ty}px`;
   });
```


### Option: `cancelOnEsc`
Pressing Esc mid-drag fires `dragCancel`. Default: `true`.

```js
createDragger(board, {target: '.card', cancelOnEsc: false});
```


### Option: `threshold`
Number of pixels the pointer must travel before `dragStart` fires. Below it, a release is a plain click (no `dragEnd`). Default: `3`.

`dx`/`dy` are always measured from the grab point, so on `dragStart` the element catches up with the pointer.

```js
createDragger(list, {target: '.item', threshold: 10});
```

&nbsp;

---------------------------------------------------------


Events
------
Calling `createDragger()` returns a `Dragger` instance.

A dragger instance emits an event at each stage of the gesture. Each event carries a [`DragState`](#drag-state) object with coordinates, relative positions and more - everything you need to update your DOM.


### Gesture Lifecycle
| Event          | Fires                                                                                                                           | Use for          |
|----------------|---------------------------------------------------------------------------------------------------------------------------------|------------------|
| `'grab'`       | on `pointerdown` on a target                                                                                                    | highlight        |
| `'dragStart'`  | on the first `pointermove` that crosses the [threshold](#option-threshold)                                                      | "dragging" class |
| `'dragging'`   | on every `pointermove` after that, and on scroll                                                                                | moving           |
| `'dragEnd'`    | on `pointerup`, only if the drag started                                                                                        | saving position  |
| `'dragCancel'` | when the drag is aborted: on `Esc` keypress, on `pointercancel`, or when calling the instance's `.cancelDrag()` or `.destroy()` | reverting        |
| `'release'`    | on `pointerup`, or after `dragCancel`                                                                                           | unhighlight      |

> A click (no move past the threshold) fires only `grab` and `release`.

> `dragCancel` and `release` get only `{elm, grip}`, not the full [`DragState`](#drag-state).


### Listening to Events
You start listening to an event by calling `.on()` with its name and a callback, and stop with `.off()`.

```js
const dragger = createDragger(board);

dragger.on(EVENT_NAME, doSomething)
dragger.off(EVENT_NAME);
```
An instance holds a single handler per event (unlike an EventEmitter):

```js
createDragger(board)
   .on('dragStart', doSomething)     // <-- this is replaced
   .on('dragStart', doSomethingElse) // <-- by this (same event)
```


### Drag State
Each event handler gets a `DragState` object describing the drag at that moment. For example:

```js
createDragger(board, {target: '.card'})
   .on('dragging', (dragState) => {
      console.log(dragState.dx, dragState.dy);
   });
```


| Property               | Type           | Description                                                                   |
|------------------------|----------------|-------------------------------------------------------------------------------|
| `ev`                   | `PointerEvent` | the vanilla `PointerEvent`                                                    |
| `elm`                  | `HTMLElement`  | the dragged element (not always `ev.target`)                                  |
| [`grip`](#option-grip) | `HTMLElement`  | the grabbed grip (when no `grip` option, it's `=== elm`)                      |
| `container`            | `HTMLElement`  | the [container](#option-container) element                                    |
| `dx`, `dy`             | `number`       | delta/distance since drag start. Clamped with `clamp`                         |
| `rawDx`, `rawDy`       | `number`       | same as `dx`/`dy`, never clamped. For rubber-band, auto-scroll speed          |
| `startX`, `startY`     | `number`       | grab point relative to the container                                          |
| `x`, `y`               | `number`       | grab point relative to the container + `dx`/`dy`                              |
| `left`, `top`          | `number`       | start `offsetLeft`/`offsetTop` (from nearest positioned ancestor) + `dx`/`dy` |
| `tx`, `ty`             | `number`       | start `translate` + `dx`/`dy`. With `translate: true`                         |


> In TypeScript, optional fields appear only when you set the option that enables them (e.g. `tx`/`ty` with `translate: true`).


### Other Methods
A `Dragger` also has the following methods:

* [.cancelDrag()](#canceldrag)
* [.refreshContainerBounds()](#refreshcontainerbounds)
* [.update()](#update)
* [.destroy()](#destroy)


#### **.cancelDrag()**
Aborts the current drag. Fires `dragCancel` if the threshold was crossed. No-op when idle. This is what Esc calls when pressed (see [`cancelOnEsc` option](#option-cancelonesc)).

```js
window.addEventListener('blur', () => dragger.cancelDrag());
```


#### **.refreshContainerBounds()**
Sometimes the container resizes during a drag (e.g. it grows). Call this to re-read its rect, so clamping matches its new edges. No-op when idle. Scrolling is handled automatically.

It doesn't re-fire `dragging`, so the new bounds apply on the next move. Chain [`.update()`](#update) to apply them now.

```js
container.style.height = `${container.clientHeight + 20}px`;
dragger.refreshContainerBounds();
```


#### **.update()**
Re-fires `dragging` with the last pointer position, without waiting for the pointer to move. Useful after changing something the drag depends on, like the container size, or in an auto-scroll loop. No-op when idle. Scrolling calls it automatically.

```js
dragger.refreshContainerBounds().update();
```


#### **.destroy()**
Kills the instance for good: cancels an active drag, unbinds event listeners, drops handlers. Use it when the context element is removed from the DOM.

```js
// Vanilla 
const cardDragger = createDragger(board, {target: '.card'});
cardDragger.destroy();
```

```js
// React
useEffect(() => {
   const cardDragger = createDragger(boardRef.current, {target: '.card'});
   return () => cardDragger.destroy();
}, []);
```


Caveats
-------
### Nested Context Elements
When context elements are nested, both drag. To drag only the inner one, stop propagation on its `grab`:

```js
createDragger(inner).on('grab', ({ev}) => ev.stopPropagation());
```


### Scrolling
If the page or any container scrolls mid-drag, `dx`/`dy` include the scroll distance, so the element stays under the pointer. For scrolling near edges, see the [Auto-Scroll](#auto-scroll) helper.


### Touch
Set `touch-action: none` on your draggables (or grips). Without it, the browser claims touch drags as page scrolls.

```css
.card { touch-action: none; }
```


### Images & Links
Dragging an `<img>` or `<a>` starts the browser's native drag, which cancels yours. Either set `draggable="false"` on them (or CSS `-webkit-user-drag: none`), or prevent it for the whole context element:

```js
board.addEventListener('dragstart', (ev) => ev.preventDefault());
```

When a native drag takes over, the browser cancels the pointer (`pointercancel`) and the drag ends with `dragCancel`.


### Text Selection
Dragging selects text. Block it with CSS (`.card { user-select: none; }`), or only while dragging:

```js
createDragger(board, {target: '.card'})
   .on('grab', () => document.body.classList.add('no-select'))
   .on('release', () => document.body.classList.remove('no-select'));
```

-----


Helper Utils
------------
Small functions for common drag tasks, so you don't have to write them yourself. Not required, just convenient. 


### Clamp
A trivial one-liner, exported for everything `container` doesn't cover.

* `clamp(n, min, max)` - returns `n` limited to the `min`-`max` range.


#### Example
Limiting a resizable panel's height:
```js
import {createDragger, clamp} from 'draggables';

const MIN = 100
const MAX = 500
let startHeight = 300

createDragger(splitter).on('dragging', ({dy}) => {
   // `dy` = Y axis delta 
   const newValue = startHeight + dy;
   const clampedValue = clamp(newValue, MIN, MAX);

   panel.style.height = `${clampedValue}px`;
});
```


### Edge Proximity
How far an element or the pointer is from each edge of a container (its padding box). Useful for auto-scroll or edge highlighting.

* `getEdgeProximity(container, rect)` - for an element. Pass its `getBoundingClientRect()`.
* `getEdgeProximity(container, x, y)` - for the pointer.

Returns `{top, right, bottom, left}` in px. Negative means outside.

Highlighting the board edges a note is near:
```js
import {createDragger, getEdgeProximity} from 'draggables';

createDragger(board, {target: '.note'}).on('dragging', ({elm}) => {
   const edges = getEdgeProximity(board, elm.getBoundingClientRect());

   for (const [edge, distance] of Object.entries(edges)) {
      board.classList.toggle(`near-${edge}`, distance <= 10);
   }
});
```


### Auto-Scroll
Scrolls an element (or `window`) while the pointer is near its edges. Speed ramps up toward the edge, and it stops on its own once you move away. The dragger compensates for the scroll, so the dragged element keeps following the pointer.

`autoScroll(scrollElm, {threshold, speed})`
* `threshold` - edge band in px where scrolling starts. Default `40`.
* `speed` - max px per frame, reached at the edge. Default `15`.

Returns `{update(x, y), stop()}`. Pass viewport coordinates (`ev.clientX`/`ev.clientY`).

```js
import {createDragger, autoScroll} from 'draggables';

const scroller = autoScroll(window);

createDragger(board, {target: '.note'})
   .on('dragging', ({ev}) => scroller.update(ev.clientX, ev.clientY))
   .on('release', () => scroller.stop());
```


### Dropzones
Find which of your dropzones (elements matching a selector you pass) is under the pointer. Each helper returns the zone element or `null`.

They expect viewport coordinates (`ev.clientX`/`ev.clientY`), not the container-relative `x`/`y` from the drag state.

Pass the dragged element as `exclude` so it doesn't count as a zone. With nested zones, the innermost wins.


#### Measure Once
Measure all zones once when the drag starts (`measureZones`), then check the pointer against them on each move (`hitZone`). Measure again if zones move or show up mid-drag.

```js
import {createDragger, measureZones, hitZone} from 'draggables';

let zones;
createDragger(board, {target: '.card'})
   .on('dragStart', ({elm}) => zones = measureZones('.trash', elm))
   .on('dragEnd', ({elm, ev}) => {
      if (hitZone(zones, ev.clientX, ev.clientY)) elm.remove();
   });
```


#### Check Live
Ask the browser what's under the pointer on each move (`findDropzone`). Slower, but it respects `z-index`. Calling it only on `dragEnd` is cheap. On every move it may cause jank on heavy pages.

```js
import {createDragger, findDropzone} from 'draggables';

createDragger(board, {target: '.card'})
   .on('dragEnd', ({elm, ev}) => {
      if (findDropzone(ev.clientX, ev.clientY, '.trash', elm)) elm.remove();
   });
```


-----


DEVELOPMENT
-----------
Install Chromium for Playwright testing
```sh
$ npx playwright install --only-shell --with-deps chromium
```

Playground (one page per case)
```sh
$ npm run play
```
