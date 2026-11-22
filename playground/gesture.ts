import {createDragger} from '../src';
import {logOutput, logCancel} from './shared';

const MIN_DISTANCE = 30;

const area = document.getElementById('area')!;
const line = document.getElementById('line')!;
const result = document.getElementById('result')!;

// for {button: 2}
// area.addEventListener('contextmenu', (ev) => ev.preventDefault());

const direction = (dx: number, dy: number) => {
	if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_DISTANCE) return '';
	if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? '→ forward' : '← back';
	return dy > 0 ? '↓ close' : '↑ reload';
};

createDragger(area, {container: area, clamp: 'pointer'})
	.on('grab', (dragState) => {
		const {x, y} = dragState;
		line.setAttribute('x1', String(x));
		line.setAttribute('y1', String(y));
		line.setAttribute('x2', String(x));
		line.setAttribute('y2', String(y));
		result.textContent = '';

		logOutput('grab', dragState);
	})
	.on('dragging', (dragState) => {
		const {x, y} = dragState;
		line.setAttribute('x2', String(x));
		line.setAttribute('y2', String(y));
		result.textContent = direction(dragState.dx, dragState.dy);

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => {
		result.textContent = direction(dragState.dx, dragState.dy) || 'no gesture';
		['x1', 'y1', 'x2', 'y2'].forEach((attr) => line.removeAttribute(attr));

		logOutput('dragEnd', dragState);
	})
	.on('dragCancel', ({elm}) => {
		result.textContent = 'cancelled';
		['x1', 'y1', 'x2', 'y2'].forEach((attr) => line.removeAttribute(attr));

		logCancel(elm);
	});

