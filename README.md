[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
![Build Status](https://github.com/taitulism/draggables/actions/workflows/ci.yml/badge.svg)

draggables
==========
Event-based drag gestures.

Each drag reports where it started, where it is now, and how far it moved - You decide what happens: move, resize, draw, etc.


### Table of Contents
* [Quick Start](#quick-start)
* [Installation](#installation)
* [Setup](#setup)
	* [Context Element](#context-element)
	* [Options](#options)
* Usage:
	* [Events](#events)
	* [Drag Data](#drag-data)
	* [Other Methods](#other-methods)
* [Caveats](#caveats)
* Helper Utils:
	* [Clamp](#clamp)
	* [Dropzones](#dropzones)


## Quick Start
```js
import {draggables} from 'draggables';

// define drag elements and behavior
const dragger = draggables(contextElm, {...options})

// Listen to events and call your handlers
dragger.on('dragStart', (dragData) => {...});
dragger.on('dragging', (dragData) => {...});
dragger.on('dragEnd', (dragData) => {...});

/* dragData contains:
   ------------------
   ev     - the pointer event
   elm    - the dragged element (not always ev.target)
   x, y   - pointer position
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
import {draggables} from 'draggables';

const board = document.getElementById('board');
const notesDragger = draggables(board, {target: '.sticky-note'})

notesDragger.on('dragging', ({elm, left, top}) => {
   elm.style.left = `${left}px`;
   elm.style.top = `${top}px`;
});
```


## Installation
```sh
$ npm install draggables
```


## Setup
Configure what can be dragged and how it behaves.


```js
import {draggables} from 'draggables';

draggables(contextElement, options);
```

* `contextElement` (`HTMLElement`, required) - The element that will get a single pointerdown listener. It can be a draggable itself or contain draggables.
* `options` (`DragInstanceOptions`, optional) - See [Options](#options) below.

The context element plays a different role depending on the `target` option:

* With no `target` option, the context element itself is the dragged element (e.g. a floating dialog that can be moved freely around the page).
* With a `target` option, the context element is a common ancestor that delegates `pointerdown` to the matching draggable targets inside it (e.g. a board with notes on it). It's also their default dragging area boundary (see [container option](#option-container)).



### Options

| Option         | Value                          | Default    |
|----------------|--------------------------------|------------|
| [`target`](#option-target) | `string` \| `(ev) => HTMLElement \| null` | context element |
| [`grip`](#option-grip) | `string`                       | -          |
| [`container`](#option-container) | `HTMLElement` \| `string`      | -          |
| [`bound`](#option-bound) | `"element"` \| `"pointer"`     | `"element"`|
| [`button`](#option-button) | `number`                       | `0`        |
| [`translate`](#option-translate) | `boolean`                      | `false`    |
| [`cancelOnEsc`](#option-cancelonesc) | `boolean`                      | `true`     |
| [`threshold`](#option-threshold) | `number` (px)                  | `3`        |

&nbsp;



<!-- target -->
### Option: `target`
What to drag. A selector or a function. When omitted the context element becomes the target.

**Selector** - the closest match to the pointer, inside the context element.

```js
draggables(board, {target: '.card'});
```

**Function** - gets the `pointerdown` event, returns the element to drag or `null` for no drag. To use a [grip](#option-grip), check for it inside the function.

```js
draggables(board, {target: (ev) => HTMLElement | null});
```

Use a function when the decision depends on app state a selector can't express. For example, drag only the cards the current user can edit:

```js
draggables(board, {
   target: (ev) => {
      const card = ev.target.closest('.card');
      return card && canEdit(card) ? card : null;
   }
});
```

To toggle draggability, toggle a class on the element (e.g. ".locked") and exclude it:

```js
draggables(board, {target: '.card:not(.locked)'});
// or:
draggables(board, {
   target: (ev) => ev.target.closest('.card:not(.locked)')
});
```



<!-- grip -->
### Option: `grip`
The handle selector. When set, a drag only starts on a grip.

The dragged element is the closest `target` to it (or the context element).

For example, drag a card by grabbing its header:

```js
draggables(board, {target: '.card', grip: '.card-header'});
```


<!-- container -->
### Option: `container`
An element or a selector. The area the dragged element (or the pointer, [see `bound` option](#option-bound)) must stay in.
A selector picks the nearest ancestor of the dragged element that matches it.

The distance values reported to your handlers (`dx`/`dy`) are clamped, so the dragged element/pointer stays inside the container's padding box. Also adds the container fields to the [drag data](#drag-data).

With a `target`, the container defaults to the context element. Set `container` to bound dragging to a different element instead:

```js
draggables(slider, {target: '.thumb', container: '.track'});
```

A selector that matches nothing logs a warning and the values arrive unclamped.



<!-- bound -->
### Option: `bound`
What to keep inside the container:

* `"element"` (default) - the dragged element's box.
* `"pointer"` - the pointer. For drawing and resizing. Adds the container fields even without a `container` (then it's the dragged element).

```js
draggables(canvas, {bound: 'pointer'});
```

Example - Dragging a box against its container's right edge (`*` is the pointer):
```
bound: 'element'                  bound: 'pointer'
┌─ container ─────────┐          ┌─ container ─────────┐
│          ┌──────────┤          │              ┌──────┴──┐
│          │  *       │          │              │      *  │
│          └──────────┤          │              └──────┬──┘
└─────────────────────┘          └─────────────────────┘
 box stops at the edge,           pointer stops at the edge
 pointer can keep going           box may overflow
```



<!-- button -->
### Option: `button`
The mouse button that starts a drag (`0` left, `1` middle, `2` right). Applies to every kind of `target`. Default: `0`.

```js
// right-click gesture
draggables(surface, {button: 2});
```


<!-- translate -->
### Option: `translate`
Default: `false`. Use it to move an element with CSS `translate`. Your handlers get `tx`/`ty`, the element's new translate (its translate at grab plus `dx`/`dy`).

> **Pixels only (`%` is read as `px`).**

```js
draggables(board, {target: '.card', translate: true})
   .on('dragging', ({elm, tx, ty}) => {
      elm.style.translate = `${tx}px ${ty}px`;
   });
```


<!-- cancelOnEsc -->
### Option: `cancelOnEsc`
Pressing Esc mid-drag fires `dragCancel`. Default: `true`.

```js
draggables(board, {target: '.card', cancelOnEsc: false});
```


<!-- threshold -->
### Option: `threshold`
Number of pixels the pointer must travel before `dragStart` fires. Below it, a release is a plain click (no `dragEnd`). Default: `3`.

```js
draggables(list, {target: '.item', threshold: 10});
```

&nbsp;

---------------------------------------------------------

## Events
Calling `draggables()` returns a `DragInstance` <!-- TODO: a DraggerInstance? -->.

A drag instance emits an event at each stage of the gesture. Each event carries a [`DragData`](#drag-data) object with coordinates, relative positions and more - everything you need to update your DOM.

### Gesture Lifecycle
| Event          | Fires                                                                 | Use for |
|----------------|-----------------------------------------------------------------------|---------|
| `'grab'` | on `pointerdown` on a target                         | highlight |
| `'dragStart'` | on the first `pointermove` that crosses the [threshold](#option-threshold)                 | "dragging" class |
| `'dragging'` | on every `pointermove` after that                                     | moving |
| `'dragEnd'` | on `pointerup`, only if the drag started                              | saving position |
| `'dragCancel'` | when the drag is aborted: on `Esc` keypress, on `pointercancel`, or when calling the instance's `.cancelDrag()` or `.destroy()` | reverting |
| `'release'` | on `pointerup`, or after `dragCancel` | unhighlight |

> A click (no move past the threshold) fires only `grab` and `release`.

> `dragCancel` and `release` get only `{elm, grip}`, not the full [`DragData`](#drag-data).


### Listening to Events
You start listening to an event by calling `.on()` with its name and a callback, and stop with `.off()`.

```js
const dragger = draggables(board);

dragger.on(EVENT_NAME, doSomething)
dragger.off(EVENT_NAME);
```
An instance holds a single handler per event (unlike an EventEmitter):

```js
draggables(board)
   .on('dragStart', doSomething)     // <-- this is replaced
   .on('dragStart', doSomethingElse) // <-- by this (same event)
```

### Drag Data
Each event handler gets a `DragData` object describing the drag at that moment. For example:

```js
draggables(board, {target: '.card'})
   .on('dragging', (dragData) => {
      console.log(dragData.dx, dragData.dy);
   });
```


| Property     | Description                                                   |
|--------------|---------------------------------------------------------------|
| `ev`         | the vanilla `PointerEvent`                                    |
| `elm`        | the dragged element (not always `ev.target`)                  |
| [`grip`](#option-grip) | the grabbed grip (when no `grip` option, it's `=== elm`)            |
| `dx`, `dy`   | delta/distance since drag start. Clamped with `container`                    |
| `x`, `y`     | current pointer, viewport px (`clientX`/`clientY`, not page)  |
| `left`, `top`| start `offsetLeft`/`offsetTop` (from nearest positioned ancestor) + `dx`/`dy` |
| `container`  | the container element. With `container` or `bound: 'pointer'` |
| `startContainerX`, `startContainerY` | grab point relative to the container. With `container` or `bound: 'pointer'` |
| `containerX`, `containerY` | grab point relative to the container + `dx`/`dy` (clamped). With `container` or `bound: 'pointer'` |
| `tx`, `ty`   | start `translate` + `dx`/`dy`. With `translate: true`         |


> In TypeScript, optional fields appear only when you set the option that enables them (e.g. `tx`/`ty` with `translate: true`).



### Other Methods
A `DragInstance` also has the following methods:

* [.cancelDrag()](#canceldrag)
* [.refreshContainerBounds()](#refreshcontainerbounds)
* [.destroy()](#destroy)

#### **.cancelDrag()**
Aborts the current drag. Fires `dragCancel` if the threshold was crossed. No-op when idle. This is what Esc calls when pressed (see [`cancelOnEsc` option](#option-cancelonesc)).

```js
window.addEventListener('blur', () => dragger.cancelDrag());
```


#### **.refreshContainerBounds()**
Sometimes the container moves or resizes during a drag (e.g. the page scrolls). Call this to re-read its rect, so clamping matches its new edges. No-op when idle.

```js
list.addEventListener('scroll', () => dragger.refreshContainerBounds());
```


#### **.destroy()**
Kills the instance for good: cancels an active drag, unbinds event listeners, drops handlers. Use it when the context element is removed from the DOM.

```js
// Vanilla 
const cardDragger = draggables(board, {target: '.card'});
cardDragger.destroy();
```

```js
// React
useEffect(() => {
   const cardDragger = draggables(boardRef.current, {target: '.card'});
   return () => cardDragger.destroy();
}, []);
```

## Caveats
### Nested Context Elements
Nested context elements both drag. To drag only the inner one, stop propagation on its `grab`:

```js
draggables(inner).on('grab', ({ev}) => ev.stopPropagation());
```

### Touch
Set `touch-action: none` on your draggables (or grips). Without it, the browser claims touch drags as page scrolls.

### Images & Links
Dragging an `<img>` or `<a>` starts the browser's native drag, which cancels yours. Either set `draggable="false"` on them (or CSS `-webkit-user-drag: none`), or prevent it for the whole context element:

```js
board.addEventListener('dragstart', (ev) => ev.preventDefault());
```

```css
.card { touch-action: none; }
```

If the browser cancels the pointer (`pointercancel`), the drag ends with `dragCancel`.

### Text Selection
Dragging selects text. Block it with CSS (`.card { user-select: none; }`), or only while dragging:

```js
draggables(board, {target: '.card'})
   .on('grab', () => document.body.classList.add('no-select'))
   .on('release', () => document.body.classList.remove('no-select'));
```

-----

## Helper Utils
Small functions for common drag tasks, so you don't have to write them yourself. Not required, just convenient. 

### Clamp
A trivial one-liner, exported for everything `container` doesn't cover.

* `clamp(n, min, max)` - returns `n` limited to the `min`-`max` range.

#### Example
Limiting a resizable panel's height:
```js
import {draggables, clamp} from 'draggables';

const MIN = 100
const MAX = 500
let startHeight = 300

draggables(splitter).on('dragging', ({dy}) => {
   // `dy` = Y axis delta 
   const newValue = startHeight + dy;
   const clampedValue = clamp(newValue, MIN, MAX);

   panel.style.height = `${clampedValue}px`;
});
```


### Dropzones
Find which of your dropzones (elements matching a selector you pass) is under the pointer. Each helper returns the zone element or `null`.

Pass the dragged element as `exclude` so it doesn't count as a zone. With nested zones, the innermost wins.

#### Measure Once
Measure all zones once when the drag starts (`measureZones`), then check the pointer against them on each move (`hitZone`). Measure again if zones move or show up mid-drag.

```js
import {draggables, measureZones, hitZone} from 'draggables';

let zones;
draggables(board, {target: '.card'})
   .on('dragStart', ({elm}) => zones = measureZones('.trash', elm))
   .on('dragEnd', ({elm, x, y}) => {
      if (hitZone(zones, x, y)) elm.remove();
   });
```

#### Check Live
Ask the browser what's under the pointer on each move (`findDropzone`). Slower, but it respects `z-index`. Calling it only on `dragEnd` is cheap. On every move it may cause jank on heavy pages.

```js
import {draggables, findDropzone} from 'draggables';

draggables(board, {target: '.card'})
   .on('dragEnd', ({elm, x, y}) => {
      if (findDropzone(x, y, '.trash', elm)) elm.remove();
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
