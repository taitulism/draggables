import {createDragger, autoScroll, type DragState, type ReleaseData} from '../src';
import {logOutput, logCancel, lockCursor, unlockCursor} from './shared';

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

const restore = ({elm, startLeft, startTop}: ReleaseData) => {
	elm.style.left = `${startLeft}px`;
	elm.style.top = `${startTop}px`;
	logCancel(elm);
};

const grab = (dragState: DragState) => logOutput('grab', dragState);

createDragger(fnStage, {
	target: (ev) => {
		if (!(ev.target instanceof Element)) return null;
		return ev.target.closest<HTMLElement>('#fn-stage .box:not(.locked)');
	},
	clamp: 'element',
})
	.on('grab', grab)
	.on('dragging', move)
	.on('dragCancel', restore);

createDragger(cardsStage, {
	target: '.card',
	grip: '.grip',
	container: '.stage',
	clamp: 'element',
})
	.on('grab', grab)
	.on('dragStart', () => lockCursor())
	.on('dragging', move)
	.on('dragEnd', () => unlockCursor())
	.on('dragCancel', (data) => {
		unlockCursor();
		restore(data);
	});

const growScroller = autoScroll(document.body);

const grow = createDragger(growing, {
	target: '.box',
	clamp: 'element',
})
	.on('grab', grab)
	.on('dragging', (dragState) => {
		move(dragState);
		growScroller.update(dragState.ev.clientX, dragState.ev.clientY);
		const bottom = dragState.top + dragState.elm.offsetHeight;
		if (bottom > growing.clientHeight - 10) {
			growing.style.height = `${growing.clientHeight + 20}px`;
			grow.refreshContainerBounds().update();
		}
	})
	.on('dragCancel', restore)
	.on('release', () => growScroller.stop());

createDragger(nestedStage, {
	target: '#outer',
	clamp: 'element',
})
	.on('grab', grab)
	.on('dragging', move)
	.on('dragCancel', restore);

createDragger(outer, {
	target: '.box',
	clamp: 'element',
})
	.on('grab', (dragState) => {
		dragState.ev.stopPropagation();
		grab(dragState);
	})
	.on('dragging', move)
	.on('dragCancel', restore);
