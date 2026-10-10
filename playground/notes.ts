/*
Known Issue:
Symptom: jittery movement when dragging by an element with a non-default cursor (e.g. the grip).
Cause: on fast movement the cursor slips off the grip and flickers between to pointers e.g. `grab` and `default`.
Fix: during a drag, cursor must be fixed. add a `dragging` class to <body>, with `body.dragging * { cursor: grab !important }`.
Note: `*` + `!important` overrides descendants' own cursors (links, buttons, etc.), which inheritance from <body> can't.
*/

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
		.on('dragStart', (ev) => {
			document.body.style.cursor = 'grab !important';

			logOutput('dragStart', ev);
		})
		.on('dragging', (ev) => {
			const maxX = board.clientWidth - ev.elm.offsetWidth;
			const maxY = board.clientHeight - ev.elm.offsetHeight;
			ev.elm.style.left = `${Math.min(Math.max(startLeft + ev.dx, 0), maxX)}px`;
			ev.elm.style.top = `${Math.min(Math.max(startTop + ev.dy, 0), maxY)}px`;

			logOutput('dragging', ev);
		})
		.on('dragEnd', (ev) => {
			document.body.style.removeProperty('cursor');
			logOutput('dragEnd', ev)
		});

	return [notes];
});
