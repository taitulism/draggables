import {drag, clamp} from '../src';
import {mount, logOutput} from './shared';

const MIN = 60;

const panel = document.getElementById('panel')!;
const stage = panel.parentElement!;

mount((threshold) => {
	let side = '';
	let start = {left: 0, top: 0, width: 0, height: 0};

	const resize = drag(panel, {handle: '[data-side]', threshold})
		.on('grab', (dragData) => {
			side = dragData.handle.dataset.side!;
			start = {
				left: panel.offsetLeft,
				top: panel.offsetTop,
				width: panel.offsetWidth,
				height: panel.offsetHeight,
			};

			logOutput('grab', dragData);
		})
		.on('dragging', (dragData) => {
			if (side.includes('e')) {
				panel.style.width = `${clamp(start.width + dragData.dx, MIN, stage.clientWidth - start.left)}px`;
			}
			if (side.includes('w')) {
				const width = clamp(start.width - dragData.dx, MIN, start.left + start.width);
				panel.style.width = `${width}px`;
				panel.style.left = `${start.left + start.width - width}px`;
			}
			if (side.includes('s')) {
				panel.style.height = `${clamp(start.height + dragData.dy, MIN, stage.clientHeight - start.top)}px`;
			}
			if (side.includes('n')) {
				const height = clamp(start.height - dragData.dy, MIN, start.top + start.height);
				panel.style.height = `${height}px`;
				panel.style.top = `${start.top + start.height - height}px`;
			}

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => logOutput('dragEnd', dragData));

	return [resize];
});
