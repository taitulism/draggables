import {Drag, type DragPosition} from '../core/Drag';

export type TargetResolver = (ev: PointerEvent) => HTMLElement | null

export type DragInstanceOptions = {
	target?: string | TargetResolver
	threshold?: number
}

export type DraggableEvent = {
	ev: PointerEvent
	elm: HTMLElement
	dx: number
	dy: number
	x: number
	y: number
}

export type DragEventHandler = (ev: DraggableEvent) => void

type Handlers = {
	grab?: DragEventHandler
	dragStart?: DragEventHandler
	dragging?: DragEventHandler
	dragEnd?: DragEventHandler
}

export type DragEventName = keyof Handlers

const EVENT_NAMES: DragEventName[] = ['grab', 'dragStart', 'dragging', 'dragEnd'];
const DragzoneSelector = '[data-drag-zone]';
const DraggableSelector = '[data-drag-role="draggable"]';
const GripSelector = '[data-drag-role="grip"]';
const DragRoleSelector = `${DraggableSelector}, ${GripSelector}`;

const isDisabled = (elm: HTMLElement) =>
	'dragDisabled' in elm.dataset && elm.dataset.dragDisabled !== 'false';

const resolveRole = (roleElm: HTMLElement) => {
	if (roleElm.dataset.dragRole === 'draggable') {
		if (isDisabled(roleElm)) return null;
		if (roleElm.querySelector(GripSelector)) return null;
		return roleElm;
	}

	const draggable = roleElm.closest<HTMLElement>(DraggableSelector);
	if (!draggable) throw new Error(`A grip must be inside a draggable ${DraggableSelector}`);
	return isDisabled(draggable) ? null : draggable;
};

const toResolver = (contextElm: HTMLElement, target?: string | TargetResolver): TargetResolver => {
	if (typeof target === 'function') return target;

	return (ev) => {
		if (ev.button !== 0) return null;
		if (!(ev.target instanceof Element)) return null;

		const elm = ev.target.closest<HTMLElement>(target || DragRoleSelector);
		if (!elm || !contextElm.contains(elm)) return null;

		return target ? elm : resolveRole(elm);
	};
};

const assertName = (name: string) => {
	if (!EVENT_NAMES.includes(name as DragEventName)) throw new Error('No such event name');
};

export function drag (contextElm: HTMLElement, opts: DragInstanceOptions = {}) {
	const resolve = toResolver(contextElm, opts.target);
	let handlers: Handlers = {};
	const core = new Drag({threshold: opts.threshold});
	let active: {elm: HTMLElement, dragzoneElm: HTMLElement} | undefined;

	const unbind = () => {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		active?.dragzoneElm.style.removeProperty('user-select');
		active = undefined;
	};

	const emit = (name: DragEventName, ev: PointerEvent, elm: HTMLElement, pos: DragPosition) => {
		handlers[name]?.({ev, elm, ...pos});
	};

	const onDown = (ev: PointerEvent) => {
		if (active) return;

		const elm = resolve(ev);
		if (!elm) return;

		const dragzoneElm = elm.closest<HTMLElement>(DragzoneSelector) || document.body;
		core.start(ev.clientX, ev.clientY);
		active = {elm, dragzoneElm};
		dragzoneElm.style.setProperty('user-select', 'none');

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);

		handlers.grab?.({ev, elm, dx: 0, dy: 0, x: ev.clientX, y: ev.clientY});
		ev.stopPropagation();
	};

	const onMove = (ev: PointerEvent) => {
		if (!active) return;

		const move = core.move(ev.clientX, ev.clientY);
		if (!move) return;

		const {isStart, ...pos} = move;
		emit(isStart ? 'dragStart' : 'dragging', ev, active.elm, pos);
	};

	const onUp = (ev: PointerEvent) => {
		if (!active) return;

		const {elm} = active;
		const pos = core.end(ev.clientX, ev.clientY);
		unbind();
		if (pos) emit('dragEnd', ev, elm, pos);
	};

	contextElm.addEventListener('pointerdown', onDown);

	const instance = {
		on (name: DragEventName, handler: DragEventHandler) {
			assertName(name);
			handlers[name] = handler;
			return instance;
		},

		off (name: DragEventName) {
			assertName(name);
			handlers[name] = undefined;
			return instance;
		},

		destroy () {
			unbind();
			contextElm.removeEventListener('pointerdown', onDown);
			handlers = {};
		},
	};

	return instance;
}

export type DragInstance = ReturnType<typeof drag>
