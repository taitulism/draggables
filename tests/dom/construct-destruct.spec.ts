import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm, addChild} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('drag() construct / destroy', () => {
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

	describe('When one context element contains another', () => {
		it('only triggers the inner one', () => {
			instance = drag(elm);
			const outer = drag(container);
			const outerSpy = vi.fn();
			const innerSpy = vi.fn();
			outer.on('grab', outerSpy);
			instance.on('grab', innerSpy);

			mouse.down().up();
			outer.destroy();

			expect(outerSpy).not.toHaveBeenCalled();
			expect(innerSpy).toHaveBeenCalledOnce();
		});
	});

	describe('Option: `target`', () => {
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

	describe('.destroy()', () => {
		it('stops emitting', () => {
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('grab', spy).on('dragEnd', spy);
			instance.destroy();

			mouse.down().move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('mid-drag unbinds the window listeners', () => {
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('dragging', spy).on('dragEnd', spy);

			mouse.down().move([5, 5]);
			instance.destroy();
			mouse.move([5, 5]).up();

			expect(spy).not.toHaveBeenCalled();
			expect(document.body.style.userSelect).toBe('');
		});
	});
});
