import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect} from 'vitest';
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
			expect(drgElm.style.translate).to.be.empty;

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
			expect(drgElm.style.translate).to.be.empty;

			mouse.moveToElm(child);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.be.empty;

			mouse.moveToElm(grip);
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it.skip('throws if not inside a draggable element', () => {
			const originalWindowOnError = window.onerror;

			const promise = new Promise((resolve, reject) => {
				const drgInstance = draggables();

				// makeDraggable(drgElm);
				const grip = addGrip(drgElm);

				let errMsg: unknown;

				window.onerror = (message) => {
					errMsg = message;
					try {
						expect(errMsg).to.include('must be inside a draggable');
						mouse.up();
						drgInstance.destroy();
						window.onerror = originalWindowOnError;
						resolve(true);
					}
					catch (err) {
						reject(err);
					}
				};

				mouse.moveToElm(grip);
				mouse.down().move([8, 12]);
				expect(true).to.be.false;
			});

			return promise;
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
