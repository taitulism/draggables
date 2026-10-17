import {Drag, type DragPosition} from '../core/Drag';

export type TargetResolver = (ev: PointerEvent) => HTMLElement | null

export type DragInstanceOptions = {
	target?: string | TargetResolver
	handle?: string
	button?: number
	threshold?: number
}

export type DragData = {
	ev: PointerEvent
	elm: HTMLElement
	handle: HTMLElement
	dx: number
	dy: number
	x: number
	y: number
}

export type DragEventHandler = (dragData: DragData) => void

type Handlers = {
	grab?: DragEventHandler
	dragStart?: DragEventHandler
	dragging?: DragEventHandler
	dragEnd?: DragEventHandler
}

export type DragEventName = keyof Handlers

const EVENT_NAMES: DragEventName[] = ['grab', 'dragStart', 'dragging', 'dragEnd'];

type Resolved = {elm: HTMLElement, handle: HTMLElement}

const closestIn = (contextElm: HTMLElement, from: EventTarget | null, selector: string) => {
	if (!(from instanceof Element)) return null;
	const elm = from.closest<HTMLElement>(selector);
	return elm && contextElm.contains(elm) ? elm : null;
};

const toResolver = (contextElm: HTMLElement, opts: DragInstanceOptions) => {
	const {target, handle, button = 0} = opts;

	return (ev: PointerEvent): Resolved | null => {
		if (ev.button !== button) return null;

		if (typeof target === 'function') {
			const elm = target(ev);
			return elm && {elm, handle: elm};
		}

		const handleElm = handle ? closestIn(contextElm, ev.target, handle) : null;
		if (handle && !handleElm) return null;

		const from = handleElm || ev.target;
		const elm = target ? closestIn(contextElm, from, target) : contextElm;
		if (!elm) return null;

		return {elm, handle: handleElm || elm};
	};
};

const assertName = (name: string) => {
	if (!EVENT_NAMES.includes(name as DragEventName)) throw new Error('No such event name');
};

export function drag (contextElm: HTMLElement, opts: DragInstanceOptions = {}) {
	const resolve = toResolver(contextElm, opts);
	const core = new Drag({threshold: opts.threshold});
	let handlers: Handlers = {};
	let active: Resolved | undefined;

	const unbind = () => {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		if (active) document.body.style.removeProperty('user-select');
		active = undefined;
	};

	const emit = (name: DragEventName, ev: PointerEvent, resolved: Resolved, pos: DragPosition) => {
		handlers[name]?.({ev, elm: resolved.elm, handle: resolved.handle, ...pos});
	};

	const onDown = (ev: PointerEvent) => {
		if (active) return;

		const resolved = resolve(ev);
		if (!resolved) return;

		const {elm, handle} = resolved;
		core.start(ev.clientX, ev.clientY);
		active = {elm, handle};
		document.body.style.setProperty('user-select', 'none');

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);

		emit('grab', ev, resolved, {dx: 0, dy: 0, x: ev.clientX, y: ev.clientY});
		ev.stopPropagation();
	};

	const onMove = (ev: PointerEvent) => {
		if (!active) return;

		const move = core.move(ev.clientX, ev.clientY);
		if (!move) return;

		const {isStart, ...pos} = move;
		emit(isStart ? 'dragStart' : 'dragging', ev, active, pos);
	};

	const onUp = (ev: PointerEvent) => {
		if (!active) return;

		const resolved = active;
		const pos = core.end(ev.clientX, ev.clientY);
		unbind();
		if (pos) emit('dragEnd', ev, resolved, pos);
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
