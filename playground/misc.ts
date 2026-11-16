import {drag, type DragData} from '../src';
import {mount, logOutput, logCancel, lockCursor, unlockCursor} from './shared';

const fnStage = document.getElementById('fn-stage')!;
const cardsStage = document.getElementById('cards-stage')!;
const growing = document.getElementById('growing')!;
const nestedStage = document.getElementById('nested-stage')!;
const outer = document.getElementById('outer')!;

const move = (dragData: DragData) => {
	dragData.elm.style.left = `${dragData.left}px`;
	dragData.elm.style.top = `${dragData.top}px`;
	logOutput('dragging', dragData);
};

const restore = (elm: HTMLElement, start: {left: string, top: string}) => {
	elm.style.left = start.left;
	elm.style.top = start.top;
	logCancel(elm);
};

mount((threshold) => {
	let start = {left: '', top: ''};
	const grab = (dragData: DragData) => {
		start = {left: dragData.elm.style.left, top: dragData.elm.style.top};
		logOutput('grab', dragData);
	};

	const fn = drag(fnStage, {
		threshold,
		container: fnStage,
		target: (ev) => {
			if (!(ev.target instanceof Element)) return null;
			return ev.target.closest<HTMLElement>('#fn-stage .box:not(.locked)');
		},
	})
		.on('grab', grab)
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	const cards = drag(cardsStage, {
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

	const grow = drag(growing, {
		threshold,
		target: '.box',
		container: growing,
	})
		.on('grab', grab)
		.on('dragging', (dragData) => {
			move(dragData);
			const bottom = dragData.top + dragData.elm.offsetHeight;
			if (bottom > growing.clientHeight - 10) {
				growing.style.height = `${growing.clientHeight + 20}px`;
				grow.refreshContainerBounds();
			}
		})
		.on('dragCancel', ({elm}) => restore(elm, start));

	const outerDrag = drag(nestedStage, {
		threshold,
		target: '#outer',
		container: nestedStage,
	})
		.on('grab', grab)
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	const innerDrag = drag(outer, {
		threshold,
		target: '.box',
		container: outer,
	})
		.on('grab', grab)
		.on('dragging', move)
		.on('dragCancel', ({elm}) => restore(elm, start));

	return [fn, cards, grow, outerDrag, innerDrag];
});
