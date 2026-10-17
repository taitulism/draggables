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

	const notes = drag(board, {target: '.note:not(.locked)', handle: '.grip, .note:not(:has(.grip))', threshold})
		.on('grab', (dragData) => {
			startLeft = dragData.elm.offsetLeft;
			startTop = dragData.elm.offsetTop;

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			document.body.style.cursor = 'grab !important';

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			const maxX = board.clientWidth - dragData.elm.offsetWidth;
			const maxY = board.clientHeight - dragData.elm.offsetHeight;
			dragData.elm.style.left = `${Math.min(Math.max(startLeft + dragData.dx, 0), maxX)}px`;
			dragData.elm.style.top = `${Math.min(Math.max(startTop + dragData.dy, 0), maxY)}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			document.body.style.removeProperty('cursor');
			logOutput('dragEnd', dragData)
		});

	return [notes];
});
