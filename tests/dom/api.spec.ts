import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect} from 'vitest';
import {drag, type DragInstance} from '../../src';
import {createContainerElm, createDraggableElm} from '../dom-utils';
import {createMouseSimulator} from '../mouse-simulator';

describe('API', () => {
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

	describe('.on', () => {
		it('is chainable', () => {
			expect(instance.on('dragStart', () => null)).toBe(instance);
		});
	});

	describe('.off', () => {
		it('is chainable', () => {
			instance.on('dragStart', () => null);
			expect(instance.off('dragStart')).toBe(instance);
		});
	});

	it('throws on unknown event names', () => {
		// @ts-expect-error testing a bad name
		expect(() => instance.on('nope', () => {})).toThrow();
	});
});
