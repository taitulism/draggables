import {createDragger} from '../src';
import {mount, logOutput, logCancel} from './shared';

const canvas = document.getElementById('canvas')!;
const clearCanvasBtn = document.getElementById('clear-canvas')!;

clearCanvasBtn.addEventListener('click', () => canvas.replaceChildren());

mount((threshold) => {
	let rect: HTMLElement;

	const draw = createDragger(canvas, {threshold, bound: 'pointer'})
		.on('grab', (dragState) => logOutput('grab', dragState))
		.on('dragStart', (dragState) => {
			rect = document.createElement('div');
			rect.className = 'rect drawing';
			canvas.append(rect);

			logOutput('dragStart', dragState);
		})
		.on('dragging', (dragState) => {
			const {startContainerX, startContainerY, containerX, containerY} = dragState;
			rect.style.left = `${Math.min(startContainerX, containerX)}px`;
			rect.style.top = `${Math.min(startContainerY, containerY)}px`;
			rect.style.width = `${Math.abs(containerX - startContainerX)}px`;
			rect.style.height = `${Math.abs(containerY - startContainerY)}px`;

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

	return [draw];
});
