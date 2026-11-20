import {createDragger, type DragState} from '../src';
import {mount, logOutput, logCancel, lockCursor, unlockCursor} from './shared';

const fnStage = document.getElementById('fn-stage')!;
const cardsStage = document.getElementById('cards-stage')!;
const growing = document.getElementById('growing')!;
const nestedStage = document.getElementById('nested-stage')!;
const outer = document.getElementById('outer')!;

const move = (dragState: DragState) => {
	dragState.elm.style.left = `${dragState.left}px`;
	dragState.elm.style.top = `${dragState.top}px`;
	logOutput('dragging', dragState);
};

const restore = (elm: HTMLElement, start: {left: string, top: string}) => {
	elm.style.left = start.left;
	elm.style.top = start.top;
	logCancel(elm);
};

mount((threshold) => {
	let start = {left: '', top: ''};
	const grab = (dragState: DragState) => {
		start = {left: dragState.elm.style.left, top: dragState.elm.style.top};
		logOutput('grab', dragState);
	};

	const fn = createDragger(fnStage, {
		threshold,
		target: (ev) => {
			if (!(ev.target instanceof Element)) return null;
			return ev.target.closest<HTMLElement>('#fn-stage .box:not(.locked)');
		},
	})
		.on('grab', grab)
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	const cards = createDragger(cardsStage, {
		threshold,
		target: '.card',
		grip: '.grip',
		container: '.stage',
	})
		.on('grab', grab)
		.on('dragStart', () => lockCursor())
		.on('dragging', move)
		.on('dragEnd', () => unlockCursor())
		.on('dragCancel', ({elm}) => {
			unlockCursor();
			restore(elm, start);
		});

	const grow = createDragger(growing, {
		threshold,
		target: '.box',
	})
		.on('grab', grab)
		.on('dragging', (dragState) => {
			move(dragState);
			const bottom = dragState.top + dragState.elm.offsetHeight;
			if (bottom > growing.clientHeight - 10) {
				growing.style.height = `${growing.clientHeight + 20}px`;
				grow.refreshContainerBounds();
			}
		})
		.on('dragCancel', ({elm}) => restore(elm, start));

	const outerDrag = createDragger(nestedStage, {
		threshold,
		target: '#outer',
	})
		.on('grab', grab)
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	const innerDrag = createDragger(outer, {
		threshold,
		target: '.box',
	})
		.on('grab', (dragState) => {
			dragState.ev.stopPropagation();
			grab(dragState);
		})
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	return [fn, cards, grow, outerDrag, innerDrag];
});
