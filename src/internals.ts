import type {ActiveDrag, DragAxis, DraggablesOptions, EventsObj} from './types';

export const DragzoneSelector = '[data-drag-zone]';
const DraggableSelector = '[data-drag-role="draggable"]';
const GripSelector = '[data-drag-role="grip"]';
const DragRoleSelector = `${DraggableSelector}, ${GripSelector}`;

const getClosestDragRole = (elm: HTMLElement) => elm.closest(DragRoleSelector);
const getClosestDraggable = (elm: HTMLElement) => elm.closest(DraggableSelector);

export const isDisabled = (dataset: DOMStringMap) =>
	'dragDisabled' in dataset && dataset.dragDisabled !== 'false';

export const createEventsObj = (): EventsObj => ({
	grab: undefined,
	dragStart: undefined,
	dragging: undefined,
	dragEnd: undefined,
});

export const moveElm = (elm: HTMLElement, x = 0, y = 0) => {
	elm.style.translate = `${x}px ${y}px`;
};

export const getDraggable = (evTarget: EventTarget | null) => {
	if (!evTarget || !(evTarget instanceof HTMLElement)) return;

	const dragRoleElm = getClosestDragRole(evTarget) as HTMLElement || undefined;
	if (!dragRoleElm) return;

	const {dragRole} = dragRoleElm.dataset;

	if (dragRole === 'draggable') {
		if (isDisabled(dragRoleElm.dataset)) return;

		const hasGrip = Boolean(dragRoleElm.querySelector(GripSelector));
		if (hasGrip) return;

		return dragRoleElm;
	}
	else if (dragRole === 'grip') {
		const draggable = getClosestDraggable(dragRoleElm) as HTMLElement;

		if (!draggable) throw new Error(`A grip must be inside a draggable ${DraggableSelector}`);
		if (draggable.dataset.dragDisabled === 'true') return;

		return draggable;
	}
};

export function pointerWithinPadding (
	box: DOMRect,
	ev: PointerEvent,
	opts: DraggablesOptions,
) {
	const {clientX, clientY} = ev;
	const {padding, cornerPadding} = opts;

	const offsetLeft = clientX - box.x;
	const offsetTop = clientY - box.y;
	const offsetRight = box.x + box.width - clientX;
	const offsetBottom = box.y + box.height - clientY;

	if (padding) { /* Sides */
		return (
			offsetTop <= padding ||
			offsetBottom <= padding ||
			offsetLeft <= padding ||
			offsetRight <= padding
		);
	}

	if (cornerPadding) { /* Corners */
		return (
			offsetLeft <= cornerPadding && offsetTop <= cornerPadding ||
			offsetRight <= cornerPadding && offsetTop <= cornerPadding ||
			offsetRight <= cornerPadding && offsetBottom <= cornerPadding ||
			offsetLeft <= cornerPadding && offsetBottom <= cornerPadding
		);
	}
}

export function createActiveDrag (
	elm: HTMLElement,
	box: DOMRect,
	ev: PointerEvent,
	dragzoneElm: HTMLElement,
): ActiveDrag {
	const {dragAxis} = elm.dataset;
	const activeDrag: ActiveDrag = {
		hasStarted: false,
		elm,
		box,
		dragzoneElm: dragzoneElm,
		dragzoneBox: dragzoneElm.getBoundingClientRect(),
		axis: dragAxis as DragAxis,
		mouseStartX: ev.clientX,
		mouseStartY: ev.clientY,
		moveX: 0,
		moveY: 0,
		prevX: 0,
		prevY: 0,
	};

	const {translate} = getComputedStyle(elm);

	if (translate && translate !== 'none') {
		const [x, y] = translate.split(' ');

		activeDrag.prevX = parseInt(x, 10) || 0;
		activeDrag.prevY = parseInt(y, 10) || 0;
	}

	return activeDrag;
}

export function keepInBoundary (elmMoveX: number, elmMoveY: number, activeDrag: ActiveDrag) {
	let xInBoundary = elmMoveX;
	let yInBoundary = elmMoveY;

	const {box, dragzoneBox} = activeDrag;

	if (elmMoveX) {
		if (box.x + elmMoveX < dragzoneBox.x) {
			xInBoundary = dragzoneBox.x - box.x;
		}
		else if (box.right + elmMoveX > dragzoneBox.right) {
			xInBoundary = dragzoneBox.right - box.right;
		}
	}

	if (elmMoveY) {
		if (box.y + elmMoveY < dragzoneBox.y) {
			yInBoundary = dragzoneBox.y - box.y;
		}
		else if (box.bottom + elmMoveY > dragzoneBox.bottom) {
			yInBoundary = dragzoneBox.bottom - box.bottom;
		}
	}

	return [xInBoundary, yInBoundary];
}
