/*
Known Issue:
Symptom: jittery movement when dragging by an element with a non-default cursor (e.g. the grip).
Cause: on fast movement the cursor slips off the grip and flickers between to pointers e.g. `grab` and `default`.
Fix: during a drag, cursor must be fixed. add a `dragging` class to <body>, with `body.dragging * { cursor: grab !important }`.
Note: `*` + `!important` overrides descendants' own cursors (links, buttons, etc.), which inheritance from <body> can't.
*/

import {drag, measureZones, hitZone, type Zone} from '../src';
import {mount, logOutput, logCancel, lockCursor, unlockCursor} from './shared';

const board = document.getElementById('board')!;
const tboard = document.getElementById('tboard')!;
const trash = board.querySelector<HTMLElement>('.trash')!;

mount((threshold) => {
	let start = {left: '', top: '', translate: ''};
	let zones: Zone[] = [];

	const notes = drag(board, {
		target: '.note:not(.locked)',
		grip: '.grip, .note:not(:has(.grip))',
		threshold,
	})
		.on('grab', (dragData) => {
			start = {...start, left: dragData.elm.style.left, top: dragData.elm.style.top};

			logOutput('grab', dragData);
		})
		.on('dragStart', (dragData) => {
			lockCursor();
			zones = measureZones('.trash');
			logOutput('dragStart', dragData);
		})
		.on('dragging', (dragData) => {
			dragData.elm.style.left = `${dragData.left}px`;
			dragData.elm.style.top = `${dragData.top}px`;
			trash.classList.toggle('over', hitZone(zones, dragData.x, dragData.y) === trash);

			logOutput('dragging', dragData);
		})
		.on('dragEnd', (dragData) => {
			unlockCursor();
			trash.classList.remove('over');
			if (hitZone(zones, dragData.x, dragData.y) === trash) dragData.elm.remove();
			logOutput('dragEnd', dragData)
		})
		.on('dragCancel', ({elm}) => {
			unlockCursor();
			trash.classList.remove('over');
			elm.style.left = start.left;
			elm.style.top = start.top;

			logCancel(elm);
		});

	// t = translate
	const tnotes = drag(tboard, {
		target: '.note',
		threshold,
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
