import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {createDragger, type Dragger} from '../../src';
import {createContainerElm, createDraggableElm, addChild, addGrip, addGripChild} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('createDragger() construct / destroy', () => {
	let elm: HTMLElement;
	let container: HTMLElement;
	let instance: Dragger;
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
		it('triggers both', () => {
			instance = createDragger(elm);
			const outer = createDragger(container);
			const outerSpy = vi.fn();
			const innerSpy = vi.fn();
			outer.on('grab', outerSpy);
			instance.on('grab', innerSpy);

			mouse.down().up();
			outer.destroy();

			expect(outerSpy).toHaveBeenCalledOnce();
			expect(innerSpy).toHaveBeenCalledOnce();
		});

		it('only triggers the inner one when it stops propagation on grab', () => {
			instance = createDragger(elm);
			const outer = createDragger(container);
			const outerSpy = vi.fn();
			outer.on('grab', outerSpy);
			instance.on('grab', ({ev}) => ev.stopPropagation());

			mouse.down().up();
			outer.destroy();

			expect(outerSpy).not.toHaveBeenCalled();
		});
	});

	describe('Option: `target`', () => {
		it('defaults to the contextElm, also when grabbed by a child', () => {
			const child = addChild(elm);
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, grip: elm, dx: 8, dy: 12});
		});

		it('`target` selector drags the closest match inside contextElm', () => {
			const child = addChild(elm);
			child.classList.add('item');
			instance = createDragger(container, {target: '.item'});
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
			instance = createDragger(elm, {target: '.item'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
			container.classList.remove('item');
		});

		it('`target` function gets the pointerdown event and returns the element to drag', () => {
			const resolver = vi.fn(() => container);
			instance = createDragger(elm, {target: resolver});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(resolver.mock.calls[0]).toHaveLength(1);
			expect((resolver.mock.calls[0] as unknown as [PointerEvent])[0].type).toBe('pointerdown');
			expect(spy.mock.calls[0][0].elm).toBe(container);
		});

		it('`target` function returning null skips the drag', () => {
			instance = createDragger(elm, {target: () => null});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('Option: `grip`', () => {
		it('drags the contextElm only via a grip, by default', () => {
			const grip = addGrip(elm);
			const child = addChild(elm);
			instance = createDragger(elm, {grip: '.grip'});
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, grip: grip, dx: 8, dy: 12});
		});

		it('grip children act as the grip', () => {
			const grip = addGrip(elm);
			const gripChild = addGripChild(grip);
			instance = createDragger(elm, {grip: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.moveToElm(gripChild);
			mouse.down().up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, grip: grip});
		});

		it('with a `target` selector, drags the target closest to the grip', () => {
			elm.classList.add('item');
			const grip = addGrip(elm);
			instance = createDragger(container, {target: '.item', grip: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.moveToElm(grip);
			mouse.down().up();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, grip: grip});

			elm.classList.remove('item');
			mouse.down().up();
			expect(spy).toHaveBeenCalledOnce();
		});

		it('ignores grips outside contextElm', () => {
			container.classList.add('grip');
			instance = createDragger(elm, {grip: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy).not.toHaveBeenCalled();
			container.classList.remove('grip');
		});

		it('is ignored by a `target` function', () => {
			instance = createDragger(elm, {target: () => elm, grip: '.grip'});
			const spy = vi.fn();
			instance.on('grab', spy);

			mouse.down().up();

			expect(spy.mock.calls[0][0]).toMatchObject({elm, grip: elm});
		});
	});

	describe('Option: `button`', () => {
		const pointerdown = (button: number) =>
			elm.dispatchEvent(Object.assign(new Event('pointerdown', {bubbles: true}), {button}));

		it('only the given button grabs', () => {
			instance = createDragger(elm, {button: 2});
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
			instance = createDragger(elm, {target: resolver});

			pointerdown(2);

			expect(resolver).not.toHaveBeenCalled();
		});
	});

	describe('.destroy()', () => {
		it('stops emitting', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('grab', spy).on('dragEnd', spy);
			instance.destroy();

			mouse.down().move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('mid-drag unbinds the window listeners', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragging', spy).on('dragEnd', spy);

			mouse.down().move([5, 5]);
			instance.destroy();
			mouse.move([5, 5]).up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('mid-drag emits dragCancel', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]);
			instance.destroy();
			mouse.up();

			expect(spy).toHaveBeenCalledOnce();
		});
	});

	describe('Option: `cancelOnEsc`', () => {
		const esc = () => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));

		it('cancels on Esc by default', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]);
			esc();

			expect(spy).toHaveBeenCalledOnce();
		});

		it('Esc after drop does not emit dragCancel', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]).up();
			esc();

			expect(spy).not.toHaveBeenCalled();
		});

		it('`false` ignores Esc', () => {
			instance = createDragger(elm, {cancelOnEsc: false});
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]);
			esc();
			mouse.up();

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('pointercancel', () => {
		const cancel = () => window.dispatchEvent(new Event('pointercancel'));

		it('emits dragCancel', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]);
			cancel();

			expect(spy).toHaveBeenCalledOnce();
		});

		it('stops the drag', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragging', spy);

			mouse.down().move([5, 5]);
			cancel();
			spy.mockClear();
			mouse.move([10, 10]).up();

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('.cancelDrag()', () => {
		it('mid-drag stops emitting', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragging', spy).on('dragEnd', spy);

			mouse.down().move([5, 5]);
			instance.cancelDrag();
			mouse.move([5, 5]).up();

			expect(spy).not.toHaveBeenCalled();
		});

		it('is chainable', () => {
			instance = createDragger(elm);
			mouse.down().move([5, 5]);
			expect(instance.cancelDrag()).toBe(instance);
			mouse.up();
			expect(instance.cancelDrag()).toBe(instance);
		});

		it('allows the next drag', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			mouse.down().move([5, 5]);
			instance.cancelDrag();
			mouse.up();
			mouse.down().move([5, 5]).up();

			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('emits dragCancel with elm and grip', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down().move([5, 5]);
			instance.cancelDrag();

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toEqual({
				elm,
				grip: elm,
				startLeft: elm.offsetLeft,
				startTop: elm.offsetTop,
			});
		});

		it('does not emit dragCancel before dragStart', () => {
			instance = createDragger(elm);
			const spy = vi.fn();
			instance.on('dragCancel', spy);

			mouse.down();
			instance.cancelDrag();

			expect(spy).not.toHaveBeenCalled();
		});

		it('is a no-op without an active drag', () => {
			instance = createDragger(elm);
			expect(() => instance.cancelDrag()).not.toThrow();
		});
	});
});
