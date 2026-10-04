import {drag} from '../src';
import {mount, logOutput} from './shared';

const track = document.getElementById('track')!;
const value = document.getElementById('value')!;
const splitter = document.getElementById('splitter')!;
const topPane = document.getElementById('top-pane')!;
const panes = document.getElementById('panes')!;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

mount((threshold) => {
	let startLeft = 0;

	const slider = drag(track, {target: '.thumb', threshold})
		.on('grab', (ev) => {
			startLeft = ev.elm.offsetLeft;

			logOutput('grab', ev);
		})
		.on('dragging', (ev) => {
			const max = track.clientWidth - ev.elm.offsetWidth;
			const left = clamp(startLeft + ev.dx, 0, max);
			ev.elm.style.left = `${left}px`;
			value.textContent = String(Math.round(left / max * 100));

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => logOutput('dragEnd', ev));

	let startHeight = 0;

	const split = drag(splitter, {target: (ev) => ev.button === 0 ? splitter : null, threshold})
		.on('grab', (ev) => {
			startHeight = topPane.offsetHeight;

			logOutput('grab', ev);
		})
		.on('dragging', (ev) => {
			const max = panes.clientHeight - splitter.offsetHeight - 30;
			topPane.style.height = `${clamp(startHeight + ev.dy, 30, max)}px`;

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => logOutput('dragEnd', ev));

	return [slider, split];
});
