import {beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi} from 'vitest';
import {type Draggables, draggables} from '../src';
import {createContainerElm, createDraggableElm} from './dom-utils';
import {translate} from './utils';
import {createMouseSimulator} from './mouse-simulator';

describe('Dragging Around', () => {
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

	describe('Basic Dragging', () => {
		it('moves the elm on the X axis', () => {
			mouse.down();
			expect(drgElm.style.translate).toBeFalsy();

			mouse.move([8, 0]);
			expect(drgElm.style.translate).to.equal(translate(8, 0));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(8, 0));

			mouse.down();
			expect(drgElm.style.translate).to.equal(translate(8, 0));

			mouse.move([-8, 0]);
			expect(drgElm.style.translate).to.equal(translate(0, 0));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(0, 0));
		});

		it('moves the elm on the Y axis', () => {
			mouse.down();
			expect(drgElm.style.translate).toBeFalsy();

			mouse.move([0, 12]);
			expect(drgElm.style.translate).to.equal(translate(0, 12));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(0, 12));

			mouse.down();
			expect(drgElm.style.translate).to.equal(translate(0, 12));

			mouse.move([0, -12]);
			expect(drgElm.style.translate).to.equal(translate(0, 0));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(0, 0));
		});

		it('moves the elm freely on both axes', () => {
			mouse.down();
			expect(drgElm.style.translate).toBeFalsy();

			mouse.move([8, 12]);
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			mouse.down();
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			mouse.move([-8, -12]);
			expect(drgElm.style.translate).to.equal(translate(0, 0));

			mouse.up();
			expect(drgElm.style.translate).to.equal(translate(0, 0));
		});

		it('only moves when supposed to', () => {
			mouse.move([10, 10]);
			expect(drgElm.style.translate).toBeFalsy();
			mouse.down();
			expect(drgElm.style.translate).toBeFalsy();
			mouse.move([10, 10]);
			expect(drgElm.style.translate).to.equal(translate(10, 10));
			mouse.up();

			mouse.move([11, 11]);
			expect(drgElm.style.translate).to.equal(translate(10, 10));
		});
	});

	describe('Threshold', () => {
		it('doesn\'t start dragging until mouse move breaks threshold (3)', () => {
			const spy = vi.fn();

			drgInstance.on('dragStart', spy);
			drgInstance.on('dragging', spy);

			mouse.down();

			mouse.move([1, 0]);
			expect(drgElm.style.translate).toBeFalsy();
			mouse.move([0, 1]);
			expect(drgElm.style.translate).toBeFalsy();
			mouse.move([1, 0]);
			expect(drgElm.style.translate).toBeFalsy();

			expect(spy).not.toHaveBeenCalled();
			mouse.move([1, 0]);
			expect(drgElm.style.translate).to.equal(translate(3, 1));
			expect(spy).toHaveBeenCalledOnce();

			mouse.move([1, 0]);
			expect(drgElm.style.translate).to.equal(translate(4, 1));
			expect(spy).toHaveBeenCalledTimes(2);

			mouse.up();
		});
	});

	describe('Sequential Dragging', () => {
		it('different grabbing points', () => {
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			mouse.move([30, 30]);

			mouse.down().move([-13, -18]).up();
			expect(drgElm.style.translate).to.equal(translate(-5, -6));

			mouse.move([-15, -15]);

			mouse.down().move([45, 16]).up();
			expect(drgElm.style.translate).to.equal(translate(40, 10));

			mouse.move([-10, -10]);

			mouse.down().move([10, 40]).up();
			expect(drgElm.style.translate).to.equal(translate(50, 50));
		});

		it('continous dragging', () => {
			mouse.down();

			mouse.move([10, 10]);
			expect(drgElm.style.translate).to.equal(translate(10, 10));

			mouse.move([10, -10]);
			expect(drgElm.style.translate).to.equal(translate(20, 0));

			mouse.move([20, 20]);
			expect(drgElm.style.translate).to.equal(translate(40, 20));

			mouse.move([-20, 20]);
			expect(drgElm.style.translate).to.equal(translate(20, 40));

			mouse.move([-20, -40]);
			expect(drgElm.style.translate).to.equal(translate(0, 0));

			mouse.up();
		});
	});

	describe('Boundery Element', () => {
		it('is <body> by default', () => {
			const bodyBox = document.body.getBoundingClientRect();
			const {width, height} = bodyBox;
			const box = drgElm.getBoundingClientRect();

			mouse.down();

			mouse.move([-50, -50]);
			expect(drgElm.style.translate).to.equal(translate(-20, -20));

			mouse.move([30 + (width / 2), 30 + (height / 2)]);
			const box1 = drgElm.getBoundingClientRect();
			const movedX1 = box1.x - box.x;
			const movedY1 = box1.y - box.y;
			expect(box1.x).to.equal((width / 2));
			expect(box1.y).to.equal((height / 2));
			expect(drgElm.style.translate).to.equal(translate(movedX1, movedY1));

			mouse.move([(width / 2) + 50, (height / 2) + 50]);
			const box2 = drgElm.getBoundingClientRect();
			const movedX2 = box2.x - box.x;
			const movedY2 = box2.y - box.y;
			expect(box2.x).to.equal(width - 100);
			expect(box2.y).to.equal(height - 100);
			expect(drgElm.style.translate).to.equal(translate(movedX2, movedY2));

			mouse.up();
		});

		it('can be set to another element', () => {
			testContainerElm.dataset.dragZone = ''; // Key Only

			mouse.down().move([-50, -50]).up();
			expect(drgElm.style.translate).to.equal(translate(-20, -20)); // container padding is 20

			mouse.moveToElm(drgElm).down(); // [0,0]

			mouse.move([200, 200]); // half container
			const box1 = drgElm.getBoundingClientRect();
			expect(box1.x).to.equal(200);
			expect(box1.y).to.equal(200);
			expect(drgElm.style.translate).to.equal(translate(200 - 20, 200 - 20));

			mouse.move([350, 350]); // second half + draggable size + 50
			const box2 = drgElm.getBoundingClientRect();
			expect(box2.x).to.equal(400 - 100); // drgElm is 100x100
			expect(box2.y).to.equal(400 - 100);
			expect(drgElm.style.translate).to.equal(translate(300 - 20, 300 - 20));

			mouse.up();
			delete testContainerElm.dataset.dragZone;
		});

		it('"circle" around inside container', () => {
			testContainerElm.dataset.dragZone = ''; // Key Only
			mouse.down();

			// move outside (top-left)
			mouse.move([-50, -50]);
			const box1 = drgElm.getBoundingClientRect();
			expect(box1.x).to.equal(0);
			expect(box1.y).to.equal(0);
			expect(drgElm.style.translate).to.equal(translate(-20, -20));

			// move right
			mouse.move([460, 0]); // 30 + 400 + 30 --> back + container + extra
			const box2 = drgElm.getBoundingClientRect();
			expect(box2.x).to.equal(300);
			expect(box2.y).to.equal(0);
			expect(drgElm.style.translate).to.equal(translate(280, -20));

			// move down
			mouse.move([0, 460]); // = 30 + 400 + 30 --> back + full container + extra
			const box3 = drgElm.getBoundingClientRect();
			expect(box3.x).to.equal(300);
			expect(box3.y).to.equal(300);
			expect(drgElm.style.translate).to.equal(translate(280, 280));

			// move left
			mouse.move([-460, 0]); // = 200 + 30 --> half container + out
			const box4 = drgElm.getBoundingClientRect();
			expect(box4.x).to.equal(0);
			expect(box4.y).to.equal(300);
			expect(drgElm.style.translate).to.equal(translate(-20, 280));

			// move up
			mouse.move([0, -460]); // = 200 + 30 --> half container + out
			const box5 = drgElm.getBoundingClientRect();
			expect(box5.x).to.equal(0);
			expect(box5.y).to.equal(0);
			expect(drgElm.style.translate).to.equal(translate(-20, -20));

			mouse.up();
			delete testContainerElm.dataset.dragZone;
		});
	});

	describe('Other Cases', () => {
		it('doesn\'t reset position on click', () => {
			// drag
			mouse.down().move([50, 50]).up();
			expect(drgElm.style.translate).to.equal(translate(50, 50));

			// click
			mouse.down().up();
			expect(drgElm.style.translate).to.equal(translate(50, 50));

			// drag
			mouse.down().move([11, 11]);
			expect(drgElm.style.translate).to.equal(translate(61, 61));

			mouse.up();
		});
	});
});
