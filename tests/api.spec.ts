import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect} from 'vitest';
import {type Draggables, draggables} from '../src';
import {createContainerElm, createDraggableElm} from './dom-utils';
import {createMouseSimulator} from './mouse-simulator';
import {translate} from './utils';

describe('API', () => {
	let drgElm: HTMLElement;
	let drgInstance: Draggables;
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
		drgInstance.destroy();
		drgElm.remove();
		mouse.reset();
	});

	afterAll(() => {
		testContainerElm.remove();
	});

	describe('.enable() / .disable()', () => {
		it('toggles instance.isEnabled', () => {
			expect(drgInstance.isEnabled).toBe(true);

			drgInstance.disable();
			expect(drgInstance.isEnabled).toBe(false);

			drgInstance.enable();
			expect(drgInstance.isEnabled).toBe(true);
		});

		it('toggles draggability', () => {
			expect(drgElm.style.translate).toBeFalsy();
			mouse.down().move([10, 0]).up();
			expect(drgElm.style.translate).to.equal(translate(10, 0));

			mouse.down().move([12, 0]).up();
			expect(drgElm.style.translate).to.equal(translate(22, 0));

			drgInstance.disable();

			mouse.down().move([13, 0]).up();
			expect(drgElm.style.translate).to.equal(translate(22, 0));

			drgInstance.enable();

			mouse.down().move([13, 0]).up();
			expect(drgElm.style.translate).to.equal(translate(35, 0));
		});

		it('toggles draggability while dragging', () => {
			expect(drgElm.style.translate).toBeFalsy();
			mouse.down().move([10, 0]);
			expect(drgElm.style.translate).to.equal(translate(10, 0));

			drgInstance.disable();

			mouse.move([12, 0]);
			expect(drgElm.style.translate).to.equal(translate(10, 0));
			mouse.up();
		});
	});

	describe('.on', () => {
		it('is chainable', () => {
			expect(drgInstance.on('dragStart', () => null)).to.deep.equal(drgInstance);
			drgInstance.off('dragStart');
		});
	});

	describe('.off', () => {
		it('is chainable', () => {
			drgInstance.on('dragStart', () => null);
			expect(drgInstance.off('dragStart')).to.deep.equal(drgInstance);
		});
	});
});
