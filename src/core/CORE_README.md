core
====
Drag gesture math. No DOM, no events, no listeners.

## Basic Usage

```js
// js / ts
import {Drag} from './src/core/Drag';

const d = new Drag({threshold: 3});

d.start(10, 10);   // pointerdown
d.move(11, 10);    // --> null (below threshold)
d.move(20, 10);    // --> {isStart: true, dx: 10, dy: 0, x: 20, y: 10}
d.end(25, 12);     // --> {dx: 15, dy: 2, x: 25, y: 12}
```

>NOTE: Core is a private helper of `drag()` - not exported from the package (yet).

#### Section Links:
* [The Idea](#the-idea)
* [States](#states)
* [Threshold](#threshold)
* API:
	* [Creation](#new-dragoptions)
	* [.start()](#startx-y)
	* [.move()](#movex-y)
	* [.end()](#endx-y)
	* [.cancel()](#cancel)


### The Idea
You feed it pointer positions, it returns what happened. Synchronous - nothing to subscribe to.  
Naming events, resolving elements and binding listeners is the caller's job (see `src/dom/`).

One instance is reused across gestures, one gesture at a time.


### States

| State      | Entered by                         |
|------------|------------------------------------|
| `idle`     | construction, `.end()`, `.cancel()`|
| `pending`  | `.start()`                         |
| `dragging` | `.move()` crossing the threshold   |

> `.move()`, `.end()` and `.cancel()` throw while `idle`.


### Threshold
Distance (px) from the start point the pointer must travel before a drag starts. Default `3`.

The first move that crosses it returns the real `dx`/`dy` (already ~3px), not zeros - this keeps the element under the cursor.

---------------------------------------------------------

## API

### `new Drag(options)`
#### arguments
* options: `DragOptions` = optional.
	* `threshold: number` - default `3`.

```js
new Drag();
new Drag({threshold: 0});
```

### **.start(x, y)**
Begins a gesture at the pointer position. `idle` → `pending`.


### **.move(x, y)**
Returns `null` below the threshold. Otherwise a `DragPosition` plus `isStart`:

| Property   | Description                                           |
|------------|-------------------------------------------------------|
| `isStart`  | `true` on the move that crossed the threshold         |
| `dx`, `dy` | since `.start()`                                      |
| `x`, `y`   | the given position                                    |


### **.end(x, y)**
Ends the gesture. `→ idle`.  
Returns a `DragPosition` (`dx`, `dy`, `x`, `y`), recomputed from the given position - or `null` if the threshold was never crossed (a plain click).

> Pass the `pointerup` position, not the last move's. The pointer can travel between the two.


### **.cancel()**
Aborts the gesture (Esc, `pointercancel`, destroy). `→ idle`.  
Returns `true` if it was dragging - i.e. there's something to revert.

```js
if (d.cancel()) revert();
```
