import {drag} from '../src';
import {mount, logOutput} from './shared';

const MIN = 60;

const panel = document.getElementById('panel')!;
const stage = panel.parentElement!;

mount((threshold) => {
	let side = '';
	let anchor = {left: 0, top: 0, right: 0, bottom: 0};

	const resize = drag(panel, {handle: '[data-side]', threshold, bound: 'pointer', container: stage})
		.on('grab', (dragData) => {
			side = dragData.handle.dataset.side!;
			anchor = {
				left: panel.offsetLeft,
				top: panel.offsetTop,
				right: panel.offsetLeft + panel.offsetWidth,
				bottom: panel.offsetTop + panel.offsetHeight,
			};

			logOutput('grab', dragData);
		})
		.on('dragging', (dragData) => {
			const {containerX, containerY} = dragData;

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

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => logOutput('dragEnd', dragData));

	return [resize];
});
