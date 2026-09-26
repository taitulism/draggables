export type DragOptions = {
	threshold?: number
}

export type DragMoveStep = {
	type: 'dragStart' | 'dragging' | 'dragEnd'
	dx: number
	dy: number
	x: number
	y: number
}

export type DragCancelStep = {
	type: 'dragCancel'
}

export type DragStep = DragMoveStep | DragCancelStep

type Phase = 'pending' | 'dragging' | 'done'

const DEFAULT_THRESHOLD = 3;

export function startDrag (startX: number, startY: number, opts: DragOptions = {}) {
	const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
	let phase: Phase = 'pending';

	const assertNotDone = () => {
		if (phase === 'done') throw new Error('startDrag Error: Drag is done');
	};

	const finish = () => {
		const wasDragging = phase === 'dragging';
		phase = 'done';
		return wasDragging;
	};

	return {
		move (x: number, y: number): DragMoveStep | null {
			assertNotDone();

			const dx = x - startX;
			const dy = y - startY;

			if (phase === 'dragging') return {type: 'dragging', dx, dy, x, y};

			if (Math.sqrt(dx ** 2 + dy ** 2) > threshold) {
				phase = 'dragging';
				return {type: 'dragStart', dx, dy, x, y};
			}

			return null;
		},

		end (x: number, y: number): DragMoveStep | null {
			assertNotDone();
			if (!finish()) return null;

			return {type: 'dragEnd', dx: x - startX, dy: y - startY, x, y};
		},

		cancel (): DragCancelStep | null {
			assertNotDone();
			if (!finish()) return null;

			return {type: 'dragCancel'};
		},
	};
}

export type Drag = ReturnType<typeof startDrag>
