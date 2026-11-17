import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {drag, type DragData, type DragInstance, type DragInstanceOptions} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('Clamping', () => {
	let elm: HTMLElement;
	let container: HTMLElement;
	let instance: DragInstance;
	let mouse: ReturnType<typeof createMouseSimulator>;
	let dragData: DragData;

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

	const dragWith = (target: HTMLElement, opts?: DragInstanceOptions) => {
		instance = drag(target, opts).on('dragEnd', (data) => dragData = data);
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
			expect(dragData).toMatchObject({dx: 20, dy: 30});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWithin(container);
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 250, dy: 250});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWithin(container);
			dragBy([-1000, -1000]);
			expect(dragData).toMatchObject({dx: -50, dy: -50});
		});

		it('accepts a selector', () => {
			placeAt(50, 50);
			dragWithin('#test-dom-container');
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 250, dy: 250});
		});

		it('returns the unclamped delta when the selector matches nothing', () => {
			dragWithin('#nothing');
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 1000, dy: 1000});
		});

		it('works with translate positioning', () => {
			elm.style.left = '0px';
			elm.style.top = '0px';
			elm.style.translate = '50px 50px';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWithin(container);
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 250, dy: 250});
		});

		it('refreshContainerBounds re-reads the container mid-drag', () => {
			placeAt(50, 50);
			dragWithin(container);
			mouse.down([1, 1]);
			container.style.width = '600px';
			instance.refreshContainerBounds();
			mouse.move([1000, 1000]);
			mouse.up();
			expect(dragData).toMatchObject({dx: 450, dy: 250});
		});

		it('refreshContainerBounds is a chainable no-op without an active drag', () => {
			placeAt(50, 50);
			dragWithin(container);
			container.style.width = '600px';
			expect(instance.refreshContainerBounds()).toBe(instance);
			container.style.width = '400px';
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 250, dy: 250});
		});

		it('clamps `dragStart` and `dragging` too', () => {
			placeAt(50, 50);
			dragWithin(container);
			const starts: DragData[] = [];
			const moves: DragData[] = [];
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
			expect(dragData).toMatchObject({dx: 230, dy: 230});
			placeAt(50, 50);
			dragBy([-1000, -1000]);
			expect(dragData).toMatchObject({dx: -50, dy: -50});
		});
	});

	describe('default container', () => {
		it('is the context element when a target is set', () => {
			elm.classList.add('item');
			placeAt(50, 50);
			dragWith(container, {target: '.item'});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 250, dy: 250, containerX: 301, containerY: 301});
		});

		it('is none without a target', () => {
			placeAt(50, 50);
			dragWith(elm);
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 1000, dy: 1000});
		});
	});

	describe('bound: pointer', () => {
		it('returns the pointer relative to the container', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([20, 30]);
			expect(dragData).toMatchObject({startContainerX: 51, startContainerY: 51});
			expect(dragData).toMatchObject({containerX: 71, containerY: 81});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 349, dy: 349, containerX: 400, containerY: 400});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWith(container, {bound: 'pointer'});
			dragBy([-1000, -1000]);
			expect(dragData).toMatchObject({dx: -51, dy: -51, containerX: 0, containerY: 0});
		});

		it('keeps the pointer inside a given container', () => {
			placeAt(50, 50);
			dragWith(elm, {bound: 'pointer', container});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 349, dy: 349, containerX: 400, containerY: 400});
		});

		it('returns the unclamped delta when the selector matches nothing', () => {
			dragWith(elm, {bound: 'pointer', container: '#nothing'});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({dx: 1000, dy: 1000});
			expect(dragData.containerX).toBeUndefined();
		});
	});

	describe('container points', () => {
		it('follows the clamped delta in element mode', () => {
			placeAt(50, 50);
			dragWith(elm, {container});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({startContainerX: 51, startContainerY: 51});
			expect(dragData).toMatchObject({containerX: 301, containerY: 301});
		});

		it('are undefined without a container', () => {
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragData.containerX).toBeUndefined();
			expect(dragData.startContainerX).toBeUndefined();
		});
	});

	describe('left & top', () => {
		it('returns the start offset plus the delta', () => {
			placeAt(50, 50);
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragData).toMatchObject({left: 70, top: 80});
		});

		it('follows the clamped delta', () => {
			placeAt(50, 50);
			dragWith(elm, {container});
			dragBy([1000, 1000]);
			expect(dragData).toMatchObject({left: 300, top: 300});
		});
	});

	describe('translate option', () => {
		it('returns the start translate plus the delta', () => {
			elm.style.translate = '10px 20px';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWith(elm, {translate: true});
			dragBy([20, 30]);
			expect(dragData).toMatchObject({tx: 30, ty: 50});
		});

		it('accumulates across drags when written back', () => {
			dragWith(elm, {translate: true});
			dragBy([20, 30]);
			elm.style.translate = `${dragData.tx}px ${dragData.ty}px`;
			dragBy([5, 5]);
			expect(dragData).toMatchObject({tx: 25, ty: 35});
		});

		it('is off by default', () => {
			dragWith(elm);
			dragBy([20, 30]);
			expect(dragData.tx).toBeUndefined();
		});
	});
});
