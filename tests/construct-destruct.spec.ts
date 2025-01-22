import {describe, it, expect, beforeAll, beforeEach, afterEach, afterAll} from 'vitest';
import {type Draggables, draggables} from '../src';
import {createContainerElm, createDraggableElm} from './dom-utils';
import {translate} from './utils';
import {createMouseSimulator} from './mouse-simulator';

describe('draggables', () => {
	let drgElm: HTMLElement;
	let drgElm2: HTMLElement;
	let testContainerElm: HTMLElement;
	let mouse: ReturnType<typeof createMouseSimulator>;

	beforeAll(() => {
		testContainerElm = createContainerElm();
		document.body.appendChild(testContainerElm);
		mouse = createMouseSimulator();
	});

	beforeEach(() => {
		drgElm = createDraggableElm();
		drgElm2 = createDraggableElm();
		testContainerElm.appendChild(drgElm);
		document.body.appendChild(drgElm2);
		mouse.moveToElm(drgElm);
	});

	afterEach(() => {
		drgElm.remove();
		drgElm2.remove();
		mouse.reset();
	});

	afterAll(() => {
		testContainerElm.remove();
	});

	describe('Creation', () => {
		it('is a function', () => expect(draggables).to.be.a('function'));

		it('returns a `Draggables` instance', () => {
			const drgInstance = draggables();
			const ctor = Object.getPrototypeOf(drgInstance).constructor;

			expect(ctor.name).to.equal('Draggables');
			drgInstance.destroy();
		});

		describe('with no arguments', () => {
			it('enables all draggables under <body>', () => {
				const drgInstance = draggables();

				mouse.down().move([8, 12]).up();
				expect(drgElm.style.translate).to.equal(translate(8, 12));

				mouse.moveToElm(drgElm2);

				mouse.down().move([9, 13]).up();
				expect(drgElm2.style.translate).to.equal(translate(9, 13));

				drgInstance.destroy();
			});
		});

		describe('with an HTML element', () => {
			it('enables all draggables under given element', () => {
				const drgInstance = draggables(testContainerElm);

				mouse.down().move([8, 12]).up();
				expect(drgElm.style.translate).to.equal(translate(8, 12));

				mouse.moveToElm(drgElm2);

				mouse.down().move([8, 12]).up();
				expect(drgElm2.style.translate).to.be.empty;

				drgInstance.destroy();
			});
		});

		describe('When one context element contains another', () => {
			it('only triggers the inner one', () => {
				const drgInstance1 = draggables();
				const drgInstance2 = draggables(testContainerElm);

				let count1 = 0;
				let count2 = 0;

				drgInstance1.on('grab', () => {
					count1++;
				});
				drgInstance2.on('grab', () => {
					count2++;
				});

				mouse.down().up();

				drgInstance1.destroy();
				drgInstance2.destroy();

				expect(count1).to.equal(0);
				expect(count2).to.equal(1);
			});
		});

		describe('Option: `padding` blocks dragging when grabbed within padding', () => {
			it('top side', () => {
				const drgInstance = draggables({padding: 8});

				mouse.down([50, 4]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([50, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([50, 9]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));

				drgInstance.destroy();
			});

			it('left side', () => {
				const drgInstance = draggables({padding: 8});

				mouse.down([4, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([8, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([9, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));

				drgInstance.destroy();
			});

			it('right side', () => {
				const drgInstance = draggables({padding: 8});

				mouse.down([4, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([8, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([9, 50]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));

				drgInstance.destroy();
			});

			it('bottom side', () => {
				const drgInstance = draggables({padding: 8});

				mouse.down([50, 4]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([50, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([50, 9]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));

				drgInstance.destroy();
			});
		});

		describe('Option: `cornerPadding` blocks dragging when grabbed by a corner', () => {
			it('top-left corner', () => {
				const drgInstance = draggables({cornerPadding: 8});

				mouse.down([4, 4]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([8, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([9, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));
				mouse.moveToElm(drgElm);

				mouse.down([8, 9]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(22, 22));
				drgInstance.destroy();
			});

			it('top-right corner', () => {
				const drgInstance = draggables({cornerPadding: 8});

				mouse.down([96, 4]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([92, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([91, 8]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));
				mouse.moveToElm(drgElm);

				mouse.down([92, 9]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(22, 22));

				drgInstance.destroy();
			});

			it('bottom-left corner', () => {
				const drgInstance = draggables({cornerPadding: 8});

				mouse.down([4, 96]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([8, 92]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([8, 91]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));
				mouse.moveToElm(drgElm);

				mouse.down([9, 92]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(22, 22));

				drgInstance.destroy();
			});

			it('bottom-right corner', () => {
				const drgInstance = draggables({cornerPadding: 8});

				mouse.down([96, 96]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([92, 92]).move([11, 11]).up();
				expect(drgElm.style.translate).to.be.empty;
				mouse.moveToElm(drgElm);

				mouse.down([91, 92]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(11, 11));
				mouse.moveToElm(drgElm);

				mouse.down([92, 91]).move([11, 11]).up();
				expect(drgElm.style.translate).to.equal(translate(22, 22));

				drgInstance.destroy();
			});
		});
	});

	describe('.destroy()', () => {
		let drgInstance: Draggables;

		beforeEach(() => {
			drgInstance = draggables();
		});

		afterEach(() => {
			drgInstance.destroy();
		});

		it('disables dragging', () => {
			mouse.down().move([8, 12]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));

			drgInstance.destroy();

			mouse.down().move([9, 13]).up();
			expect(drgElm.style.translate).to.equal(translate(8, 12));
		});

		it('removes all listeners', () => {
			let grabs = 0;
			let starts = 0;
			let moves = 0;
			let drops = 0;

			drgInstance.on('grab', () => grabs++)
				.on('dragStart', () => starts++)
				.on('dragging', () => moves++)
				.on('dragEnd', () => drops++);

			expect(grabs).to.equal(0);
			mouse.down();
			expect(grabs).to.equal(1);

			expect(starts).to.equal(0);
			mouse.move([5, 5]);
			expect(starts).to.equal(1);

			expect(moves).to.equal(0);
			mouse.move([5, 5]);
			expect(moves).to.equal(1);

			mouse.move([5, 5]);
			mouse.move([5, 5]);
			mouse.move([5, 5]);
			expect(starts).to.equal(1);
			expect(moves).to.equal(4);

			expect(drops).to.equal(0);
			mouse.up();
			expect(drops).to.equal(1);

			expect(moves).to.equal(4);
			mouse.move([5, 5]);
			expect(moves).to.equal(4);

			drgInstance.destroy();

			mouse.down().move([5, 5]).up();
			expect(grabs).to.equal(1);
			expect(starts).to.equal(1);
			expect(moves).to.equal(4);
			expect(drops).to.equal(1);
		});
	});
});
