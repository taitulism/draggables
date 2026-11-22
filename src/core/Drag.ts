export type DragOptions = {
	threshold?: number
}

export type DragPosition = {
	dx: number
	dy: number
	x: number
	y: number
}

type DragState = 'pending' | 'dragging' | 'idle'

const DEFAULT_THRESHOLD = 3;

export class Drag {
	#startX = 0;
	#startY = 0;
	#threshold: number;
	#state: DragState = 'idle';

	constructor (opts: DragOptions = {}) {
		this.#threshold = opts.threshold ?? DEFAULT_THRESHOLD;
	}

	start (x: number, y: number) {
		this.#startX = x;
		this.#startY = y;
		this.#state = 'pending';
	}

	move (x: number, y: number): (DragPosition & {isStart: boolean}) | null {
		this.#assertNotIdle();

		const dx = x - this.#startX;
		const dy = y - this.#startY;

		if (this.#state === 'dragging') {
			return {isStart: false, dx, dy, x, y};
		}

		if (Math.sqrt(dx ** 2 + dy ** 2) > this.#threshold) {
			this.#state = 'dragging';
			return {isStart: true, dx, dy, x, y};
		}

		return null;
	}

	end (x: number, y: number): DragPosition | null {
		this.#assertNotIdle();
		if (!this.#finish()) return null;

		return {dx: x - this.#startX, dy: y - this.#startY, x, y};
	}

	cancel (): boolean {
		this.#assertNotIdle();
		return this.#finish();
	}

	#assertNotIdle () {
		if (this.#state === 'idle') throw new Error('Drag Error: Drag is idle');
	}

	#finish () {
		const wasDragging = this.#state === 'dragging';
		this.#state = 'idle';
		return wasDragging;
	}
}
