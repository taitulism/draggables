/*
Known Issue:
Symptom: jittery movement when dragging by an element with a non-default cursor (e.g. the grip).
Cause: on fast movement the cursor slips off the grip and flickers between to pointers e.g. `grab` and `default`.
Fix: during a drag, cursor must be fixed. add a `dragging` class to <body>, with `body.dragging * { cursor: grab !important }`.
Note: `*` + `!important` overrides descendants' own cursors (links, buttons, etc.), which inheritance from <body> can't.
*/

import {createDragger, measureZones, hitZone, type Zone} from '../src';
import {mount, logOutput, logCancel, lockCursor, unlockCursor} from './shared';

const board = document.getElementById('board')!;
const tboard = document.getElementById('tboard')!;
const trash = board.querySelector<HTMLElement>('.trash')!;

mount((threshold) => {
	let start = {left: '', top: '', translate: ''};
	let zones: Zone[] = [];

	const notes = createDragger(board, {
		target: '.note:not(.locked)',
		grip: '.grip, .note:not(:has(.grip))',
		threshold,
	})
		.on('grab', (dragState) => {
			start = {...start, left: dragState.elm.style.left, top: dragState.elm.style.top};

			logOutput('grab', dragState);
		})
		.on('dragStart', (dragState) => {
			lockCursor();
			zones = measureZones('.trash');
			logOutput('dragStart', dragState);
		})
		.on('dragging', (dragState) => {
			dragState.elm.style.left = `${dragState.left}px`;
			dragState.elm.style.top = `${dragState.top}px`;
			trash.classList.toggle('over', hitZone(zones, dragState.x, dragState.y) === trash);

			logOutput('dragging', dragState);
		})
		.on('dragEnd', (dragState) => {
			unlockCursor();
			trash.classList.remove('over');
			if (hitZone(zones, dragState.x, dragState.y) === trash) dragState.elm.remove();
			logOutput('dragEnd', dragState)
		})
		.on('dragCancel', ({elm}) => {
			unlockCursor();
			trash.classList.remove('over');
			elm.style.left = start.left;
			elm.style.top = start.top;

			logCancel(elm);
		});

	// t = translate
	const tnotes = createDragger(tboard, {
		target: '.note',
		threshold,
		translate: true,
	})
		.on('grab', (dragState) => {
			start = {...start, translate: dragState.elm.style.translate};
		})
		.on('dragging', (dragState) => {
			dragState.elm.style.translate = `${dragState.tx}px ${dragState.ty}px`;

			logOutput('dragging', dragState);
		})
		.on('dragCancel', ({elm}) => {
			elm.style.translate = start.translate;

			logCancel(elm);
		});

	return [notes, tnotes];
});
