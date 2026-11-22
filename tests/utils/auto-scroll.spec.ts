import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {autoScroll, type AutoScroller} from '../../src';

const nextFrames = async (count: number) => {
	for (let i = 0; i < count; i++) {
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
};

describe('autoScroll', () => {
	let scrollElm: HTMLElement;
	let scroller: AutoScroller;
	let box: DOMRect;

	beforeEach(() => {
		scrollElm = document.createElement('div');
		Object.assign(scrollElm.style, {
			width: '300px',
			height: '300px',
			overflow: 'auto',
		});
		const filler = document.createElement('div');
		Object.assign(filler.style, {width: '3000px', height: '3000px'});
		scrollElm.appendChild(filler);
		document.body.appendChild(scrollElm);

		scrollElm.scrollTop = 1000;
		scrollElm.scrollLeft = 1000;
		box = scrollElm.getBoundingClientRect();
		scroller = autoScroll(scrollElm, {threshold: 40, speed: 10});
	});

	afterEach(() => {
		scroller.stop();
		scrollElm.remove();
	});

	it('scrolls down near the bottom edge', async () => {
		scroller.update(box.left + 150, box.top + 290);
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBeGreaterThan(1000);
		expect(scrollElm.scrollLeft).toBe(1000);
	});

	it('scrolls up near the top edge', async () => {
		scroller.update(box.left + 150, box.top + 10);
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBeLessThan(1000);
	});

	it('scrolls right near the right edge', async () => {
		scroller.update(box.left + 290, box.top + 150);
		await nextFrames(3);
		expect(scrollElm.scrollLeft).toBeGreaterThan(1000);
	});

	it('scrolls left near the left edge', async () => {
		scroller.update(box.left + 10, box.top + 150);
		await nextFrames(3);
		expect(scrollElm.scrollLeft).toBeLessThan(1000);
	});

	it('does not scroll away from the edges', async () => {
		scroller.update(box.left + 150, box.top + 150);
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBe(1000);
		expect(scrollElm.scrollLeft).toBe(1000);
	});

	it('scrolls at full speed past the edge', async () => {
		scroller.update(box.left + 150, box.top + 400);
		await nextFrames(1);
		await nextFrames(1);
		expect(scrollElm.scrollTop).toBeGreaterThanOrEqual(1010);
	});

	it('scrolls faster closer to the edge', async () => {
		scroller.update(box.left + 150, box.top + 270);
		await nextFrames(2);
		const far = scrollElm.scrollTop - 1000;
		scroller.stop();

		scrollElm.scrollTop = 1000;
		scroller.update(box.left + 150, box.top + 299);
		await nextFrames(2);
		const near = scrollElm.scrollTop - 1000;

		expect(near).toBeGreaterThan(far);
	});

	it('keeps scrolling while the pointer stays still', async () => {
		scroller.update(box.left + 150, box.top + 290);
		await nextFrames(2);
		const first = scrollElm.scrollTop;
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBeGreaterThan(first);
	});

	it('stops when the pointer moves away from the edge', async () => {
		scroller.update(box.left + 150, box.top + 290);
		await nextFrames(2);
		scroller.update(box.left + 150, box.top + 150);
		await nextFrames(2);
		const top = scrollElm.scrollTop;
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBe(top);
	});

	it('stop() cancels the loop', async () => {
		scroller.update(box.left + 150, box.top + 290);
		await nextFrames(2);
		scroller.stop();
		const top = scrollElm.scrollTop;
		await nextFrames(3);
		expect(scrollElm.scrollTop).toBe(top);
	});
});
