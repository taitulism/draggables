import {drag} from '../src';
import {mount, logOutput, logCancel} from './shared';

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

	const pan = drag(viewport, {threshold})
		.on('grab', (dragData) => {
			startLeft = viewport.scrollLeft;
			startTop = viewport.scrollTop;

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			viewport.classList.add('panning');

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			viewport.scrollLeft = startLeft - dragData.dx;
			viewport.scrollTop = startTop - dragData.dy;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			viewport.classList.remove('panning');

			logOutput('dragEnd', dragData);
		})
		.on('dragCancel', ({elm}) => {
			viewport.classList.remove('panning');
			viewport.scrollLeft = startLeft;
			viewport.scrollTop = startTop;

			logCancel(elm);
		});

	return [pan];
});
