import {createDragger} from '../src';
import {logOutput, logCancel} from './shared';

const viewport = document.getElementById('viewport')!;
const content = document.getElementById('content')!;

for (let i = 1; i <= 100; i++) {
	const tile = document.createElement('div');
	tile.className = 'tile';
	tile.textContent = String(i);
	content.append(tile);
}

let startLeft = 0;
let startTop = 0;

createDragger(viewport)
	.on('grab', (dragState) => {
		startLeft = viewport.scrollLeft;
		startTop = viewport.scrollTop;

		logOutput('grab', dragState);
	})
	.on('dragStart', (dragState) => {
		viewport.classList.add('panning');

		logOutput('dragStart', dragState);
	})
	.on('dragging', (dragState) => {
		viewport.scrollLeft = startLeft - dragState.dx;
		viewport.scrollTop = startTop - dragState.dy;

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => {
		viewport.classList.remove('panning');

		logOutput('dragEnd', dragState);
	})
	.on('dragCancel', ({elm}) => {
		viewport.classList.remove('panning');
		viewport.scrollLeft = startLeft;
		viewport.scrollTop = startTop;

		logCancel(elm);
	});

