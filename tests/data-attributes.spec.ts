import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {Draggables, draggables} from '../src';
import {translate} from './utils';
import {createMouseSimulator} from './mouse-simulator';
import {
	createContainerElm,
	addGrip,
	setAxis,
	addChild,
	addGripChild,
	createDraggableElm,
} from './dom-utils';

describe('Data Attributes', () => {
	let drgInstance: Draggables;
	let drgElm: HTMLElement;
	let testContainerElm: HTMLElement;
	let mouse: ReturnType<typeof createMouseSimulator>;

	beforeAll(() => {
		testContainerElm = createContainerElm();
		document.body.appendChild(testContainerElm);
		mouse = createMouseSimulator();
	});

	beforeEach(() => {
		drgElm = createDraggableElm();
		testContainerElm.appendChild(drgElm);
		drgInstance = draggables();
		mouse.moveToElm(drgElm);
	});

	afterEach(() => {
		drgElm.remove();
		mouse.reset();
		drgInstance.destroy();
	});

	afterAll(() => {
		testContainerElm.remove();
	});

	describe('An element with `data-drag-role="draggable"`', () => {
		it('becomes draggable', () => {
			delete drgElm.dataset.dragRole;

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).toBeFalsy();

			drgElm.dataset.dragRole = 'draggable';

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('also by its children', () => {
			const child = addChild(drgElm);

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});
	});

	describe('An element with `data-drag-role="grip"`', () => {
		it('becomes the closest draggable\'s grip', () => {
			const grip = addGrip(drgElm);

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('its children also function as grips', () => {
			const grip = addGrip(drgElm);
			const gripChild = addGripChild(grip);

			mouse.moveToElm(gripChild);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('prevents dragging the closest draggable not via grip', () => {
			const grip = addGrip(drgElm);
			const child = addChild(drgElm);

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).toBeFalsy();

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).toBeFalsy();

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('throws if not inside a draggable element', () => {
			const orphanGrip = addGrip(testContainerElm);

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
			drgElm.dataset.dragDisabled = 'true';

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).toBeFalsy();

			delete drgElm.dataset.dragDisabled;

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('cannot be dragged via its grip', () => {
			const grip = addGrip(drgElm);
			drgElm.dataset.dragDisabled = 'true';

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).toBeFalsy();
		});

		it('aborts an active drag when disabled mid-drag', () => {
			mouse.down().move([8, 12]);
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			drgElm.dataset.dragDisabled = 'true';

			mouse.move([20, 20]);
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			delete drgElm.dataset.dragDisabled;

			mouse.move([20, 20]);
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			mouse.up();
		});

		it('fires `dragEnd` when aborting a started drag', () => {
			let drops = 0;
			let lastPos: [number, number] | undefined;

			drgInstance.on('dragEnd', (ev) => {
				drops++;
				lastPos = ev.relPos;
			});

			mouse.down().move([8, 12]);
			expect(drops).to.equal(0);

			drgElm.dataset.dragDisabled = 'true';
			mouse.move([20, 20]);

			expect(drops).to.equal(1);
			expect(lastPos).to.deep.equal([8, 12]);

			mouse.up();
			expect(drops).to.equal(1);
		});

		it('doesn\'t fire `dragEnd` when aborting before the threshold broke', () => {
			let drops = 0;
			drgInstance.on('dragEnd', () => drops++);

			mouse.down();
			drgElm.dataset.dragDisabled = 'true';
			mouse.move([1, 1]);

			expect(drops).to.equal(0);

			mouse.up();
		});
	});

	describe('An element with `data-drag-axis="x | y"`', () => {
		it('makes the draggable element only move on that axis', () => {
			setAxis(drgElm, 'x');

			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 0));

			setAxis(drgElm, 'y');

			mouse.down().move([9, 13]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 13));
		});
	});
});
