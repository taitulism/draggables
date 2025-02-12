[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
![Build Status](https://github.com/taitulism/draggables/actions/workflows/ci.yml/badge.svg)

draggables
==========
Draggable elements.

## Basic Usage

```sh
$ npm install draggables
```

```html
<!-- HTML -->
<body>
   <div data-drag-role="draggable"></div>
</body>
```

```js
// js / ts
import {draggables} from 'draggables';

draggables(contextElm, options);
```

#### Section Links:
* [Context Element](#context-element)
* [Boundary Element](#boundary-element)
* [Setting Initial Position](#setting-initial-position)
* [Data Attributes](#data-attributes)
* Instance API:
	* [Creation](#draggablescontextelement-options)
	* [Enable / Disable](#enable--disable)
	* [Events](#oneventname-callback--offeventname)
	* [Destruction](#destroy)


### Context Element
Default - `document.body`

>NOTE: The context element is not necessarily a draggable element.

The context element is the element that listens to `pointerdown` events for all draggable elements within it.
Each instance binds a *single* event listener to the context element, or to the `<body>` element, if ommited.


### Boundary Element
To prevent draggable elements from being moved off-screen and lost, they are always confined within a boundary.

By default, this boundary is the `<body>` element. However, you can define a different element as the draggables container by setting it with the `data-drag-zone` attribute. A draggable element will be restricted to its closest ancestor with `data-drag-zone` or the `<body>` element.

> During a drag, text selection is disabled by applying a `user-select: none` style to the boundary element.


### Setting Initial Position
Draggable elements are moved using CSS `translate(x, y)` which offsets them relative to their natural position in the DOM (in pixels) and continuously updates as the element is dragged.

If you want a draggable element to start at a specific position (e.g. restoring a saved position after a page reload), you should set its `translate` style manually when rendering the element for the first time.

```js
<div
   data-drag-role="draggable"
   style="translate: 30px -4px;"
>...</div>
```

## Data Attributes
You can control the dragging behavior by using different data attributes.

> NOTE: **Boolean** attributes are `true` when present (key only) and `false` when omitted.  
No value is needed, simply including the attribute enables it.

| Attribute Name            | Value                     | 
|---------------------------|---------------------------|
| `data-drag-role`          | `"draggable"` \| `"grip"` |
| `data-drag-zone`          | `Boolean`                 |
| `data-drag-prevent-click` | `Boolean`                 |

The following attributes can only be set on an elements that have `data-drag-role` set to `"draggable"`:

| Attribute Name            | Value                     | 
|---------------------------|---------------------------|
| `data-drag-axis`          | `"x"` \| `"y"`            |
| `data-drag-disabled`      | `Boolean`                 |

&nbsp;

### Details
#### Click to expand:

<!-- data-drag-role -->
<details>
   <summary><code>data-drag-role</code> = "draggable"</summary><br />
   Makes an element draggable.
   
   <br />
   Can be used together with:

   * `data-drag-axis`
   * `data-drag-disabled`

----------
</details>


<!-- data-drag-role -->
<details>
   <summary><code>data-drag-role</code>="grip"</summary><br />
   Set this attribute on an element to make it the handle/grip of its closest draggable element. When used, draggable elements can only be dragged when grabbed by their grip. A grip must be a descendant of a draggable element (throws an error when it's not).

----------
</details>


<!-- data-drag-zone -->
<details>
   <summary><code>data-drag-zone</code></summary><br />
   Set this attribute on the element you want to define as the boundary element of its descendant draggable elements
   (see <a href="#boundary-element">Boundary Element</a>).

----------
</details>



<!-- data-drag-prevent-click -->
<details>
   <summary><code>data-drag-prevent-click</code></summary><br />
   When dragging an element by one of its clickable elements (button, checkbox etc.) they dispatch a click event on drop. Set this attribute on clickable elements inside a draggable element to ignore that click.

----------
</details>


<!-- data-drag-axis -->
<details>
   <summary><code>data-drag-axis</code>="x" | "y"</summary><br />

   <strong>Must be used on an element with <code>data-drag-role="draggable"</code></strong>
   
   By default you can drag elements freely on both axes. You can Limit an element's movement to a single axis.

   * `"x"` - Limit dragging movment along the `x` axis.
   * `"y"` - Limit dragging movment along the `y` axis.

----------
</details>


<!-- data-drag-disabled -->
<details>
   <summary><code>data-drag-disabled</code></summary><br />

   <strong>Must be used on an element with <code>data-drag-role="draggable"</code></strong>

   Set this attribute when you need to toggle draggability of a draggable element.  
   This for toggling draggability of a single draggable element. If you want to disable all draggables in a context see [`.disable()`](#enable--disable) below.

----------
</details>

&nbsp;

### Example:
```html
<div
   class="card"
   data-drag-role="draggable"
   data-drag-axis="x"
   data-drag-disabled="false"
>
   <div class="card-title" data-drag-role="grip">
      Grab here!
   </div>
   <div class="card-body">
      Grab the title to move the card
      <button data-drag-prevent-click>
         Click
      </button>
   </div>
</div>
```
---------------------------------------------------------

## Instance API

### `draggables(contextElement, options)`
#### arguments
* contextElement: `HTMLElement` = optional. See [Context Element](#context-element) section above.
* options: `DraggablesOptions` = optional. The instance's configuration object, applied for all draggable elements within the context element:
	* `padding: number` - Prevents dragging if the element was grabbed within this number of pixels from any **side edge**. Default is `0`.
	* `cornerPadding: number` - Prevents dragging if the element was grabbed within this number of pixels from a **corner**. Default is `0`.

> Padding options are useful for draggable elements that are also resizable, preventing unintended drags when grabbing edges or corners.

```js
draggables();             // -->  <body>
draggables({padding: 8}); // -->  <body>
draggables(myElm);
draggables(myElm, {padding: 8});
```


Returns a `Draggables` instance:
```js
const d = draggables();
```

It has the following methods:

### **.enable() / .disable()**
Toggle draggability for all draggable elements within the context. When disabled, the main element gets a `'drag-disabled'` classname.

```js
const d = draggables();
// draggability is enabled on construction

d.disable();
d.enable();
```

>Note: Calling `.disable()` on an instance disables draggability for all draggable elements withing the context element. You can disable specific draggable elements using the disable data attribute. See [Data Attributes](#data-attributes).


### **.on(eventName, callback) / .off(eventName)**
Start and stop listening to drag events:
* **`'grab'`** - fires on `pointerdown` on a draggable element.
* **`'dragStart'`** - drag started, fires on the first `pointermove` that crosses the threshold (3px, hardcoded).
* **`'dragging'`** - dragging around, fires on every `pointermove` except the first one.
* **`'dragEnd'`** - dragging ended, fires on `pointerup`.

A `Draggables` instance can only hold a single event listener for each event (unlike an EventEmitter):

```js
const doSomething = () => {...}
const doSomethingElse = () => {...}
const stopDoingThing = () => {...}

const d = draggables()
   .on('dragStart', doSomething)     // <-- this is replaced
   .on('dragStart', doSomethingElse) // <-- by this (same event)
   .on('dragEnd', stopDoingThing)

d.off('dragStart');
```

**Event Handlers**  
The event handlers get called with a `DragEventWrapper` object which holds 3 properties:
* `ev` - the vanilla pointer event (type `PointerEvent`)
* `elm` - the draggable element, which is not always the `ev.target` (type `HTMLElement`), 
* `relPos` - the draggable element's relative position (in pixels), that is, relative to its pre-drag position (type `[x: number, y: number]`)

```js
draggables().on('dragging', (dragEv: DragEventWrapper) => {
   console.log(
      dragEv.elm,       // e.g. <div data-drag-role="draggable">
      dragEv.ev.target, // e.g. <div data-drag-role="grip">
      dragEv.relPos     // e.g. [3, -8] (on 'grab' events it's always [0,0])
   );
});
```


### **.destroy()**
Kills the `Draggables` instance for good, unbinds event listeners, releases element references. Once destroyed, an instance cannot be revived. Use it when the context element is removed from the DOM.
