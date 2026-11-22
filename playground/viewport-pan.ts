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
let glideFrame = 0;

const FRICTION = 0.95;
const MIN_SPEED = 0.01;

const glide = (vx: number, vy: number) => {
	let last = performance.now();
	const step = (now: number) => {
		const dt = now - last;
		last = now;
		viewport.scrollLeft -= vx * dt;
		viewport.scrollTop -= vy * dt;
		const decay = FRICTION ** (dt / 16);
		vx *= decay;
		vy *= decay;
		if (Math.hypot(vx, vy) > MIN_SPEED) glideFrame = requestAnimationFrame(step);
	};
	glideFrame = requestAnimationFrame(step);
};

createDragger(viewport)
	.on('grab', (dragState) => {
		cancelAnimationFrame(glideFrame);
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
		glide(dragState.vx, dragState.vy);

		logOutput('dragEnd', dragState);
	})
	.on('dragCancel', ({elm}) => {
		viewport.classList.remove('panning');
		viewport.scrollLeft = startLeft;
		viewport.scrollTop = startTop;

		logCancel(elm);
	});

