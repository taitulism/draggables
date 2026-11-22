import {createDragger} from '../src';
import {logOutput, logCancel} from './shared';

const canvas = document.getElementById('canvas')!;
const clearCanvasBtn = document.getElementById('clear-canvas')!;

clearCanvasBtn.addEventListener('click', () => canvas.replaceChildren());

let rect: HTMLElement;

createDragger(canvas, {container: canvas, clamp: 'pointer'})
	.on('grab', (dragState) => logOutput('grab', dragState))
	.on('dragStart', (dragState) => {
		rect = document.createElement('div');
		rect.className = 'rect drawing';
		canvas.append(rect);

		logOutput('dragStart', dragState);
	})
	.on('dragging', (dragState) => {
		const {startX, startY, x, y} = dragState;
		rect.style.left = `${Math.min(startX, x)}px`;
		rect.style.top = `${Math.min(startY, y)}px`;
		rect.style.width = `${Math.abs(x - startX)}px`;
		rect.style.height = `${Math.abs(y - startY)}px`;

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => {
		rect.classList.remove('drawing');

		logOutput('dragEnd', dragState);
	})
	.on('dragCancel', ({elm}) => {
		rect.remove();

		logCancel(elm);
	});
