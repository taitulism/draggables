import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('Dragging Around', () => {
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

	it('emits nothing on move before pointerdown or after pointerup', () => {
		const spy = vi.fn();
		instance.on('grab', spy).on('dragStart', spy).on('dragging', spy).on('dragEnd', spy);

		mouse.move([10, 10]);
		expect(spy).not.toHaveBeenCalled();

		mouse.down().move([10, 10]).move([10, 10]).up();
		spy.mockClear();

		mouse.move([11, 11]);
		expect(spy).not.toHaveBeenCalled();
	});

	describe('Threshold', () => {
		it('emits no `dragging` below the threshold, one per move after it breaks', () => {
			const spy = vi.fn();
			instance.on('dragStart', spy).on('dragging', spy);

			mouse.down();
			mouse.move([1, 0]).move([0, 1]).move([1, 0]);
			expect(spy).not.toHaveBeenCalled();

			mouse.move([1, 0]);
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0]).toMatchObject({dx: 3, dy: 1});

			mouse.move([1, 0]);
			expect(spy).toHaveBeenCalledTimes(2);
			expect(spy.mock.calls[1][0]).toMatchObject({dx: 4, dy: 1});

			mouse.up();
		});

		it('`threshold` sets the start distance', () => {
			instance.destroy();
			instance = drag(elm, {threshold: 10});
			const spy = vi.fn();
			instance.on('dragStart', spy);

			mouse.down().move([6, 6]);
			expect(spy).not.toHaveBeenCalled();

			mouse.move([2, 2]);
			expect(spy).toHaveBeenCalledTimes(1);
			mouse.up();
		});
	});

	describe('Other Cases', () => {
		it('leaves the element in place', () => {
			mouse.down().move([20, 20]).up();

			expect(elm.style.translate).toBe('');
		});

		it('starts every drag at dx 0', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.down().move([10, 0]).up();
			mouse.down().move([10, 0]).up();

			expect(spy.mock.calls[1][0]).toMatchObject({dx: 10, dy: 0});
		});

		it('ignores non-primary buttons', () => {
			const spy = vi.fn();
			instance.on('grab', spy);

			elm.dispatchEvent(Object.assign(new Event('pointerdown', {bubbles: true}), {button: 2}));

			expect(spy).not.toHaveBeenCalled();
		});

		it('blocks text selection while dragging', () => {
			mouse.down();
			expect(document.body.style.userSelect).toBe('none');

			mouse.move([5, 5]).up();
			expect(document.body.style.userSelect).toBe('');
		});

		it('`dragging` dx/dy track the pointer across moves, back to 0 at the origin', () => {
			const spy = vi.fn();
			instance.on('dragging', spy);

			mouse.down();
			mouse.move([10, 10]);
			mouse.move([10, -10]);
			expect(spy.mock.lastCall?.[0]).toMatchObject({dx: 20, dy: 0});

			mouse.move([20, 20]);
			expect(spy.mock.lastCall?.[0]).toMatchObject({dx: 40, dy: 20});

			mouse.move([-20, 20]);
			expect(spy.mock.lastCall?.[0]).toMatchObject({dx: 20, dy: 40});

			mouse.move([-20, -40]);
			expect(spy.mock.lastCall?.[0]).toMatchObject({dx: 0, dy: 0});

			mouse.up();
		});

		it('reports `0` in `dragEnd` when released at the origin', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.down().move([29, 17]).move([-29, -17]).up();

			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0]).toMatchObject({dx: 0, dy: 0});
		});

		it('clears `user-select` on drop even when threshold never broke', () => {
			mouse.down();
			expect(document.body.style.userSelect).toBe('none');

			mouse.up();
			expect(document.body.style.userSelect).toBe('');
		});
	});
});
