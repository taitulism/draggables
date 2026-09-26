import {describe, it, expect} from 'vitest';
import {startDrag} from '../../src/core/startDrag';

describe('startDrag', () => {
	describe('threshold', () => {
		it('returns null while within the default 3px threshold', () => {
			const core = startDrag(100, 100);

			expect(core.move(101, 101)).toBe(null);
			expect(core.move(102, 102)).toBe(null);
			expect(core.move(103, 100)).toBe(null);
		});

		it('returns `dragStart` once the threshold is passed', () => {
			const core = startDrag(100, 100);

			expect(core.move(103, 103)).toEqual({type: 'dragStart', dx: 3, dy: 3, x: 103, y: 103});
		});

		it('measures the distance from the start point', () => {
			const core = startDrag(100, 100);

			expect(core.move(100, 97)).toBe(null);
			expect(core.move(98, 97)).toEqual({type: 'dragStart', dx: -2, dy: -3, x: 98, y: 97});
		});

		it('is configurable', () => {
			const core = startDrag(0, 0, {threshold: 10});

			expect(core.move(10, 0)).toBe(null);
			expect(core.move(11, 0)?.type).toBe('dragStart');
		});

		it('starts on the first move with a threshold of 0', () => {
			const core = startDrag(0, 0, {threshold: 0});

			expect(core.move(1, 0)?.type).toBe('dragStart');
		});
	});

	describe('.move()', () => {
		it('returns `dragging` after `dragStart`', () => {
			const core = startDrag(100, 100);

			core.move(110, 100);
			expect(core.move(120, 90)).toEqual({type: 'dragging', dx: 20, dy: -10, x: 120, y: 90});
			expect(core.move(100, 100)).toEqual({type: 'dragging', dx: 0, dy: 0, x: 100, y: 100});
		});

		it('fires `dragStart` only once', () => {
			const core = startDrag(0, 0);

			expect(core.move(10, 0)?.type).toBe('dragStart');
			expect(core.move(0, 0)?.type).toBe('dragging');
			expect(core.move(10, 0)?.type).toBe('dragging');
		});

		it('reports `dx/dy` since drag start', () => {
			const core = startDrag(50, 50);

			core.move(60, 60);
			core.move(70, 70);
			expect(core.move(80, 80)).toMatchObject({dx: 30, dy: 30});
		});
	});

	describe('.end()', () => {
		it('returns `dragEnd` with `dx/dy` recomputed from the release point', () => {
			const core = startDrag(100, 100);

			core.move(110, 110);
			expect(core.end(130, 140)).toEqual({type: 'dragEnd', dx: 30, dy: 40, x: 130, y: 140});
		});

		it('returns null when the threshold was never passed (a click)', () => {
			const core = startDrag(100, 100);

			core.move(101, 101);
			expect(core.end(101, 101)).toBe(null);
		});

		it('returns null on a release far away without a prior move past the threshold', () => {
			const core = startDrag(100, 100);

			expect(core.end(200, 200)).toBe(null);
		});

		it('disposes the instance', () => {
			const core = startDrag(0, 0);

			core.move(10, 10);
			core.end(10, 10);

			expect(() => core.move(20, 20)).toThrow();
			expect(() => core.end(20, 20)).toThrow();
		});

		it('disposes the instance after a click too', () => {
			const core = startDrag(0, 0);

			core.end(0, 0);

			expect(() => core.move(20, 20)).toThrow();
		});
	});

	describe('.cancel()', () => {
		it('returns `dragCancel` while dragging', () => {
			const core = startDrag(0, 0);

			core.move(10, 0);
			expect(core.cancel()).toEqual({type: 'dragCancel'});
		});

		it('returns null when the threshold was never passed', () => {
			const core = startDrag(0, 0);

			core.move(1, 0);
			expect(core.cancel()).toBe(null);
		});

		it('disposes the instance', () => {
			const core = startDrag(0, 0);

			core.move(10, 0);
			core.cancel();

			expect(() => core.move(20, 0)).toThrow();
			expect(() => core.end(20, 0)).toThrow();
			expect(() => core.cancel()).toThrow();
		});

		it('throws after `end`', () => {
			const core = startDrag(0, 0);

			core.move(10, 0);
			core.end(10, 0);

			expect(() => core.cancel()).toThrow();
		});
	});

	describe('instances', () => {
		it('are independent', () => {
			const a = startDrag(0, 0);
			const b = startDrag(500, 500);

			a.move(10, 0);
			expect(b.move(505, 500)).toEqual({type: 'dragStart', dx: 5, dy: 0, x: 505, y: 500});
			expect(a.move(20, 0)).toEqual({type: 'dragging', dx: 20, dy: 0, x: 20, y: 0});
		});
	});
});
