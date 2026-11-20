import {beforeEach, afterEach, describe, it, expect, vi} from 'vitest';
import {createDragger, type DragState, type Dragger, type DraggerOptions} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('Container', () => {
	let elm: HTMLElement;
	let container: HTMLElement;
	let instance: Dragger;
	let mouse: ReturnType<typeof createMouseSimulator>;
	let dragState: DragState;

	beforeEach(() => {
		container = createContainerElm();
		container.style.position = 'relative';
		document.body.appendChild(container);

		elm = createDraggableElm();
		elm.style.position = 'absolute';
		container.appendChild(elm);

		mouse = createMouseSimulator();
		mouse.moveToElm(elm);
	});

	afterEach(() => {
		instance.destroy();
		container.remove();
		mouse.reset();
	});

	const dragWith = (target: HTMLElement, opts?: DraggerOptions) => {
		instance = createDragger(target, opts).on('dragEnd', (data) => dragState = data);
	};

	const placeAt = (left: number, top: number) => {
		elm.style.left = `${left}px`;
		elm.style.top = `${top}px`;
		mouse.reset();
		mouse.moveToElm(elm);
	};

	const dragBy = (move: [number, number]) => {
		mouse.down([1, 1]).move(move);
		mouse.up();
	};

	describe('container option', () => {
		const dragWithin = (container: HTMLElement | string) => {
			dragWith(elm, {container});
		};

		it('returns the unclamped delta when inside the container', () => {
			dragWithin(container);
			dragBy([20, 30]);
			expect(dragState).toMatchObject({dx: 20, dy: 30});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWithin(container);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWithin(container);
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -50, dy: -50});
		});

		it('accepts a selector', () => {
			placeAt(50, 50);
			dragWithin('#test-dom-container');
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('returns the unclamped delta when the selector matches nothing', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			dragWithin('#nothing');
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 1000, dy: 1000});
			expect(warn).toHaveBeenCalledWith('draggable: container "#nothing" matched no ancestor');
			warn.mockRestore();
		});

		it('works with translate positioning', () => {
			elm.style.left = '0px';
			elm.style.top = '0px';
			elm.style.translate = '50px 50px';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWithin(container);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('refreshContainerBounds re-reads the container mid-drag', () => {
			placeAt(50, 50);
			dragWithin(container);
			mouse.down([1, 1]);
			container.style.width = '600px';
			instance.refreshContainerBounds();
			mouse.move([1000, 1000]);
			mouse.up();
			expect(dragState).toMatchObject({dx: 450, dy: 250});
		});

		it('refreshContainerBounds is a chainable no-op without an active drag', () => {
			placeAt(50, 50);
			dragWithin(container);
			container.style.width = '600px';
			expect(instance.refreshContainerBounds()).toBe(instance);
			container.style.width = '400px';
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('clamps `dragStart` and `dragging` too', () => {
			placeAt(50, 50);
			dragWithin(container);
			const starts: DragState[] = [];
			const moves: DragState[] = [];
			instance.on('dragStart', (data) => starts.push(data)).on('dragging', (data) => moves.push(data));
			mouse.down([1, 1]).move([1000, 1000]).move([10, 10]);
			mouse.up();
			expect(starts[0]).toMatchObject({dx: 250, dy: 250});
			expect(moves[0]).toMatchObject({dx: 250, dy: 250});
		});

		it('stops at the container padding box, inside its border', () => {
			container.style.border = '10px solid';
			placeAt(50, 50);
			dragWithin(container);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 230, dy: 230});
			placeAt(50, 50);
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -50, dy: -50});
		});
	});

	describe('default container', () => {
		it('is the context element when a target is set', () => {
			elm.classList.add('item');
			placeAt(50, 50);
			dragWith(container, {target: '.item'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250, containerX: 301, containerY: 301});
		});

		it('is none when a target function returns the context element', () => {
			placeAt(50, 50);
			dragWith(elm, {target: () => elm});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 1000, dy: 1000});
		});

		it('is none without a target', () => {
			placeAt(50, 50);
			dragWith(elm);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 1000, dy: 1000});
		});
	});

	describe('bound: pointer', () => {
		it('returns the pointer relative to the container', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([20, 30]);
			expect(dragState).toMatchObject({startContainerX: 51, startContainerY: 51});
			expect(dragState).toMatchObject({containerX: 71, containerY: 81});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, containerX: 400, containerY: 400});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -51, dy: -51, containerX: 0, containerY: 0});
		});

		it('keeps the pointer inside a given container', () => {
			placeAt(50, 50);
			dragWith(elm, {bound: 'pointer', container});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, containerX: 400, containerY: 400});
		});

		it('returns the unclamped delta when the selector matches nothing', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			dragWith(elm, {bound: 'pointer', container: '#nothing'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 1000, dy: 1000});
			expect(dragState.containerX).toBeUndefined();
			expect(warn).toHaveBeenCalledWith('draggable: container "#nothing" matched no ancestor');
			warn.mockRestore();
		});
	});

	describe('container points', () => {
		it('follows the clamped delta in element mode', () => {
			placeAt(50, 50);
			dragWith(elm, {container});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({startContainerX: 51, startContainerY: 51});
			expect(dragState).toMatchObject({containerX: 301, containerY: 301});
		});

		it('are undefined without a container', () => {
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragState.containerX).toBeUndefined();
			expect(dragState.startContainerX).toBeUndefined();
		});
	});

	describe('container element', () => {
		it('is the given element', () => {
			dragWith(elm, {container});
			dragBy([20, 30]);
			expect(dragState.container).toBe(container);
		});

		it('is the element matched by a selector', () => {
			dragWith(elm, {container: '#test-dom-container'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(container);
		});

		it('is the context element when a target is set', () => {
			elm.classList.add('item');
			dragWith(container, {target: '.item'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(container);
		});

		it('is the dragged element with bound: pointer and no container', () => {
			dragWith(container, {bound: 'pointer'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(container);
		});

		it('is undefined when the selector matches nothing', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			dragWith(elm, {container: '#nothing'});
			dragBy([20, 30]);
			expect(dragState.container).toBeUndefined();
			warn.mockRestore();
		});

		it('is undefined without a container', () => {
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragState.container).toBeUndefined();
		});
	});

	describe('left & top', () => {
		it('returns the start offset plus the delta', () => {
			placeAt(50, 50);
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragState).toMatchObject({left: 70, top: 80});
		});

		it('follows the clamped delta', () => {
			placeAt(50, 50);
			dragWith(elm, {container});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({left: 300, top: 300});
		});
	});

	describe('translate option', () => {
		it('returns the start translate plus the delta', () => {
			elm.style.translate = '10px 20px';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWith(elm, {translate: true});
			dragBy([20, 30]);
			expect(dragState).toMatchObject({tx: 30, ty: 50});
		});

		it('accumulates across drags when written back', () => {
			dragWith(elm, {translate: true});
			dragBy([20, 30]);
			elm.style.translate = `${dragState.tx}px ${dragState.ty}px`;
			dragBy([5, 5]);
			expect(dragState).toMatchObject({tx: 25, ty: 35});
		});

		it('is off by default', () => {
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragState.tx).toBeUndefined();
		});
	});
});
