import type {ActiveDrag, DragEventHandler, DragEventName, DraggablesOptions, EventsObj} from './types';
import {
	createEventsObj,
	getDraggable,
	moveElm,
	createActiveDrag,
	pointerWithinPadding,
	isDisabled,
	drag,
	DragzoneSelector,
} from './internals';

const MOUSE_DOWN = 'pointerdown';
const MOUSE_MOVE = 'pointermove';
const MOUSE_UP = 'pointerup';

const ctxElms = new WeakSet();
const SameCtxErr = 'Context element already bound and cannot be bound twice. Destroy the previous one first.';

export class Draggables {
	public isEnabled = true;
	private contextElm?: HTMLElement;
	private opts: DraggablesOptions;
	private activeDrag!: ActiveDrag;
	private events: EventsObj = createEventsObj();

	constructor (elm: HTMLElement, opts: DraggablesOptions) {
		if (ctxElms.has(elm)) throw new Error(SameCtxErr);

		ctxElms.add(elm);

		this.opts = opts;
		this.contextElm = elm;

		elm.addEventListener(MOUSE_DOWN, this.onDragStart);
	}

	public destroy () {
		window.removeEventListener(MOUSE_MOVE, this.onDragging);
		window.removeEventListener(MOUSE_UP, this.onDrop);

		if (this.contextElm) {
			ctxElms.delete(this.contextElm);
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
		this.contextElm!.style.userSelect = 'none';

		draggableElm.dataset.dragActive = ''; // Key only

		window.addEventListener(MOUSE_MOVE, this.onDragging);
		window.addEventListener(MOUSE_UP, this.onDrop);

		this.events.grab?.({ev, elm: draggableElm, relPos: [0, 0]});
		ev.stopPropagation();
	};

	private onDragging = (ev: PointerEvent) => {
		const evTarget = ev.target as HTMLElement;

		if (!this.isEnabled || isDisabled(evTarget.dataset)) return;

		const {activeDrag, events} = this;
		const {hasStarted, elm, prevX, prevY} = activeDrag;
		const [moveFromPrevX, moveFromPrevY] = drag(activeDrag, ev);
		const elmMoveX = moveFromPrevX + prevX;
		const elmMoveY = moveFromPrevY + prevY;

		moveElm(elm, elmMoveX, elmMoveY);

		activeDrag.moveX = elmMoveX;
		activeDrag.moveY = elmMoveY;

		// threshold
		// const movedX = Math.abs(ev.clientX - activeDrag.mouseStartX);
		// const movedY = Math.abs(ev.clientY - activeDrag.mouseStartY);
		if (!hasStarted) {
			// && movedX + movedY < 20
			activeDrag.hasStarted = true;
			events.dragStart?.({ev, elm, relPos: [elmMoveX, elmMoveY]});
			// return;
		}
		else {
			events.dragging?.({ev, elm, relPos: [elmMoveX, elmMoveY]});
		}
	};

	private onDrop = (ev: PointerEvent) => {
		window.removeEventListener(MOUSE_MOVE, this.onDragging);
		window.removeEventListener(MOUSE_UP, this.onDrop);

		const {activeDrag} = this;
		const {hasStarted, elm, moveX, moveY, prevX, prevY} = activeDrag;

		if (hasStarted) {
			const elmMoveX = moveX || prevX;
			const elmMoveY = moveY || prevY;
			elm.dataset.dragPosition = `${elmMoveX},${elmMoveY}`;
			this.events.dragEnd?.({ev, elm, relPos: [elmMoveX, elmMoveY]});
		}

		delete elm.dataset.dragActive;
		this.contextElm!.style.userSelect = '';
	};
}
