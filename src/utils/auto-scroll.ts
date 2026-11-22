import {getEdgeProximity, type Edges} from './edge-proximity';

export type AutoScrollOptions = {
	threshold?: number
	speed?: number
}

const DEFAULT_THRESHOLD = 40;
const DEFAULT_SPEED = 15;

const measureEdges = (scrollElm: HTMLElement | Window, x: number, y: number): Edges => {
	if (scrollElm instanceof Window) {
		return {
			top: y,
			right: innerWidth - x,
			bottom: innerHeight - y,
			left: x,
		};
	}

	return getEdgeProximity(scrollElm, x, y);
};

export function autoScroll (scrollElm: HTMLElement | Window, opts: AutoScrollOptions = {}) {
	const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
	const speed = opts.speed ?? DEFAULT_SPEED;
	let x = 0;
	let y = 0;
	let frame = 0;

	const step = (distance: number) => {
		if (distance >= threshold) return 0;

		return Math.round(speed * Math.min(1, 1 - distance / threshold));
	};

	const tick = () => {
		const edges = measureEdges(scrollElm, x, y);
		const left = step(edges.right) - step(edges.left);
		const top = step(edges.bottom) - step(edges.top);

		if (!left && !top) {
			frame = 0;
			return;
		}

		scrollElm.scrollBy({left, top});
		frame = requestAnimationFrame(tick);
	};

	return {
		update (clientX: number, clientY: number) {
			x = clientX;
			y = clientY;
			if (!frame) frame = requestAnimationFrame(tick);
		},

		stop () {
			cancelAnimationFrame(frame);
			frame = 0;
		},
	};
}

export type AutoScroller = ReturnType<typeof autoScroll>
