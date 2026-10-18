import {drag} from '../src';
import {mount, logOutput} from './shared';

const MIN_DISTANCE = 30;

const area = document.getElementById('area')!;
const line = document.getElementById('line')!;
const result = document.getElementById('result')!;

area.addEventListener('contextmenu', (ev) => ev.preventDefault());

const direction = (dx: number, dy: number) => {
	if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_DISTANCE) return '';
	if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? '→ forward' : '← back';
	return dy > 0 ? '↓ close' : '↑ reload';
};

mount((threshold) => {
	const gesture = drag(area, {button: 0, threshold})
		.on('grab', (dragData) => {
			const {x, y} = dragData.clampPointTo(area);
			line.setAttribute('x1', String(x));
			line.setAttribute('y1', String(y));
			line.setAttribute('x2', String(x));
			line.setAttribute('y2', String(y));
			result.textContent = '';

			logOutput('grab', dragData);
		})
		.on('dragging', (dragData) => {
			const {x, y} = dragData.clampPointTo(area);
			line.setAttribute('x2', String(x));
			line.setAttribute('y2', String(y));
			result.textContent = direction(dragData.dx, dragData.dy);

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			result.textContent = direction(dragData.dx, dragData.dy) || 'no gesture';
			['x1', 'y1', 'x2', 'y2'].forEach((attr) => line.removeAttribute(attr));

			logOutput('dragEnd', dragData);
		});

	return [gesture];
});
