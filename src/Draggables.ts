import type {ActiveDrag, DragEventHandler, DragEventName, DraggablesOptions, EventsObj} from './types';
import {
	createEventsObj,
	getDraggable,
	moveElm,
	createActiveDrag,
	pointerWithinPadding,
	isDisabled,
	DragzoneSelector,
	keepInBoundary,
} from './internals';

const MOUSE_DOWN = 'pointerdown';
const MOUSE_MOVE = 'pointermove';
const MOUSE_UP = 'pointerup';

export class Draggables {
	public isEnabled = true;
	private contextElm?: HTMLElement;
	private opts: DraggablesOptions;
	private activeDrag!: ActiveDrag;
	private events: EventsObj = createEventsObj();

	constructor (elm: HTMLElement, opts: DraggablesOptions) {
		this.opts = opts;
		this.contextElm = elm;

		elm.addEventListener(MOUSE_DOWN, this.onDragStart);
	}

	public destroy () {
		window.removeEventListener(MOUSE_MOVE, this.onDragging);
		window.removeEventListener(MOUSE_UP, this.onDrop);

		if (this.contextElm) {
			this.contextElm.removeEventListener(MOUSE_DOWN, this.onDragStart);
			this.contextElm = undefined;
		}

		this.events = createEventsObj();

		if (this.activeDrag?.elm) {
			delete this.activeDrag.elm.dataset.dragActive;

			// @ts-ignore
			this.activeDrag.elm = undefined;
		}

		this.disable();
	}

	public enable () {
		this.isEnabled = true;
	}

	public disable () {
		this.isEnabled = false;
	}

	public on (eventName: DragEventName, callback: DragEventHandler) {
		if (!(eventName in this.events)) throw new Error('No such event name');
		this.events[eventName] = callback;
		return this;
	}

	public off (eventName: DragEventName) {
		if (!(eventName in this.events)) throw new Error('No such event name');
		this.events[eventName] = undefined;
		return this;
	}

	private onDragStart = (ev: PointerEvent) => {
		if (!this.isEnabled || ev.button !== 0) return;

		const draggableElm = getDraggable(ev.target);
		if (!draggableElm) return;

		const box = draggableElm.getBoundingClientRect();
		if (pointerWithinPadding(box, ev, this.opts)) return;

		const dragzoneElm = (draggableElm.closest(DragzoneSelector) || document.body) as HTMLElement;

		this.activeDrag = createActiveDrag(draggableElm, box, ev, dragzoneElm);
		dragzoneElm.style.setProperty('user-select', 'none');

		window.addEventListener(MOUSE_MOVE, this.onDragging);
		window.addEventListener(MOUSE_UP, this.onDrop);

		this.events.grab?.({ev, elm: draggableElm, relPos: [0, 0]});
		ev.stopPropagation();
	};

	private onDragging = (ev: PointerEvent) => {
		const evTarget = ev.target as HTMLElement;

		if (!this.isEnabled || isDisabled(evTarget.dataset)) return;

		const {activeDrag, events} = this;
		const {axis, hasStarted, elm, prevX, prevY, mouseStartX, mouseStartY} = activeDrag;

		const mouseMoveX = ev.clientX - mouseStartX;
		const mouseMoveY = ev.clientY - mouseStartY;

		const elmMoveX = !axis || axis === 'x' ? mouseMoveX : 0;
		const elmMoveY = !axis || axis === 'y' ? mouseMoveY : 0;

		const [elmXInBoundary, elmYInBoundary] = keepInBoundary(elmMoveX, elmMoveY, activeDrag);

		const translateX = prevX + elmXInBoundary;
		const translateY = prevY + elmYInBoundary;

		if (hasStarted) {
			moveElm(elm, translateX, translateY);
			events.dragging?.({ev, elm, relPos: [translateX, translateY]});
		}
		else {
			const distance = Math.sqrt(mouseMoveX ** 2 + mouseMoveY ** 2);

			if (distance > 3) {
				moveElm(elm, translateX, translateY);
				activeDrag.hasStarted = true;
				events.dragStart?.({ev, elm, relPos: [translateX, translateY]});
			}
		}

		activeDrag.moveX = translateX;
		activeDrag.moveY = translateY;
	};

	private onDrop = (ev: PointerEvent) => {
		window.removeEventListener(MOUSE_MOVE, this.onDragging);
		window.removeEventListener(MOUSE_UP, this.onDrop);

		const {activeDrag} = this;
		const {hasStarted, dragzoneElm, elm, moveX, moveY, prevX, prevY} = activeDrag;

		if (hasStarted) {
			const translateX = moveX || prevX;
			const translateY = moveY || prevY;

			this.events.dragEnd?.({ev, elm, relPos: [translateX, translateY]});
		}

		dragzoneElm.style.removeProperty('user-select');
	};
}
