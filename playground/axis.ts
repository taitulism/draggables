import {createDragger, clamp} from '../src';
import {logOutput, logCancel} from './shared';

const track = document.getElementById('track')!;
const value = document.getElementById('value')!;
const splitter = document.getElementById('splitter')!;
const topPane = document.getElementById('top-pane')!;
const panes = document.getElementById('panes')!;

let startThumbLeft = '';
let startValue = '';

createDragger(track, {target: '.thumb'})
	.on('grab', (dragState) => {
		startThumbLeft = dragState.elm.style.left;
		startValue = value.textContent!;

		logOutput('grab', dragState);
	})
	.on('dragging', (dragState) => {
		const max = track.clientWidth - dragState.elm.offsetWidth;
		dragState.elm.style.left = `${dragState.left}px`;
		value.textContent = String(Math.round(dragState.left / max * 100));

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => logOutput('dragEnd', dragState))
	.on('dragCancel', ({elm}) => {
		elm.style.left = startThumbLeft;
		value.textContent = startValue;

		logCancel(elm);
	});

let startHeight = 0;

createDragger(splitter)
	.on('grab', (dragState) => {
		startHeight = topPane.offsetHeight;

		logOutput('grab', dragState);
	})
	.on('dragging', (dragState) => {
		const max = panes.clientHeight - splitter.offsetHeight - 30;
		topPane.style.height = `${clamp(startHeight + dragState.dy, 30, max)}px`;

		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => logOutput('dragEnd', dragState))
	.on('dragCancel', ({elm}) => {
		topPane.style.height = `${startHeight}px`;

		logCancel(elm);
	});

