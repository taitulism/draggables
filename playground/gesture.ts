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
	let box: DOMRect;

	const gesture = drag(area, {target: (ev) => ev.button === 2 ? area : null, threshold})
		.on('grab', (ev) => {
			box = area.getBoundingClientRect();
			line.setAttribute('x1', String(ev.x - box.left));
			line.setAttribute('y1', String(ev.y - box.top));
			line.setAttribute('x2', String(ev.x - box.left));
			line.setAttribute('y2', String(ev.y - box.top));
			result.textContent = '';

			logOutput('grab', ev);
		})
		.on('dragging', (ev) => {
			line.setAttribute('x2', String(ev.x - box.left));
			line.setAttribute('y2', String(ev.y - box.top));
			result.textContent = direction(ev.dx, ev.dy);

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => {
			result.textContent = direction(ev.dx, ev.dy) || 'no gesture';
			['x1', 'y1', 'x2', 'y2'].forEach((attr) => line.removeAttribute(attr));

			logOutput('dragEnd', ev);
		});

	return [gesture];
});
