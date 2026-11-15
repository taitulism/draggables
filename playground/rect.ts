import {drag} from '../src';
import {mount, logOutput} from './shared';

const canvas = document.getElementById('canvas')!;
const clearCanvasBtn = document.getElementById('clear-canvas')!;

clearCanvasBtn.addEventListener('click', () => canvas.replaceChildren());

mount((threshold) => {
	let rect: HTMLElement;

	const draw = drag(canvas, {threshold, bound: 'pointer'})
		.on('grab', (dragData) => logOutput('grab', dragData))
		.on('dragStart', (dragData) => {
			rect = document.createElement('div');
			rect.className = 'rect drawing';
			canvas.append(rect);

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			const {startContainerX, startContainerY, containerX, containerY} = dragData;
			rect.style.left = `${Math.min(startContainerX, containerX)}px`;
			rect.style.top = `${Math.min(startContainerY, containerY)}px`;
			rect.style.width = `${Math.abs(containerX - startContainerX)}px`;
			rect.style.height = `${Math.abs(containerY - startContainerY)}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			rect.classList.remove('drawing');

			logOutput('dragEnd', dragData);
		});

	return [draw];
});
