import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm, addChild, addGrip, addGripChild} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('Data Attributes', () => {
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
		instance = drag(container);
		mouse.moveToElm(elm);
	});

	afterEach(() => {
		instance.destroy();
		elm.remove();
		mouse.reset();
	});

	afterAll(() => {
		container.remove();
	});

	describe('An element with `data-drag-role="draggable"`', () => {
		it('becomes draggable', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);

			delete elm.dataset.dragRole;
			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			elm.dataset.dragRole = 'draggable';
			mouse.down().move([8, 12]).up();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});

		it('also by its children', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			const child = addChild(elm);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});
	});

	describe('An element with `data-drag-role="grip"`', () => {
		it('becomes the closest draggable\'s grip', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			const grip = addGrip(elm);

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});

		it('its children also function as grips', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			const grip = addGrip(elm);
			const gripChild = addGripChild(grip);

			mouse.moveToElm(gripChild);
			mouse.down().move([8, 12]).up();
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});

		it('prevents dragging the closest draggable not via grip', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			const grip = addGrip(elm);
			const child = addChild(elm);

			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});

		it('throws if not inside a draggable element', () => {
			const orphanGrip = addGrip(container);

			let errMsg = '';
			const onError = (ev: ErrorEvent) => {
				errMsg = ev.message;
				ev.stopImmediatePropagation();
				ev.preventDefault();
			};

			window.addEventListener('error', onError, true);
			const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			mouse.moveToElm(orphanGrip);
			mouse.down();

			errSpy.mockRestore();
			window.removeEventListener('error', onError, true);

			expect(errMsg).to.include('must be inside a draggable');

			mouse.up();
			orphanGrip.remove();
		});
	});

	describe('An element with `data-drag-disabled="true"`', () => {
		it('cannot be dragged', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			elm.dataset.dragDisabled = 'true';

			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();

			delete elm.dataset.dragDisabled;

			mouse.down().move([8, 12]).up();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0][0]).toMatchObject({elm, dx: 8, dy: 12});
		});

		it('cannot be dragged via its grip', () => {
			const spy = vi.fn();
			instance.on('dragEnd', spy);
			const grip = addGrip(elm);
			elm.dataset.dragDisabled = 'true';

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(spy).not.toHaveBeenCalled();
		});
	});
});
