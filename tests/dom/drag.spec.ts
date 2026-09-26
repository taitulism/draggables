import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src/dom/drag';
import {createContainerElm, createDraggableElm, addChild} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('drag()', () => {
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
	});

	afterEach(() => {
		instance?.destroy();
		elm.remove();
		mouse.reset();
	});

	afterAll(() => {
		container.remove();
	});

	describe('contextElm only', () => {
		beforeEach(() => {
			instance = drag(elm);
		});

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
	});

	describe('options', () => {
		it('`threshold` sets the start distance', () => {
			instance = drag(elm, {threshold: 10});
			const spy = vi.fn();
			instance.on('dragStart', spy);

			mouse.down().move([6, 6]);
			expect(spy).not.toHaveBeenCalled();

			mouse.move([2, 2]);
			expect(spy).toHaveBeenCalledTimes(1);
			mouse.up();
		});

		it('`target` selector drags the closest match inside contextElm', () => {
			const child = addChild(elm);
			child.classList.add('item');
			instance = drag(container, {target: '.item'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.moveToElm(child);
			mouse.down().up();
			expect(spy.mock.calls[0][0].elm).toBe(child);

			mouse.moveToElm(elm);
			mouse.move([80, 80]).down().up();
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('`target` selector ignores matches outside contextElm', () => {
			container.classList.add('item');
			instance = drag(elm, {target: '.item'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
			container.classList.remove('item');
		});

		it('`target` function gets the pointerdown event and returns the element to drag', () => {
			const resolver = vi.fn(() => container);
			instance = drag(elm, {target: resolver});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(resolver.mock.calls[0]).toHaveLength(1);
			expect((resolver.mock.calls[0] as unknown as [PointerEvent])[0].type).toBe('pointerdown');
			expect(spy.mock.calls[0][0].elm).toBe(container);
		});

		it('`target` function returning null skips the drag', () => {
			instance = drag(elm, {target: () => null});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('.off() / .destroy()', () => {
		it('.off() removes the handler', () => {
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('grab', spy).off('grab');

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('.destroy() stops emitting', () => {
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('grab', spy).on('dragEnd', spy);
			instance.destroy();

			mouse.down().move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('.destroy() mid-drag unbinds the window listeners', () => {
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('dragging', spy).on('dragEnd', spy);

			mouse.down().move([5, 5]);
			instance.destroy();
			mouse.move([5, 5]).up();

			expect(spy).not.toHaveBeenCalled();
			expect(document.body.style.userSelect).toBe('');
		});

		it('throws on unknown event names', () => {
			instance = drag(elm);

			// @ts-expect-error testing a bad name
			expect(() => instance.on('nope', () => {})).toThrow();
		});
	});
});
