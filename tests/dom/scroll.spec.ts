import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {createDragger, type DragState, type Dragger} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

function scrollBy (scrollElm: HTMLElement, top: number) {
	return new Promise<void>((resolve) => {
		scrollElm.addEventListener('scroll', () => resolve(), {once: true});
		scrollElm.scrollTop += top;
	});
}

describe('Scrolling', () => {
	let wrapper: HTMLElement;
	let contextElm: HTMLElement;
	let elm: HTMLElement;
	let instance: Dragger;
	let mouse: ReturnType<typeof createMouseSimulator>;
	let moves: DragState[];

	const lastMove = () => moves[moves.length - 1];

	beforeEach(() => {
		wrapper = document.createElement('div');
		wrapper.style.height = '200px';
		wrapper.style.overflow = 'auto';
		document.body.appendChild(wrapper);

		contextElm = createContainerElm();
		contextElm.style.position = 'relative';
		wrapper.appendChild(contextElm);

		elm = createDraggableElm();
		elm.style.position = 'absolute';
		contextElm.appendChild(elm);

		moves = [];
		mouse = createMouseSimulator();
		mouse.moveToElm(elm);
	});

	afterEach(() => {
		instance.destroy();
		wrapper.remove();
		mouse.reset();
	});

	const dragWith = (target: HTMLElement, opts = {}) => {
		instance = createDragger(target, opts).on('dragging', (data) => moves.push(data));
	};

	describe('scroll compensation', () => {
		it('adds an ancestor scroll to the delta', async () => {
			dragWith(elm);
			mouse.down([1, 1]).move([10, 10]).move([0, 0]);
			await scrollBy(wrapper, 50);
			expect(lastMove()).toMatchObject({dx: 10, dy: 60});
			mouse.up();
		});

		it('adds the container own scroll to the delta', async () => {
			wrapper.style.height = '';
			contextElm.style.height = '200px';
			contextElm.style.overflow = 'auto';
			const filler = document.createElement('div');
			filler.style.height = '1000px';
			contextElm.appendChild(filler);
			mouse.reset();
			mouse.moveToElm(elm);

			dragWith(elm, {container: contextElm});
			mouse.down([1, 1]).move([10, 10]).move([0, 0]);
			await scrollBy(contextElm, 50);
			expect(lastMove()).toMatchObject({dx: 10, dy: 60});
			mouse.up();
		});

		it('keeps compensating on following moves', async () => {
			dragWith(elm);
			mouse.down([1, 1]).move([10, 10]).move([0, 0]);
			await scrollBy(wrapper, 50);
			mouse.move([5, 5]);
			expect(lastMove()).toMatchObject({dx: 15, dy: 65});
			mouse.up();
		});

		it('re-emits `dragging` on scroll', async () => {
			dragWith(elm);
			mouse.down([1, 1]).move([10, 10]).move([0, 0]);
			const count = moves.length;
			await scrollBy(wrapper, 50);
			expect(moves.length).toBe(count + 1);
			mouse.up();
		});

		it('stops listening to scroll after the drag', async () => {
			dragWith(elm);
			mouse.down([1, 1]).move([10, 10]);
			mouse.up();
			const count = moves.length;
			await scrollBy(wrapper, 50);
			expect(moves.length).toBe(count);
		});
	});

	describe('.update()', () => {
		it('re-emits `dragging` with the last pointer position', () => {
			dragWith(elm);
			mouse.down([1, 1]).move([10, 20]).move([0, 0]);
			instance.update();
			expect(moves.length).toBe(2);
			expect(moves[1]).toMatchObject({dx: 10, dy: 20});
			mouse.up();
		});

		it('applies refreshed bounds without a pointer move', () => {
			dragWith(elm, {container: contextElm, clamp: 'element'});
			mouse.down([1, 1]).move([1000, 0]).move([0, 0]);
			expect(lastMove()).toMatchObject({dx: 280});
			contextElm.style.width = '600px';
			instance.refreshContainerBounds().update();
			expect(lastMove()).toMatchObject({dx: 480});
			mouse.up();
		});

		it('does not emit before the threshold is crossed', () => {
			dragWith(elm);
			mouse.down([1, 1]);
			instance.update();
			expect(moves.length).toBe(0);
			mouse.up();
		});

		it('is a chainable no-op without an active drag', () => {
			dragWith(elm);
			expect(instance.update()).toBe(instance);
			expect(moves.length).toBe(0);
		});
	});
});
