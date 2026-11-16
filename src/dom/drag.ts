import {Drag, type DragPosition} from '../core/Drag';
import {clamp} from '../clamp';

export type TargetResolver = (ev: PointerEvent) => HTMLElement | null

export type DragInstanceOptions = {
	target?: string | TargetResolver
	grip?: string
	button?: number
	threshold?: number
	container?: HTMLElement | string
	bound?: 'element' | 'pointer'
	translate?: boolean
	cancelOnEsc?: boolean
}

type ContainerData = {
	containerX: number
	containerY: number
	startContainerX: number
	startContainerY: number
}

type TranslateData = {
	tx: number
	ty: number
}

type HasContainer = {container: HTMLElement | string} | {bound: 'pointer'}

export type DragData<O extends DragInstanceOptions = DragInstanceOptions> = {
	ev: PointerEvent
	elm: HTMLElement
	grip: HTMLElement
	dx: number
	dy: number
	x: number
	y: number
	left: number
	top: number
}
	& (O extends HasContainer ? ContainerData : Partial<ContainerData>)
	& (O extends {translate: true} ? TranslateData : Partial<TranslateData>)

export type DragEventHandler<O extends DragInstanceOptions = DragInstanceOptions> =
	(dragData: DragData<O>) => void

type Handlers<O extends DragInstanceOptions> = {
	grab?: DragEventHandler<O>
	dragStart?: DragEventHandler<O>
	dragging?: DragEventHandler<O>
	dragEnd?: DragEventHandler<O>
	dragCancel?: (data: Resolved) => void
}

export type DragEventName = keyof Handlers<DragInstanceOptions>

const EVENT_NAMES: DragEventName[] = ['grab', 'dragStart', 'dragging', 'dragEnd', 'dragCancel'];

type Resolved = {elm: HTMLElement, grip: HTMLElement}

type BBox = {left: number, top: number, right: number, bottom: number}

type Point = {x: number, y: number}

type Active = Resolved & {
	startX: number
	startY: number
	startLeft: number
	startTop: number
	startTranslate: Point | null
	clampBox: BBox | null
	containerElm: HTMLElement | null
	containerBBox: BBox | null
}

const closestIn = (contextElm: HTMLElement, from: EventTarget | null, selector: string) => {
	if (!(from instanceof Element)) return null;
	const elm = from.closest<HTMLElement>(selector);
	return elm && contextElm.contains(elm) ? elm : null;
};

const toResolver = (contextElm: HTMLElement, opts: DragInstanceOptions) => {
	const {target, grip, button = 0} = opts;

	return (ev: PointerEvent): Resolved | null => {
		if (ev.button !== button) return null;

		if (typeof target === 'function') {
			const elm = target(ev);
			return elm && {elm, grip: elm};
		}

		const gripElm = grip ? closestIn(contextElm, ev.target, grip) : null;
		if (grip && !gripElm) return null;

		const from = gripElm || ev.target;
		const elm = target ? closestIn(contextElm, from, target) : contextElm;
		if (!elm || (target && elm === contextElm)) return null;

		return {elm, grip: gripElm || elm};
	};
};

const resolveContainer = (elm: HTMLElement, {container, bound}: DragInstanceOptions) => {
	if (typeof container === 'string') {
		const found = elm.parentElement?.closest<HTMLElement>(container) || null;
		if (!found) console.warn(`draggable: container "${container}" matched no ancestor`);
		return found;
	}
	return container || (bound === 'pointer' ? elm : null);
};

const readTranslate = (elm: HTMLElement): Point => {
	const value = getComputedStyle(elm).translate;
	const [x = 0, y = 0] = value === 'none' ? [] : value.split(' ').map(parseFloat);
	return {x, y};
};

const measureBBox = (box: HTMLElement): BBox => {
	const rect = box.getBoundingClientRect();
	const left = rect.left + box.clientLeft;
	const top = rect.top + box.clientTop;
	return {left, top, right: left + box.clientWidth, bottom: top + box.clientHeight};
};

const measureClampBox = (elm: HTMLElement, ev: PointerEvent, bound: DragInstanceOptions['bound']): BBox => {
	const {clientX: x, clientY: y} = ev;
	if (bound === 'pointer') return {left: x, top: y, right: x, bottom: y};
	return elm.getBoundingClientRect();
};

const clampMove = ({clampBox, containerBBox}: Active, pos: DragPosition): DragPosition => {
	if (!clampBox || !containerBBox) return pos;

	return {
		...pos,
		dx: clamp(pos.dx, containerBBox.left - clampBox.left, containerBBox.right - clampBox.right),
		dy: clamp(pos.dy, containerBBox.top - clampBox.top, containerBBox.bottom - clampBox.bottom),
	};
};

const toContainerPoints = ({startX, startY, containerBBox}: Active, {dx, dy}: DragPosition) => {
	if (!containerBBox) return {};

	const startContainerX = startX - containerBBox.left;
	const startContainerY = startY - containerBBox.top;
	return {
		startContainerX,
		startContainerY,
		containerX: startContainerX + dx,
		containerY: startContainerY + dy,
	};
};

const toTranslate = ({startTranslate}: Active, {dx, dy}: DragPosition) => {
	if (!startTranslate) return {};
	return {tx: startTranslate.x + dx, ty: startTranslate.y + dy};
};

const assertName = (name: string) => {
	if (!EVENT_NAMES.includes(name as DragEventName)) throw new Error('No such event name');
};

export function drag<const O extends DragInstanceOptions = object> (
	contextElm: HTMLElement,
	opts: O & DragInstanceOptions = {} as O,
) {
	const resolve = toResolver(contextElm, opts);
	const core = new Drag({threshold: opts.threshold});
	let handlers: Handlers<O> = {};
	let active: Active | undefined;

	const unbind = () => {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		window.removeEventListener('pointercancel', onCancel);
		window.removeEventListener('keydown', onKey);
		if (active) document.body.style.removeProperty('user-select');
		active = undefined;
	};

	const emit = (name: DragEventName, ev: PointerEvent, resolved: Active, pos: DragPosition) => {
		const {elm, grip, startLeft, startTop} = resolved;
		const move = clampMove(resolved, pos);

		(handlers[name] as DragEventHandler<O> | undefined)?.({
			ev,
			elm,
			grip,
			...move,
			left: startLeft + move.dx,
			top: startTop + move.dy,
			...toContainerPoints(resolved, move),
			...toTranslate(resolved, move),
		} as DragData<O>);
	};

	const onDown = (ev: PointerEvent) => {
		if (active) return;

		const resolved = resolve(ev);
		if (!resolved) return;

		const {elm, grip} = resolved;
		core.start(ev.clientX, ev.clientY);
		const containerElm = resolveContainer(elm, opts);
		active = {
			elm,
			grip,
			startX: ev.clientX,
			startY: ev.clientY,
			startLeft: elm.offsetLeft,
			startTop: elm.offsetTop,
			startTranslate: opts.translate ? readTranslate(elm) : null,
			clampBox: containerElm && measureClampBox(elm, ev, opts.bound),
			containerElm,
			containerBBox: containerElm && measureBBox(containerElm),
		};
		document.body.style.setProperty('user-select', 'none');

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		if (opts.cancelOnEsc ?? true) window.addEventListener('keydown', onKey);

		emit('grab', ev, active, {dx: 0, dy: 0, x: ev.clientX, y: ev.clientY});
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

	const onCancel = () => {
		instance.cancelDrag();
	};

	const onKey = (ev: KeyboardEvent) => {
		if (ev.key === 'Escape') instance.cancelDrag();
	};

	contextElm.addEventListener('pointerdown', onDown);

	const instance = {
		on<N extends DragEventName> (name: N, handler: NonNullable<Handlers<O>[N]>) {
			assertName(name);
			handlers[name] = handler;
			return instance;
		},

		off (name: DragEventName) {
			assertName(name);
			handlers[name] = undefined;
			return instance;
		},

		refreshContainerBounds () {
			if (active?.containerElm) active.containerBBox = measureBBox(active.containerElm);
			return instance;
		},

		cancelDrag () {
			if (!active) return instance;
			const {elm, grip} = active;
			const wasDragging = core.cancel();
			unbind();
			if (wasDragging) handlers.dragCancel?.({elm, grip});
			return instance;
		},

		destroy () {
			instance.cancelDrag();
			contextElm.removeEventListener('pointerdown', onDown);
			handlers = {};
		},
	};

	return instance;
}

export type DragInstance = ReturnType<typeof drag>
