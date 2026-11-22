/*
Known Issue:
Symptom: jittery movement when dragging by an element with a non-default cursor (e.g. the grip).
Cause: on fast movement the cursor slips off the grip and flickers between to pointers e.g. `grab` and `default`.
Fix: during a drag, cursor must be fixed. add a `dragging` class to <body>, with `body.dragging * { cursor: grab !important }`.
Note: `*` + `!important` overrides descendants' own cursors (links, buttons, etc.), which inheritance from <body> can't.
*/

import {createDragger, measureZones, hitZone, getEdgeProximity, type Zone, type DragState} from '../src';
import {logOutput, logCancel, lockCursor, unlockCursor} from './shared';

const board = document.getElementById('board')!;
const tboard = document.getElementById('tboard')!;
const trash = board.querySelector<HTMLElement>('.trash')!;
const bound = document.getElementById('bound') as HTMLSelectElement;

const NEAR_EDGE = 10;

const markEdges = ({elm, ev}: DragState) => {
	const edges = bound.value === 'pointer'
		? getEdgeProximity(board, ev.clientX, ev.clientY)
		: getEdgeProximity(board, elm.getBoundingClientRect());

	for (const [edge, distance] of Object.entries(edges)) {
		board.classList.toggle(`near-${edge}`, distance <= NEAR_EDGE);
	}
};

const clearEdges = () => board.classList.remove('near-top', 'near-right', 'near-bottom', 'near-left');

let zones: Zone[] = [];

const createNotes = () => createDragger(board, {
	target: '.note:not(.locked)',
	grip: '.grip, .note:not(:has(.grip))',
	clamp: bound.value as 'element' | 'pointer',
})
	.on('grab', (dragState) => logOutput('grab', dragState))
	.on('dragStart', (dragState) => {
		lockCursor();
		zones = measureZones('.trash');
		logOutput('dragStart', dragState);
	})
	.on('dragging', (dragState) => {
		dragState.elm.style.left = `${dragState.left}px`;
		dragState.elm.style.top = `${dragState.top}px`;

		const zone = hitZone(zones, dragState.ev.clientX, dragState.ev.clientY);
		trash.classList.toggle('over', zone === trash);

		markEdges(dragState);
		logOutput('dragging', dragState);
	})
	.on('dragEnd', (dragState) => {
		unlockCursor();
		trash.classList.remove('over');
		clearEdges();
		
		const zone = hitZone(zones, dragState.ev.clientX, dragState.ev.clientY);
		if (zone === trash) dragState.elm.remove();
		
		logOutput('dragEnd', dragState)
	})
	.on('dragCancel', ({elm, startLeft, startTop}) => {
		unlockCursor();
		trash.classList.remove('over');
		clearEdges();
		elm.style.left = `${startLeft}px`;
		elm.style.top = `${startTop}px`;

		logCancel(elm);
	});

let notes = createNotes();

bound.addEventListener('change', () => {
	notes.destroy();
	notes = createNotes();
});

// t = translate
createDragger(tboard, {
	target: '.note',
	clamp: 'element',
	translate: true,
})
	.on('dragging', (dragState) => {
		dragState.elm.style.translate = `${dragState.tx}px ${dragState.ty}px`;

		logOutput('dragging', dragState);
	})
	.on('dragCancel', ({elm, startTx, startTy}) => {
		elm.style.translate = `${startTx}px ${startTy}px`;

		logCancel(elm);
	});
