import {drag} from '../src';
import {mount, logOutput} from './shared';

const viewport = document.getElementById('viewport')!;
const content = document.getElementById('content')!;

for (let i = 1; i <= 100; i++) {
	const tile = document.createElement('div');
	tile.className = 'tile';
	tile.textContent = String(i);
	content.append(tile);
}

mount((threshold) => {
	let startLeft = 0;
	let startTop = 0;

	const pan = drag(viewport, {target: (ev) => ev.button === 0 ? viewport : null, threshold})
		.on('grab', (ev) => {
			startLeft = viewport.scrollLeft;
			startTop = viewport.scrollTop;

			logOutput('grab', ev);
		})
		.on('dragStart', (ev) => {
			viewport.classList.add('panning');

			logOutput('dragStart', ev);
		})
		.on('dragging', (ev) => {
			viewport.scrollLeft = startLeft - ev.dx;
			viewport.scrollTop = startTop - ev.dy;

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => {
			viewport.classList.remove('panning');

			logOutput('dragEnd', ev);
		});

	return [pan];
});
