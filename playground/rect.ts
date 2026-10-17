import {drag} from '../src';
import {mount, logOutput} from './shared';

const canvas = document.getElementById('canvas')!;
const clearCanvasBtn = document.getElementById('clear-canvas')!;

clearCanvasBtn.addEventListener('click', () => canvas.replaceChildren());

mount((threshold) => {
	let startX = 0;
	let startY = 0;
	let rect: HTMLElement;

	const draw = drag(canvas, {threshold})
		.on('grab', (dragData) => {
			const box = canvas.getBoundingClientRect();
			startX = dragData.x - box.left;
			startY = dragData.y - box.top;

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			rect = document.createElement('div');
			rect.className = 'rect drawing';
			canvas.append(rect);

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			rect.style.left = `${startX + Math.min(dragData.dx, 0)}px`;
			rect.style.top = `${startY + Math.min(dragData.dy, 0)}px`;
			rect.style.width = `${Math.abs(dragData.dx)}px`;
			rect.style.height = `${Math.abs(dragData.dy)}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			rect.classList.remove('drawing');

			logOutput('dragEnd', dragData);
		});

	return [draw];
});
