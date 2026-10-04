import {drag} from '../src';
import {mount, logOutput} from './shared';

const canvas = document.getElementById('canvas')!;
const clearCanvasBtn = document.getElementById('clear-canvas')!;

clearCanvasBtn.addEventListener('click', () => canvas.replaceChildren());

mount((threshold) => {
	let startX = 0;
	let startY = 0;
	let rect: HTMLElement;

	const draw = drag(canvas, {target: (ev) => ev.button === 0 ? canvas : null, threshold})
		.on('grab', (ev) => {
			const box = canvas.getBoundingClientRect();
			startX = ev.x - box.left;
			startY = ev.y - box.top;

			logOutput('grab', ev);
		})
		.on('dragStart', (ev) => {
			rect = document.createElement('div');
			rect.className = 'rect drawing';
			canvas.append(rect);

			logOutput('dragStart', ev);
		})
		.on('dragging', (ev) => {
			rect.style.left = `${startX + Math.min(ev.dx, 0)}px`;
			rect.style.top = `${startY + Math.min(ev.dy, 0)}px`;
			rect.style.width = `${Math.abs(ev.dx)}px`;
			rect.style.height = `${Math.abs(ev.dy)}px`;

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => {
			rect.classList.remove('drawing');

			logOutput('dragEnd', ev);
		});

	return [draw];
});
