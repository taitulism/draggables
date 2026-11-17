[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
![Build Status](https://github.com/taitulism/draggables/actions/workflows/ci.yml/badge.svg)

draggables
==========
Drag gestures, reported. You move things.

## Basic Usage

```sh
$ npm install draggables
```

```html
<!-- HTML -->
<div id="board">
   <div class="note"></div>
</div>
```

```js
// js / ts
import {drag} from 'draggables';

drag(board, {target: '.note'})
   .on('dragging', ({elm, left, top}) => {
      elm.style.left = `${left}px`;
      elm.style.top = `${top}px`;
   });
```

#### Section Links:
* [The Idea](#the-idea)
* [Context Element](#context-element)
* [Target & Grip](#target--grip)
* [Containing](#containing)
* [Touch](#touch)
* [Options](#options)
* Instance API:
	* [Creation](#dragcontextelement-options)
	* [Events](#oneventname-callback--offeventname)
	* [Drag Data](#drag-data)
	* [Cancel](#canceldrag)
	* [Refresh Container Bounds](#refreshcontainerbounds)
	* [Destruction](#destroy)
* [`clamp()`](#clampn-min-max)
* [Dropzones](#dropzones)


### The Idea
The library doesn't move anything. It listens to the pointer and reports the gesture: how far, from where, to where.  
Moving, resizing, drawing a selection rect, scrolling - that's your handler's job.

>NOTE: Every drag starts at `dx: 0, dy: 0`. Nothing is accumulated between drags (see the [`translate`](#options) option).


### Context Element
Required. The element that listens to `pointerdown` events for everything draggable within it.
Each instance binds a *single* event listener to it.

With no `target` option, the context element itself is the dragged element (a splitter, a canvas, a scroller).

Nested context elements both drag. To drag only the inner one, stop propagation on its `grab`:

```js
drag(inner).on('grab', ({ev}) => ev.stopPropagation());
```


### Target & Grip
Plain selectors decide what gets dragged. No magic attributes.

```js
drag(canvas);                                       // the context element itself
drag(board, {target: '.note:not(.locked)'});        // disabling is just `:not(...)`
drag(board, {target: '.card', grip: '.card-title'});// drag only by the grip
drag(panel, {grip: '[data-side]'});                 // resize - read `dragData.grip`
drag(area, {button: 2});                            // right-click gesture
drag(board, {target: (ev) => HTMLElement | null});  // escape hatch
```

* `target` selector - the closest match to the pointer, inside the context element.
* `grip` selector - a drag only starts on a grip. The dragged element is the closest `target` to it (or the context element).
* `target` function - gets the `pointerdown` event, returns the element to drag or `null` for no drag. Replaces both (`grip` is ignored).

> To toggle draggability, toggle a class and exclude it in the `target` selector.


### Containing
Pass a `container` (element or ancestor selector) and `dx`/`dy` arrive clamped, so the dragged element stays inside the container's padding box. With a `target`, the container defaults to the context element. To drag out of it, call `drag()` on a higher element.

```js
drag(board, {target: '.note'});
drag(slider, {target: '.thumb', container: '.track'});
```

For drawing and resizing, use `bound: 'pointer'` to clamp the pointer instead of the element's box. Without a `container` or a `target`, the container is the dragged element itself.

> Rects are measured once, on grab. If the container scrolls or resizes mid-drag, call [`.refreshContainerBounds()`](#refreshcontainerbounds).


### Touch
Set `touch-action: none` on your draggables (or grips). Without it, the browser claims touch drags as page scrolls.

```css
.note { touch-action: none; }
```

If the browser cancels the pointer (`pointercancel`), the drag ends with `dragCancel`.

## Options

| Option         | Value                          | Default    |
|----------------|--------------------------------|------------|
| `target`       | `string` \| `(ev) => HTMLElement \| null` | context element |
| `grip`         | `string`                       | -          |
| `button`       | `number`                       | `0`        |
| `threshold`    | `number` (px)                  | `3`        |
| `container`    | `HTMLElement` \| `string`      | -          |
| `bound`        | `"element"` \| `"pointer"`     | `"element"`|
| `translate`    | `boolean`                      | `false`    |
| `cancelOnEsc`  | `boolean`                      | `true`     |

&nbsp;

### Details
#### Click to expand:

<!-- target -->
<details>
   <summary><code>target</code></summary><br />
   What to drag. A selector (closest match inside the context element) or a function that gets the <code>pointerdown</code> event and returns the element to drag, or <code>null</code>.
   See <a href="#target--grip">Target & Grip</a>.

----------
</details>


<!-- grip -->
<details>
   <summary><code>grip</code></summary><br />
   A selector. When set, a drag only starts when grabbed by a grip. Exposed as <code>dragData.grip</code> (same as <code>elm</code> when unset). Ignored when <code>target</code> is a function.

----------
</details>


<!-- button -->
<details>
   <summary><code>button</code></summary><br />
   The mouse button that starts a drag (<code>0</code> left, <code>1</code> middle, <code>2</code> right). Applies to every kind of <code>target</code>.

----------
</details>


<!-- threshold -->
<details>
   <summary><code>threshold</code></summary><br />
   Pixels the pointer must travel before <code>dragStart</code> fires. Below it, a release is a plain click (no <code>dragEnd</code>).

----------
</details>


<!-- container -->
<details>
   <summary><code>container</code></summary><br />
   An element, or a selector matched against the dragged element's ancestors. Clamps <code>dx</code>/<code>dy</code> to keep the dragged element inside it, and adds the container fields to the <a href="#drag-data">drag data</a>. Defaults to the context element when <code>target</code> is set.<br />
   A selector that matches nothing logs a warning and the values arrive unclamped.

----------
</details>


<!-- bound -->
<details>
   <summary><code>bound</code>="element" | "pointer"</summary><br />

   * `"element"` - keep the dragged element's box inside the container.
   * `"pointer"` - keep the pointer inside the container. Adds the container fields even without a `container` (then it's the dragged element).

----------
</details>


<!-- translate -->
<details>
   <summary><code>translate</code></summary><br />
   Reads the element's computed CSS <code>translate</code> on grab and adds <code>tx</code>/<code>ty</code> (start translate + <code>dx</code>/<code>dy</code>). Handy for moving with <code>translate</code> across drags.

----------
</details>


<!-- cancelOnEsc -->
<details>
   <summary><code>cancelOnEsc</code></summary><br />
   Pressing Esc mid-drag fires <code>dragCancel</code>.

----------
</details>

&nbsp;

### Example:
```js
drag(board, {
   target: '.card:not(.locked)',
   grip: '.card-title',
   container: board,
   translate: true,
})
   .on('dragging', ({elm, tx, ty}) => {
      elm.style.translate = `${tx}px ${ty}px`;
   })
   .on('dragCancel', ({elm}) => {
      // revert
   });
```
---------------------------------------------------------

## Instance API

### `drag(contextElement, options)`
#### arguments
* contextElement: `HTMLElement` = required. See [Context Element](#context-element).
* options: `DragInstanceOptions` = optional. See [Options](#options).

Returns a `DragInstance`:
```js
const d = drag(board);
```

It has the following methods:

### **.on(eventName, callback) / .off(eventName)**
Start and stop listening to drag events:
* **`'grab'`** - fires on `pointerdown` on a target (`dx: 0, dy: 0`).
* **`'dragStart'`** - fires on the first `pointermove` that crosses the threshold.
* **`'dragging'`** - fires on every `pointermove` after that.
* **`'dragEnd'`** - fires on `pointerup`, only if the drag started.
* **`'dragCancel'`** - the drag was aborted (Esc, `pointercancel`, `.cancelDrag()`, `.destroy()`). Revert what you moved.

An instance holds a single handler per event (unlike an EventEmitter):

```js
drag(board)
   .on('dragStart', doSomething)     // <-- this is replaced
   .on('dragStart', doSomethingElse) // <-- by this (same event)
   .on('dragEnd', stopDoingThing)
   .off('dragStart');
```

### Drag Data
Handlers get called with a `DragData` object:

| Property     | Description                                                   |
|--------------|---------------------------------------------------------------|
| `ev`         | the vanilla `PointerEvent`                                    |
| `elm`        | the dragged element (not always `ev.target`)                  |
| `grip`       | the grabbed grip (`=== elm` when no `grip` option)            |
| `dx`, `dy`   | since drag start. Clamped with `container`                    |
| `x`, `y`     | current pointer, client px                                    |
| `left`, `top`| start `offsetLeft`/`offsetTop` + `dx`/`dy`                    |
| `containerX`, `containerY`<br />`startContainerX`, `startContainerY` | pointer relative to the container. With `container` or `bound: 'pointer'` |
| `tx`, `ty`   | start `translate` + `dx`/`dy`. With `translate: true`         |

> `dragCancel` handlers only get `{elm, grip}`.  
Values are raw, not rounded. Optional fields are typed by the options you pass.

```js
drag(board, {target: '.note', grip: '.grip'}).on('dragging', (dragData) => {
   console.log(
      dragData.elm,     // e.g. <div class="note">
      dragData.grip,    // e.g. <div class="grip">
      dragData.dx,      // e.g. 3 (on 'grab' events it's always 0)
   );
});
```


### **.cancelDrag()**
Aborts the current drag. Fires `dragCancel` if the threshold was crossed. No-op when idle.


### **.refreshContainerBounds()**
Re-reads the container's rect mid-drag (after a scroll or resize). No-op when idle.


### **.destroy()**
Kills the instance for good: cancels an active drag, unbinds event listeners, drops handlers. Use it when the context element is removed from the DOM.

-----

### `clamp(n, min, max)`
Exported for everything `container` doesn't cover - a splitter, min/max sizes.

```js
import {drag, clamp} from 'draggables';

drag(splitter).on('dragging', ({dy}) => {
   pane.style.height = `${clamp(startHeight + dy, 100, 600)}px`;
});
```


### Dropzones
Helpers to find the zone under the pointer. Each returns the zone element or `null`. Pass the dragged element as `exclude` to skip it and its descendants. Nested zones: the innermost wins.

* `measureZones(selector, exclude?)` + `hitZone(zones, x, y)` - measure once, then no DOM reads per move. Call `measureZones` again if zones render, scroll or resize mid-drag. Ignores `z-index`.
* `findDropzone(x, y, selector, exclude?)` - reads the DOM on every call. Respects `z-index` and catches new zones, but forces a reflow per move.

```js
import {drag, measureZones, hitZone} from 'draggables';

let zones;
drag(board, {target: '.note'})
   .on('dragStart', ({elm}) => zones = measureZones('.trash', elm))
   .on('dragEnd', ({elm, x, y}) => {
      if (hitZone(zones, x, y)) elm.remove();
   });
```


-----


DEVELOPMENT
-----------
Install Chromium for playwright testing
```sh
$ npx playwright install --only-shell --with-deps chromium
```

Playground (one page per case)
```sh
$ npm run play
```
