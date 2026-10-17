import {drag} from '../src';
import {mount, logOutput} from './shared';

const MIN = 60;

const panel = document.getElementById('panel')!;

mount((threshold) => {
	let side = '';
	let start = {left: 0, top: 0, width: 0, height: 0};

	const resize = drag(panel, {threshold})
		.on('grab', (ev) => {
			side = (ev.ev.target as HTMLElement).closest<HTMLElement>('[data-side]')!.dataset.side!;
			start = {
				left: panel.offsetLeft,
				top: panel.offsetTop,
				width: panel.offsetWidth,
				height: panel.offsetHeight,
			};

			logOutput('grab', ev);
		})
		.on('dragging', (ev) => {
			if (side.includes('e')) {
				panel.style.width = `${Math.max(start.width + ev.dx, MIN)}px`;
			}
			if (side.includes('w')) {
				const width = Math.max(start.width - ev.dx, MIN);
				panel.style.width = `${width}px`;
				panel.style.left = `${start.left + start.width - width}px`;
			}
			if (side.includes('s')) {
				panel.style.height = `${Math.max(start.height + ev.dy, MIN)}px`;
			}
			if (side.includes('n')) {
				const height = Math.max(start.height - ev.dy, MIN);
				panel.style.height = `${height}px`;
				panel.style.top = `${start.top + start.height - height}px`;
			}

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => logOutput('dragEnd', ev));

	return [resize];
});
