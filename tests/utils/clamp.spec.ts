import {describe, it, expect} from 'vitest';
import {clamp} from '../../src';

describe('clamp', () => {
	it('returns min when below range', () => {
		expect(clamp(-5, 0, 10)).toBe(0);
	});

	it('returns max when above range', () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it('returns the value when within range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});
});
