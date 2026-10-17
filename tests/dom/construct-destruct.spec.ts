import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm, addChild, addGrip, addGripChild} from '../dom-utils';
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
		it('defaults to the contextElm, also when grabbed by a child', () => {
			const child = addChild(elm);
			instance = drag(elm);
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, handle: elm, dx: 8, dy: 12});
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

	describe('Option: `handle`', () => {
		it('drags the contextElm only via a handle, by default', () => {
			const grip = addGrip(elm);
			const child = addChild(elm);
			instance = drag(elm, {handle: '.grip'});
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, handle: grip, dx: 8, dy: 12});
		});

		it('handle children act as the handle', () => {
			const grip = addGrip(elm);
			const gripChild = addGripChild(grip);
			instance = drag(elm, {handle: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.moveToElm(gripChild);
			mouse.down().up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, handle: grip});
		});

		it('with a `target` selector, drags the target closest to the handle', () => {
			elm.classList.add('item');
			const grip = addGrip(elm);
			instance = drag(container, {target: '.item', handle: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.moveToElm(grip);
			mouse.down().up();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, handle: grip});

			elm.classList.remove('item');
			mouse.down().up();
			expect(spy).toHaveBeenCalledOnce();
		});

		it('ignores handles outside contextElm', () => {
			container.classList.add('grip');
			instance = drag(elm, {handle: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
			container.classList.remove('grip');
		});

		it('is ignored by a `target` function', () => {
			instance = drag(elm, {target: () => elm, handle: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, handle: elm});
		});
	});

	describe('Option: `button`', () => {
		const pointerdown = (button: number) =>
			elm.dispatchEvent(Object.assign(new Event('pointerdown', {bubbles: true}), {button}));

		it('only the given button grabs', () => {
			instance = drag(elm, {button: 2});
			const spy = vi.fn();
			instance.on('grab', spy);

			pointerdown(0);
			expect(spy).not.toHaveBeenCalled();

			pointerdown(2);
			expect(spy).toHaveBeenCalledOnce();
			window.dispatchEvent(new Event('pointerup'));
		});

		it('applies to a `target` function too', () => {
			const resolver = vi.fn(() => elm);
			instance = drag(elm, {target: resolver});

			pointerdown(2);

			expect(resolver).not.toHaveBeenCalled();
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
