export type DragOptions = {
	threshold?: number
}

export type DragPosition = {
	dx: number
	dy: number
	x: number
	y: number
	vx: number
	vy: number
}

type Sample = {x: number, y: number, t: number}

type DragState = 'pending' | 'dragging' | 'idle'

const DEFAULT_THRESHOLD = 3;
const VELOCITY_WINDOW = 100;

export class Drag {
	#startX = 0;
	#startY = 0;
	#threshold: number;
	#state: DragState = 'idle';
	#samples: Sample[] = [];

	constructor (opts: DragOptions = {}) {
		this.#threshold = opts.threshold ?? DEFAULT_THRESHOLD;
	}

	start (x: number, y: number, t = performance.now()) {
		this.#startX = x;
		this.#startY = y;
		this.#samples = [{x, y, t}];
		this.#state = 'pending';
	}

	move (x: number, y: number, t = performance.now()): (DragPosition & {isStart: boolean}) | null {
		this.#assertNotIdle();

		const dx = x - this.#startX;
		const dy = y - this.#startY;
		const {vx, vy} = this.#track(x, y, t);

		if (this.#state === 'dragging') {
			return {isStart: false, dx, dy, x, y, vx, vy};
		}

		if (Math.sqrt(dx ** 2 + dy ** 2) > this.#threshold) {
			this.#state = 'dragging';
			return {isStart: true, dx, dy, x, y, vx, vy};
		}

		return null;
	}

	end (x: number, y: number, t = performance.now()): DragPosition | null {
		this.#assertNotIdle();
		const {vx, vy} = this.#track(x, y, t);
		if (!this.#finish()) return null;

		return {dx: x - this.#startX, dy: y - this.#startY, x, y, vx, vy};
	}

	cancel (): boolean {
		this.#assertNotIdle();
		return this.#finish();
	}

	#assertNotIdle () {
		if (this.#state === 'idle') throw new Error('Drag Error: Drag is idle');
	}

	#track (x: number, y: number, t: number) {
		this.#samples.push({x, y, t});
		while (this.#samples.length > 2 && t - this.#samples[1].t >= VELOCITY_WINDOW) this.#samples.shift();

		const first = this.#samples[0];
		const dt = t - first.t;
		if (dt <= 0) return {vx: 0, vy: 0};
		return {vx: (x - first.x) / dt, vy: (y - first.y) / dt};
	}

	#finish () {
		const wasDragging = this.#state === 'dragging';
		this.#state = 'idle';
		return wasDragging;
	}
}
