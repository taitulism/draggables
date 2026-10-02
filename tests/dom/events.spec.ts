import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('Events', () => {
	let elm: HTMLElement;
	let container: HTMLElement;
	let instance: DragInstance;
	let mouse: ReturnType<typeof createMouseSimulator>;

	beforeAll(() => {
		container = createContainerElm();
		document.body.appendChild(container);
		mouse = createMouseSimulator();
	});

	beforeEach(() => {
		elm = createDraggableElm();
		container.appendChild(elm);
		mouse.moveToElm(elm);
		instance = drag(elm);
	});

	afterEach(() => {
		instance.destroy();
		elm.remove();
		mouse.reset();
	});

	afterAll(() => {
		container.remove();
	});

	describe('.on()', () => {
		it('emits `grab` with the element, pointer position and zero deltas', () => {
			const spy = vi.fn();
			instance.on('grab', spy);

			const [x, y] = mouse.currentPosition;
			mouse.down();

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 0, dy: 0, x, y});
			expect(spy.mock.calls[0][0].ev).toBeInstanceOf(Event);
			mouse.up();
		});

		it('emits `dragStart` past the threshold with dx/dy since grab', () => {
			const spy = vi.fn();
			instance.on('dragStart', spy);

			const [x, y] = mouse.currentPosition;
			mouse.down().move([2, 2]);
			expect(spy).not.toHaveBeenCalled();

			mouse.move([3, 1]);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 5, dy: 3, x: x + 5, y: y + 3});
			mouse.up();
		});

		it('emits `dragging` with dx/dy since grab', () => {
			const spy = vi.fn();
			instance.on('dragging', spy);

			const [x, y] = mouse.currentPosition;
			mouse.down().move([5, 5]).move([7, 8]);

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 12, dy: 13, x: x + 12, y: y + 13});
			mouse.up();
		});

		it('emits `dragEnd` with dx/dy from the pointerup position', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			const [x, y] = mouse.currentPosition;
			mouse.down().move([5, 5]).up();

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 5, dy: 5, x: x + 5, y: y + 5});
		});

		it('emits only `grab` on a click', () => {
			const spy = vi.fn();
			instance.on('grab', spy).on('dragStart', spy).on('dragging', spy).on('dragEnd', spy);

			mouse.down().move([1, 1]).up();

			expect(spy).toHaveBeenCalledTimes(1);
		});
	});

	it('passes `ev` and `elm` to every event handler', () => {
		const spy = vi.fn();
		instance.on('grab', spy).on('dragStart', spy).on('dragging', spy).on('dragEnd', spy);

		mouse.down().move([5, 5]).move([7, 8]).up();

		expect(spy).toHaveBeenCalledTimes(4);
		for (const [payload] of spy.mock.calls) {
			expect(payload.elm).toBe(elm);
			expect(payload.ev).toBeInstanceOf(Event);
		}
	});

	describe('.off()', () => {
		it('stops listening to `grab` events', () => {
			const spy = vi.fn();
			instance.on('grab', spy).off('grab');

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('stops listening to `dragStart` events', () => {
			const spy = vi.fn();
			instance.on('dragStart', spy);

			mouse.down().move([5, 5]).up();
			mouse.down().move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);

			instance.off('dragStart');
			mouse.down().move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('stops listening to `dragging` events', () => {
			const spy = vi.fn();
			instance.on('dragging', spy);

			mouse.down().move([5, 5]).move([5, 5]).up();
			mouse.down().move([5, 5]).move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);

			instance.off('dragging');
			mouse.down().move([5, 5]).move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('stops listening to `dragEnd` events', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.down().move([5, 5]).up();
			mouse.down().move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);

			instance.off('dragEnd');
			mouse.down().move([5, 5]).up();
			expect(spy).toHaveBeenCalledTimes(2);
		});
	});
});
