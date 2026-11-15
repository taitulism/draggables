import {drag, clamp} from '../src';
import {mount, logOutput} from './shared';

const track = document.getElementById('track')!;
const value = document.getElementById('value')!;
const splitter = document.getElementById('splitter')!;
const topPane = document.getElementById('top-pane')!;
const panes = document.getElementById('panes')!;

mount((threshold) => {
	const slider = drag(track, {target: '.thumb', threshold, container: track})
		.on('grab', (dragData) => logOutput('grab', dragData))
		.on('dragging', (dragData) => {
			const max = track.clientWidth - dragData.elm.offsetWidth;
			dragData.elm.style.left = `${dragData.left}px`;
			value.textContent = String(Math.round(dragData.left / max * 100));

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => logOutput('dragEnd', dragData));

	let startHeight = 0;

	const split = drag(splitter, {threshold})
		.on('grab', (dragData) => {
			startHeight = topPane.offsetHeight;

			logOutput('grab', dragData);
		})
		.on('dragging', (dragData) => {
			const max = panes.clientHeight - splitter.offsetHeight - 30;
			topPane.style.height = `${clamp(startHeight + dragData.dy, 30, max)}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => logOutput('dragEnd', dragData));

	return [slider, split];
});
