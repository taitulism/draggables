import {describe, it, expect, beforeEach} from 'vitest';
import {Drag} from '../../src/core/Drag';

describe('Drag', () => {
	let core: Drag;

	beforeEach(() => {
		core = new Drag();
	});

	describe('threshold', () => {
		it('returns null while within the default 3px threshold', () => {
			core.start(100, 100);

			expect(core.move(101, 101)).toBe(null);
			expect(core.move(102, 102)).toBe(null);
			expect(core.move(103, 100)).toBe(null);
		});

		it('returns `isStart: true` once the threshold is passed', () => {
			core.start(100, 100);

			expect(core.move(103, 103)).toEqual({isStart: true, dx: 3, dy: 3, x: 103, y: 103});
		});

		it('measures the distance from the start point', () => {
			core.start(100, 100);

			expect(core.move(100, 97)).toBe(null);
			expect(core.move(98, 97)).toEqual({isStart: true, dx: -2, dy: -3, x: 98, y: 97});
		});

		it('is configurable', () => {
			const custom = new Drag({threshold: 10});
			custom.start(0, 0);

			expect(custom.move(10, 0)).toBe(null);
			expect(custom.move(11, 0)?.isStart).toBe(true);
		});

		it('starts on the first move with a threshold of 0', () => {
			const custom = new Drag({threshold: 0});
			custom.start(0, 0);

			expect(custom.move(1, 0)?.isStart).toBe(true);
		});
	});

	describe('.start()', () => {
		it('restarts a finished drag from the new point', () => {
			core.start(0, 0);
			core.move(10, 0);
			core.end(10, 0);
			core.start(500, 500);

			expect(core.move(501, 500)).toBe(null);
			expect(core.move(510, 500)).toEqual({isStart: true, dx: 10, dy: 0, x: 510, y: 500});
		});

		it('restarts a cancelled drag', () => {
			core.start(0, 0);
			core.move(10, 0);
			core.cancel();
			core.start(500, 500);

			expect(core.move(510, 500)).toEqual({isStart: true, dx: 10, dy: 0, x: 510, y: 500});
		});

		it('restarts after a click', () => {
			core.start(0, 0);
			core.end(0, 0);
			core.start(500, 500);

			expect(core.move(510, 500)).toEqual({isStart: true, dx: 10, dy: 0, x: 510, y: 500});
		});

		it('keeps the threshold across drags', () => {
			const custom = new Drag({threshold: 10});

			custom.start(0, 0);
			custom.end(0, 0);
			custom.start(0, 0);

			expect(custom.move(10, 0)).toBe(null);
		});
	});

	describe('.move()', () => {
		it('returns `isStart: false` after the start', () => {
			core.start(100, 100);
			core.move(110, 100);

			expect(core.move(120, 90)).toEqual({isStart: false, dx: 20, dy: -10, x: 120, y: 90});
			expect(core.move(100, 100)).toEqual({isStart: false, dx: 0, dy: 0, x: 100, y: 100});
		});

		it('returns `isStart: true` only once', () => {
			core.start(0, 0);

			expect(core.move(10, 0)?.isStart).toBe(true);
			expect(core.move(0, 0)?.isStart).toBe(false);
			expect(core.move(10, 0)?.isStart).toBe(false);
		});

		it('reports `dx/dy` since drag start', () => {
			core.start(50, 50);
			core.move(60, 60);
			core.move(70, 70);

			expect(core.move(80, 80)).toMatchObject({dx: 30, dy: 30});
		});

		it('throws before `start`', () => {
			expect(() => core.move(10, 10)).toThrow();
		});
	});

	describe('.end()', () => {
		it('returns the position with `dx/dy` recomputed from the release point', () => {
			core.start(100, 100);
			core.move(110, 110);

			expect(core.end(130, 140)).toEqual({dx: 30, dy: 40, x: 130, y: 140});
		});

		it('returns null when the threshold was never passed (a click)', () => {
			core.start(100, 100);
			core.move(101, 101);

			expect(core.end(101, 101)).toBe(null);
		});

		it('returns null on a release far away without a prior move past the threshold', () => {
			core.start(100, 100);

			expect(core.end(200, 200)).toBe(null);
		});

		it('finishes the drag', () => {
			core.start(0, 0);
			core.move(10, 10);
			core.end(10, 10);

			expect(() => core.move(20, 20)).toThrow();
			expect(() => core.end(20, 20)).toThrow();
		});

		it('finishes the drag after a click too', () => {
			core.start(0, 0);
			core.end(0, 0);

			expect(() => core.move(20, 20)).toThrow();
		});

		it('throws before `start`', () => {
			expect(() => core.end(10, 10)).toThrow();
		});
	});

	describe('.cancel()', () => {
		it('returns true while dragging', () => {
			core.start(0, 0);
			core.move(10, 0);

			expect(core.cancel()).toBe(true);
		});

		it('returns false when the threshold was never passed', () => {
			core.start(0, 0);
			core.move(1, 0);

			expect(core.cancel()).toBe(false);
		});

		it('finishes the drag', () => {
			core.start(0, 0);
			core.move(10, 0);
			core.cancel();

			expect(() => core.move(20, 0)).toThrow();
			expect(() => core.end(20, 0)).toThrow();
			expect(() => core.cancel()).toThrow();
		});

		it('throws after `end`', () => {
			core.start(0, 0);
			core.move(10, 0);
			core.end(10, 0);

			expect(() => core.cancel()).toThrow();
		});

		it('throws before `start`', () => {
			expect(() => core.cancel()).toThrow();
		});
	});

	describe('instances', () => {
		it('are independent', () => {
			const a = new Drag();
			const b = new Drag();

			a.start(0, 0);
			b.start(500, 500);
			a.move(10, 0);

			expect(b.move(505, 500)).toEqual({isStart: true, dx: 5, dy: 0, x: 505, y: 500});
			expect(a.move(20, 0)).toEqual({isStart: false, dx: 20, dy: 0, x: 20, y: 0});
		});
	});
});
