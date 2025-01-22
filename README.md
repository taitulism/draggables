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
To prevent users from dragging an element off-screen and being unable to retrieve it, a boundary element is always defined.

By default, the `<body>` element acts as the global movement container for all draggable elements. However, you can designate a different element as the boundary of its descendant draggable elements by adding the `data-drag-zone` attribute to it.

So a draggable element's dragging zone is its closest parent with the `data-drag-zone` attribute or the `<body>` element.


## Data Attributes
Using different data attributes you can control the dragging behavior.

> To make an element "draggable" set its `data-drag-role` attribute to `"draggable"`.

* `data-drag-zone` - Set this attribute (key only, no value) on the element you want to define as the boundary element of its descendant draggable elements (see [Boundary Element](#boundary-element)).
* `data-drag-role` = `"draggable" | "grip"`
	* `"draggable"` - Makes the element draggable.  
	Can be used together with:
		* `data-drag-axis` = `"x" | "y"`  
		By default you can drag elements freely on both axes. You can Limit an element's movement to a single axis. 
			* `"x"` - Limit dragging movment along the `x` axis.
			* `"y"` - Limit dragging movment along the `y` axis.
		* `data-drag-disabled`
			* `"true"` - Disables dragging
			* `"false"` - Enables dragging

			Set this attribute when you need to toggle draggability of a draggable element.  
			This toggles draggability of a single draggable element. If you want to disable all draggables in a context see [`.disable()`](#enable--disable) below.
	* `"grip"` - The element becomes the handle of its closest draggable element. When used, draggable elements can only be dragged when grabbed by their grip element. A grip must be a descendant of a draggable element (throws an error when it's not).
* `data-drag-prevent-click` - When dragging an element by one of its clickable elements (button, checkbox etc.) they get clicked on drop. Set this attribute (key only, no value) on clickable elements inside a draggable element to prevent their click event on drop.


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

### "read-only" data attributes
> Not actually read-only attributes per se but you probably should not change them.

#### `data-drag-active` (key only attribute)
While dragging an element it is set with a "read-only" data attribute: `data-drag-active` . It is removed on drop. This is mostly for styling purposes.

```css
[data-drag-active] {
   background-color: yellow;
}
```

#### `data-drag-position="x,y"`
Elements are moved around using CSS `translate(x, y)` which sets a relative position to an element's original-natural position. When dropping an element its [x,y] position is saved as value of the data-attribute `data-drag-position="x,y"`. This position will be used as the new starting point for the following drag event.


## Instance API

### `draggables(contextElement, options)`
#### arguments
* `contextElement: HTMLElement` - optional. See [Context Element](#context-element) section above.
* `options: DraggablesOptions` - optional. The instance's configuration object, applied for all draggable elements under the context element:
	* `padding: number` - Blocks dragStart if the draggable element was grabbed by its **edge** within this number of pixels. Default is `0`.
	* `cornerPadding: number` - Blocks dragStart if the draggable element was grabbed by its **corner** within this number of pixels. Default is `0`.
```js
draggables();             // -->  <body>
draggables({padding: 8}); // -->  <body>
draggables(myElm);
draggables(myElm, {padding: 8});
```

> The padding options are for dealing with draggable elements that are also resizable (by grabbing their corners/edges).

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
