import type {DragAxis} from '../src/types';

/*
          400
  ┌────┬───────────────┐
  │ 20 │				     │
  ├────┼───────┐       │
  │    │       │       │
  │    │  100  │  280  │
  │    │       │       │ 400
  │    └───────┘       │
  │              	     │
  │      280     	     │
  └────────────────────┘

*/

export function createContainerElm () {
	const container = document.createElement('div');

	container.id = 'test-dom-container';
	container.style.width = '400px';
	container.style.height = '400px';
	container.style.padding = '20px';
	container.style.boxSizing = 'border-box';

	return container;
}

export function createDraggableElm () {
	const elm = document.createElement('div');

	elm.id = 'target';
	elm.style.width = '100px';
	elm.style.height = '100px';
	elm.style.backgroundColor = 'pink';
	elm.dataset.dragRole = 'draggable';

	return elm;
}

export function setAxis (elm: HTMLElement, axis: DragAxis) {
	elm.dataset.dragAxis = axis;
}

export function addChild (elm: HTMLElement) {
	const child = document.createElement('div');

	child.id = 'child';
	child.style.width = '50px';
	child.style.height = '50px';
	child.style.backgroundColor = 'steelblue';

	elm.appendChild(child);
	return child;
}

export function addGripChild (grip: HTMLElement) {
	const child = document.createElement('div');

	child.id = 'grip-child';
	child.style.width = '15px';
	child.style.height = '15px';
	child.style.backgroundColor = 'rebeccapurple';

	grip.appendChild(child);
	return child;
}

export function addGrip (elm: HTMLElement, grip?: HTMLElement) {
	grip ||= createGripElm('A');

	elm.appendChild(grip);
	return grip;
}

function createGripElm (id: string) {
	const grip = document.createElement('div');

	grip.dataset.dragRole = 'grip';
	grip.id = `grip-${id}`;
	grip.style.width = '30px';
	grip.style.height = '30px';
	grip.style.margin = '10px';
	grip.style.backgroundColor = 'red';

	return grip;
}
