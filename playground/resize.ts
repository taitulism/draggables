import {createDragger} from '../src';
import {logOutput, logCancel} from './shared';

const MIN = 60;

const panel = document.getElementById('panel')!;
const stage = panel.parentElement!;

let side = '';
let anchor = {left: 0, top: 0, right: 0, bottom: 0};

createDragger(panel, {grip: '[data-side]', bound: 'pointer', container: stage})
	.on('grab', (dragState) => {
		side = dragState.grip.dataset.side!;
		anchor = {
			left: panel.offsetLeft,
			top: panel.offsetTop,
			right: panel.offsetLeft + panel.offsetWidth,
			bottom: panel.offsetTop + panel.offsetHeight,
		};

		logOutput('grab', dragState);
	})
	.on('dragging', (dragState) => {
		const {containerX, containerY} = dragState;

		if (side.includes('e')) {
			panel.style.width = `${Math.max(containerX - anchor.left, MIN)}px`;
		}
		if (side.includes('w')) {
			const width = Math.max(anchor.right - containerX, MIN);
			panel.style.width = `${width}px`;
			panel.style.left = `${anchor.right - width}px`;
		}
		if (side.includes('s')) {
			panel.style.height = `${Math.max(containerY - anchor.top, MIN)}px`;
		}
		if (side.includes('n')) {
			const height = Math.max(anchor.bottom - containerY, MIN);
			panel.style.height = `${height}px`;
			panel.style.top = `${anchor.bottom - height}px`;
		}

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => logOutput('dragEnd', dragState))
	.on('dragCancel', ({elm}) => {
		panel.style.left = `${anchor.left}px`;
		panel.style.top = `${anchor.top}px`;
		panel.style.width = `${anchor.right - anchor.left}px`;
		panel.style.height = `${anchor.bottom - anchor.top}px`;

		logCancel(elm);
	});

