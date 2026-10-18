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
			({x: startX, y: startY} = dragData.clampPointTo(canvas));

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			rect = document.createElement('div');
			rect.className = 'rect drawing';
			canvas.append(rect);

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			const {x, y} = dragData.clampPointTo(canvas);
			rect.style.left = `${Math.min(startX, x)}px`;
			rect.style.top = `${Math.min(startY, y)}px`;
			rect.style.width = `${Math.abs(x - startX)}px`;
			rect.style.height = `${Math.abs(y - startY)}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			rect.classList.remove('drawing');

			logOutput('dragEnd', dragData);
		});

	return [draw];
});
