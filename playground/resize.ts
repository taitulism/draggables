import {drag} from '../src';
import {mount, logOutput} from './shared';

const MIN = 60;

const panel = document.getElementById('panel')!;

mount((threshold) => {
	let edge = '';
	let start = {left: 0, top: 0, width: 0, height: 0};

	const resize = drag(panel, {target: '.handle', threshold})
		.on('grab', (ev) => {
			edge = ev.elm.dataset.edge!;
			start = {
				left: panel.offsetLeft,
				top: panel.offsetTop,
				width: panel.offsetWidth,
				height: panel.offsetHeight,
			};

			logOutput('grab', ev);
		})
		.on('dragging', (ev) => {
			if (edge.includes('e')) {
				panel.style.width = `${Math.max(start.width + ev.dx, MIN)}px`;
			}
			if (edge.includes('w')) {
				const width = Math.max(start.width - ev.dx, MIN);
				panel.style.width = `${width}px`;
				panel.style.left = `${start.left + start.width - width}px`;
			}
			if (edge.includes('s')) {
				panel.style.height = `${Math.max(start.height + ev.dy, MIN)}px`;
			}
			if (edge.includes('n')) {
				const height = Math.max(start.height - ev.dy, MIN);
				panel.style.height = `${height}px`;
				panel.style.top = `${start.top + start.height - height}px`;
			}

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => logOutput('dragEnd', ev));

	return [resize];
});
