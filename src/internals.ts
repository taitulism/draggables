export type PointerEventHandler = (ev: PointerEvent) => void

export type EventsObj = {
	grab: Array<PointerEventHandler>,
	drop: Array<PointerEventHandler>,
	dragging: Array<PointerEventHandler>
};

export const createEventsObj = (): EventsObj => ({
	grab: [],
	drop: [],
	dragging: [],
});

export const moveBy = (elm: HTMLElement, x = 0, y = 0) => {
	const translate = `translate(${x}px, ${y}px)`;
	elm.style.transform = translate;
};

const DragRoleSelector = '[data-drag-role]';
const DraggableSelector = '[data-drag-role="draggable"]';
const GripSelector = '[data-drag-role="grip"]';

const getClosestDragRole = (elm: HTMLElement) => elm.closest(DragRoleSelector);
const getClosestDraggable = (elm: HTMLElement) => elm.closest(DraggableSelector);

const isDisabled = (dataset: DOMStringMap) =>
	'dragDisabled' in dataset && dataset.dragDisabled !== 'false';

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

		if (!draggable) {
			throw new Error(`A grip must be inside a draggable ${DraggableSelector}`);
		}

		if (draggable.dataset.dragDisabled === 'true') return;

		return draggable;
	}
};