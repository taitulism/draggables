/*
Known Issue:
Symptom: jittery movement when dragging by an element with a non-default cursor (e.g. the grip).
Cause: on fast movement the cursor slips off the grip and flickers between to pointers e.g. `grab` and `default`.
Fix: during a drag, cursor must be fixed. add a `dragging` class to <body>, with `body.dragging * { cursor: grab !important }`.
Note: `*` + `!important` overrides descendants' own cursors (links, buttons, etc.), which inheritance from <body> can't.
*/

import {drag} from '../src';
import {mount, logOutput, logCancel} from './shared';

const board = document.getElementById('board')!;
const tboard = document.getElementById('tboard')!;

mount((threshold) => {
	let start = {left: '', top: '', translate: ''};

	const notes = drag(board, {
		target: '.note:not(.locked)',
		handle: '.grip, .note:not(:has(.grip))',
		threshold,
		container: board,
	})
		.on('grab', (dragData) => {
			start = {...start, left: dragData.elm.style.left, top: dragData.elm.style.top};

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			document.body.style.cursor = 'grab !important';

			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			dragData.elm.style.left = `${dragData.left}px`;
			dragData.elm.style.top = `${dragData.top}px`;

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			document.body.style.removeProperty('cursor');
			logOutput('dragEnd', dragData)
		})
		.on('dragCancel', ({elm}) => {
			document.body.style.removeProperty('cursor');
			elm.style.left = start.left;
			elm.style.top = start.top;

			logCancel(elm);
		});

	// t = translate
	const tnotes = drag(tboard, {
		target: '.note',
		threshold,
		container: tboard,
		translate: true,
	})
		.on('grab', (dragData) => {
			start = {...start, translate: dragData.elm.style.translate};
		})
		.on('dragging', (dragData) => {
			dragData.elm.style.translate = `${dragData.tx}px ${dragData.ty}px`;

			logOutput('dragging', dragData);
		})
		.on('dragCancel', ({elm}) => {
			elm.style.translate = start.translate;

			logCancel(elm);
		});

	return [notes, tnotes];
});
