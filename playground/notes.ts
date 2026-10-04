import {drag} from '../src';
import {mount, logOutput} from './shared';

const board = document.getElementById('board')!;

mount((threshold) => {
	let startLeft = 0;
	let startTop = 0;

	const notes = drag(board, {threshold})
		.on('grab', (ev) => {
			startLeft = ev.elm.offsetLeft;
			startTop = ev.elm.offsetTop;

			logOutput('grab', ev);
		})
		.on('dragStart', (ev) => logOutput('dragStart', ev))
		.on('dragging', (ev) => {
			const maxX = board.clientWidth - ev.elm.offsetWidth;
			const maxY = board.clientHeight - ev.elm.offsetHeight;
			ev.elm.style.left = `${Math.min(Math.max(startLeft + ev.dx, 0), maxX)}px`;
			ev.elm.style.top = `${Math.min(Math.max(startTop + ev.dy, 0), maxY)}px`;

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => logOutput('dragEnd', ev));

	return [notes];
});
