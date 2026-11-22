import {beforeEach, afterEach, describe, it, expect} from 'vitest';
import {findDropzone, measureZones, hitZone} from '../../src';
import {createContainerElm} from '../dom-utils';

describe('Dropzones', () => {
	let container: HTMLElement;
	let zoneA: HTMLElement;
	let zoneB: HTMLElement;
	let origin: {x: number, y: number};

	const createZone = (id: string, left: number) => {
		const zone = document.createElement('div');
		zone.id = id;
		zone.classList.add('zone');
		Object.assign(zone.style, {
			position: 'absolute', left: `${left}px`, top: '200px', width: '100px', height: '100px',
		});
		container.appendChild(zone);
		return zone;
	};

	beforeEach(() => {
		container = createContainerElm();
		container.style.position = 'relative';
		document.body.appendChild(container);

		zoneA = createZone('zone-a', 0);
		zoneB = createZone('zone-b', 200);

		const {left, top} = container.getBoundingClientRect();
		origin = {x: left, y: top};
	});

	afterEach(() => {
		container.remove();
	});

	const finders = {
		findDropzone: (x: number, y: number, exclude?: HTMLElement) =>
			findDropzone(origin.x + x, origin.y + y, '.zone', exclude),
		hitZone: (x: number, y: number, exclude?: HTMLElement) =>
			hitZone(measureZones('.zone', exclude), origin.x + x, origin.y + y),
	};

	Object.entries(finders).forEach(([name, find]) => {
		describe(name, () => {
			it('returns the zone under the point', () => {
				expect(find(10, 210)).toBe(zoneA);
				expect(find(210, 210)).toBe(zoneB);
			});

			it('returns `null` when not over a zone', () => {
				expect(find(10, 10)).toBeNull();
			});

			it('skips the excluded element', () => {
				expect(find(10, 210, zoneA)).toBeNull();
			});

			it('picks the innermost zone when zones are nested', () => {
				container.classList.add('zone');

				expect(find(10, 210)).toBe(zoneA);
				expect(find(110, 210)).toBe(container);
			});
		});
	});

	it('`hitZone` uses the rects measured by `measureZones`', () => {
		const zones = measureZones('.zone');
		zoneA.style.left = '300px';

		expect(hitZone(zones, origin.x + 10, origin.y + 210)).toBe(zoneA);
	});
});
