import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {createDragger, type DragState, type Dragger, type DraggerOptions} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';
import {readTranslate} from '../../src/dom/helpers';

describe('Container', () => {
	let elm: HTMLElement;
	let contextElm: HTMLElement;
	let instance: Dragger;
	let mouse: ReturnType<typeof createMouseSimulator>;
	let dragState: DragState;

	beforeEach(() => {
		contextElm = createContainerElm();
		contextElm.style.position = 'relative';
		document.body.appendChild(contextElm);

		elm = createDraggableElm();
		elm.style.position = 'absolute';
		contextElm.appendChild(elm);

		mouse = createMouseSimulator();
		mouse.moveToElm(elm);
	});

	afterEach(() => {
		instance.destroy();
		contextElm.remove();
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
			dragWith(elm, {container, clamp: 'element'});
		};

		it('returns the unclamped delta when inside the container', () => {
			dragWithin(contextElm);
			dragBy([20, 30]);
			expect(dragState).toMatchObject({dx: 20, dy: 30});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('reports the unclamped delta as rawDx/rawDy', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			dragBy([1000, -1000]);
			expect(dragState).toMatchObject({dx: 250, dy: -50, rawDx: 1000, rawDy: -1000});
		});

		it('rawDx/rawDy equal dx/dy when inside the container', () => {
			dragWithin(contextElm);
			dragBy([20, 30]);
			expect(dragState).toMatchObject({dx: 20, dy: 30, rawDx: 20, rawDy: 30});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -50, dy: -50});
		});

		it('accepts a selector', () => {
			placeAt(50, 50);
			dragWithin('#test-dom-container');
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('falls back to the context element when the selector matches nothing', () => {
			elm.classList.add('item');
			placeAt(50, 50);
			dragWith(contextElm, {target: '.item', container: '#nothing', clamp: 'element'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('works with translate positioning', () => {
			elm.style.left = '0px';
			elm.style.top = '0px';
			elm.style.translate = '50px 50px';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWithin(contextElm);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('refreshContainerBounds re-reads the container mid-drag', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			mouse.down([1, 1]);
			contextElm.style.width = '600px';
			instance.refreshContainerBounds();
			mouse.move([1000, 1000]);
			mouse.up();
			expect(dragState).toMatchObject({dx: 450, dy: 250});
		});

		it('refreshContainerBounds is a chainable no-op without an active drag', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			contextElm.style.width = '600px';
			expect(instance.refreshContainerBounds()).toBe(instance);
			contextElm.style.width = '400px';
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250});
		});

		it('clamps `dragStart` and `dragging` too', () => {
			placeAt(50, 50);
			dragWithin(contextElm);
			const starts: DragState[] = [];
			const moves: DragState[] = [];
			instance.on('dragStart', (data) => starts.push(data)).on('dragging', (data) => moves.push(data));
			mouse.down([1, 1]).move([1000, 1000]).move([10, 10]);
			mouse.up();
			expect(starts[0]).toMatchObject({dx: 250, dy: 250});
			expect(moves[0]).toMatchObject({dx: 250, dy: 250});
		});

		it('stops at the container padding box, inside its border', () => {
			contextElm.style.border = '10px solid';
			placeAt(50, 50);
			dragWithin(contextElm);
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 230, dy: 230});
			placeAt(50, 50);
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -50, dy: -50});
		});
	});

	describe('without clamp', () => {
		it('does not clamp inside a container', () => {
			placeAt(50, 50);
			dragWith(elm, {container: contextElm});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 1000, dy: 1000, x: 1051, y: 1051});
		});
	});

	describe('default container', () => {
		it('is the context element when a target is set', () => {
			elm.classList.add('item');
			placeAt(50, 50);
			dragWith(contextElm, {target: '.item', clamp: 'element'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 250, dy: 250, x: 301, y: 301});
		});

		it('is the context element without a target', () => {
			placeAt(50, 50);
			dragWith(contextElm, {clamp: 'pointer'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, x: 400, y: 400});
		});
	});

	describe('clamp: pointer', () => {
		it('returns the pointer relative to the container', () => {
			placeAt(50, 50);
			dragWith(contextElm, {container: contextElm, clamp: 'pointer'});
			dragBy([20, 30]);
			expect(dragState).toMatchObject({startX: 51, startY: 51});
			expect(dragState).toMatchObject({x: 71, y: 81});
		});

		it('stops at the far edges', () => {
			placeAt(50, 50);
			dragWith(contextElm, {container: contextElm, clamp: 'pointer'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, x: 400, y: 400});
		});

		it('stops at the near edges', () => {
			placeAt(50, 50);
			dragWith(contextElm, {container: contextElm, clamp: 'pointer'});
			dragBy([-1000, -1000]);
			expect(dragState).toMatchObject({dx: -51, dy: -51, x: 0, y: 0});
		});

		it('keeps the pointer inside a given container', () => {
			placeAt(50, 50);
			dragWith(elm, {clamp: 'pointer', container: contextElm});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, x: 400, y: 400});
		});

		it('falls back to the context element when the selector matches nothing', () => {
			placeAt(50, 50);
			dragWith(contextElm, {clamp: 'pointer', container: '#nothing'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({dx: 349, dy: 349, x: 400, y: 400});
		});
	});

	describe('container points', () => {
		it('follows the clamped delta in element mode', () => {
			placeAt(50, 50);
			dragWith(elm, {container: contextElm, clamp: 'element'});
			dragBy([1000, 1000]);
			expect(dragState).toMatchObject({startX: 51, startY: 51});
			expect(dragState).toMatchObject({x: 301, y: 301});
		});

		it('are relative to the context element without a container', () => {
			placeAt(50, 50);
			dragWith(contextElm);
			dragBy([20, 30]);
			expect(dragState).toMatchObject({startX: 51, startY: 51});
			expect(dragState).toMatchObject({x: 71, y: 81});
		});
	});

	describe('container element', () => {
		it('is the given element', () => {
			dragWith(elm, {container: contextElm});
			dragBy([20, 30]);
			expect(dragState.container).toBe(contextElm);
		});

		it('is the element matched by a selector', () => {
			dragWith(elm, {container: '#test-dom-container'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(contextElm);
		});

		it('is the context element when a target is set', () => {
			elm.classList.add('item');
			dragWith(contextElm, {target: '.item'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(contextElm);
		});

		it('is the context element without a container or a target', () => {
			dragWith(contextElm);
			dragBy([20, 30]);
			expect(dragState.container).toBe(contextElm);
		});

		it('is the context element when the selector matches nothing', () => {
			dragWith(contextElm, {container: '#nothing'});
			dragBy([20, 30]);
			expect(dragState.container).toBe(contextElm);
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
			dragWith(elm, {container: contextElm, clamp: 'element'});
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

		it('resolves a percent start translate against the element size', () => {
			elm.style.translate = '50% 100%';
			mouse.reset();
			mouse.moveToElm(elm);
			dragWith(elm, {translate: true});
			dragBy([20, 30]);
			expect(dragState).toMatchObject({tx: 70, ty: 130});
		});

		it('throws on a mixed calc start translate', () => {
			elm.style.translate = 'calc(50% + 10px) 0px';
			expect(() => readTranslate(elm)).toThrow('unsupported translate value');
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
