import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {getEdgeProximity} from '../../src';

describe('getEdgeProximity', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		Object.assign(container.style, {
			position: 'absolute',
			left: '50px',
			top: '50px',
			width: '400px',
			height: '300px',
		});
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it('returns distances from a rect to each container edge', () => {
		const {left, top} = container.getBoundingClientRect();
		const rect = {
			left: left + 10,
			top: top + 20,
			right: left + 110,
			bottom: top + 120,
		};

		const edges = getEdgeProximity(container, rect);

		expect(edges).toEqual({
			top: 20,
			right: 290,
			bottom: 180,
			left: 10,
		});
	});

	it('returns distances from a point to each container edge', () => {
		const {left, top} = container.getBoundingClientRect();

		const edges = getEdgeProximity(container, left + 5, top + 295);

		expect(edges).toEqual({
			top: 295,
			right: 395,
			bottom: 5,
			left: 5,
		});
	});

	it('measures from the padding box', () => {
		container.style.border = '5px solid';
		const {left, top} = container.getBoundingClientRect();

		const edges = getEdgeProximity(container, left + 5, top + 5);

		expect(edges).toEqual({
			top: 0,
			right: 400,
			bottom: 300,
			left: 0,
		});
	});

	it('returns negative distances when outside', () => {
		const {left, top} = container.getBoundingClientRect();

		const edges = getEdgeProximity(container, left - 10, top + 10);

		expect(edges.left).toBe(-10);
	});
});
