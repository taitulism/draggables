import type {Point} from '../src/types';

const getElmFromPoint = (p: Point) => document.elementFromPoint(...p) as Element;

const createEvent = (type: string, props: PointerEventInit = {}) => {
	const event = new window.Event(type, {bubbles: true});
	Object.assign(event, props);
	return event;
};

function simulateMouseDown (elm: Element, point: Point) {
	const [x, y] = point;
	const event = createEvent('pointerdown', {
		clientX: x,
		clientY: y,
		pointerId: 1,
		button: 0,
	});

	return elm.dispatchEvent(event);
}

function simulateMouseMove (elm: Element, point: Point) {
	const [x, y] = point;
	const event = createEvent('pointermove', {
		clientX: x,
		clientY: y,
		pointerId: 1,
		button: 0,
	});

	return elm.dispatchEvent(event);
}

function simulateMouseUp (elm: Element, point: Point) {
	const [x, y] = point;
	const event = createEvent('pointerup', {
		clientX: x,
		clientY: y,
		pointerId: 1,
		button: 0,
	});

	return elm.dispatchEvent(event);
}

function simulateMouseClick (elm: Element, point: Point) {
	const [x, y] = point;
	const event = createEvent('click', {
		clientX: x,
		clientY: y,
		pointerId: 1,
		button: 0,
	});

	return elm.dispatchEvent(event);
}

export function createMouseSimulator () {
	let currentPosition: Point = [0, 0];
	let isDown = false;
	let isClick = false;
	let mouseDownElm: Element | undefined;

	return {
		get currentPosition () {
			return currentPosition;
		},
		moveToElm (elm: HTMLElement) {
			if (!document.contains(elm)) throw new Error('Element is not in DOM');

			const {x, y} = elm.getBoundingClientRect();
			currentPosition = [x, y];

			simulateMouseMove(elm, currentPosition);
			return this;
		},

		down (offset?: Point) {
			if (isDown) throw new Error('Mouse is already down');
			isDown = true;

			if (offset) {
				currentPosition[0] += offset[0];
				currentPosition[1] += offset[1];
			}

			mouseDownElm = getElmFromPoint(currentPosition);
			if (!mouseDownElm) throw new Error('No element in current position');

			simulateMouseDown(mouseDownElm, currentPosition);
			return this;
		},

		move (point: Point) {
			const elm = getElmFromPoint(currentPosition) || document.documentElement;
			const [x, y] = currentPosition;

			currentPosition = [x + point[0], y + point[1]];

			simulateMouseMove(elm, currentPosition);
			return this;
		},

		up () {
			if (!isDown) throw new Error('Mouse is not down');
			isDown = false;

			const elm = getElmFromPoint(currentPosition) || document.documentElement;

			simulateMouseUp(elm, currentPosition);

			if (!isClick && elm === mouseDownElm) {
				simulateMouseClick(elm, currentPosition);
			}

			mouseDownElm = undefined;

			return this;
		},

		click (offset?: Point) {
			isClick = true;
			this.down(offset).up();

			if (offset) {
				currentPosition[0] += offset[0];
				currentPosition[1] += offset[1];
			}

			const elm = getElmFromPoint(currentPosition);

			simulateMouseClick(elm, currentPosition);

			isClick = false;
			return this;
		},

		reset () {
			currentPosition = [0, 0];
			isDown = false;
			isClick = false;
			mouseDownElm = undefined;
		},
	};
}
