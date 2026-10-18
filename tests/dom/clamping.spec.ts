import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {drag, type DragData, type DragInstance} from '../../src';
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
		elm.style.left = '50px';
		elm.style.top = '50px';
		container.appendChild(elm);

		mouse = createMouseSimulator();
		mouse.moveToElm(elm);
	});

	afterEach(() => {
		instance.destroy();
		container.remove();
		mouse.reset();
	});

	const dragBy = (move: [number, number]) => {
		mouse.down([1, 1]).move(move);
		mouse.up();
	};

	describe('clampTo', () => {
		beforeEach(() => {
			instance = drag(elm).on('dragEnd', (data) => dragData = data);
		});

		it('returns the unclamped position when inside the container', () => {
			dragBy([20, 30]);
			expect(dragData.clampTo(container)).toEqual({left: 70, top: 80});
		});

		it('stops at the far edges', () => {
			dragBy([1000, 1000]);
			expect(dragData.clampTo(container)).toEqual({left: 300, top: 300});
		});

		it('stops at the near edges', () => {
			dragBy([-1000, -1000]);
			expect(dragData.clampTo(container)).toEqual({left: 0, top: 0});
		});

		it('accepts a selector', () => {
			dragBy([1000, 1000]);
			expect(dragData.clampTo('#test-dom-container')).toEqual({left: 300, top: 300});
		});

		it('returns the unclamped position when the selector matches nothing', () => {
			dragBy([1000, 1000]);
			expect(dragData.clampTo('#nothing')).toEqual({left: 1050, top: 1050});
		});
	});

	describe('clampPointTo', () => {
		beforeEach(() => {
			instance = drag(container).on('dragEnd', (data) => dragData = data);
		});

		it('returns the pointer relative to the container', () => {
			dragBy([20, 30]);
			expect(dragData.clampPointTo(container)).toEqual({x: 71, y: 81});
		});

		it('stops at the far edges', () => {
			dragBy([1000, 1000]);
			expect(dragData.clampPointTo(container)).toEqual({x: 400, y: 400});
		});

		it('stops at the near edges', () => {
			dragBy([-1000, -1000]);
			expect(dragData.clampPointTo(container)).toEqual({x: 0, y: 0});
		});

		it('accepts a selector matching the dragged element itself', () => {
			dragBy([1000, 1000]);
			expect(dragData.clampPointTo('#test-dom-container')).toEqual({x: 400, y: 400});
		});

		it('returns the raw pointer when the selector matches nothing', () => {
			dragBy([20, 30]);
			const {x, y} = container.getBoundingClientRect();
			expect(dragData.clampPointTo('#nothing')).toEqual({x: x + 71, y: y + 81});
		});
	});
});
