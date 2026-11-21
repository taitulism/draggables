import {Drag, type DragPosition} from '../core/Drag';
import type {DragState, DragEventHandler, DragEventName, DraggerOptions, Handlers, Active} from './types';
import {
	assertName,
	clampMove,
	measureBBox,
	measureClampBox,
	readTranslate,
	resolveContainer,
	toContainerPoints,
	toResolver,
	toTranslate,
} from './helpers';

export function createDragger<const O extends DraggerOptions = object> (
	contextElm: HTMLElement,
	opts: O & DraggerOptions = {} as O,
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
		} as DragState<O>);
	};

	const onDown = (ev: PointerEvent) => {
		if (active) return;

		const resolved = resolve(ev);
		if (!resolved) return;

		const {elm, grip} = resolved;
		core.start(ev.clientX, ev.clientY);
		const containerElm = resolveContainer(contextElm, elm, opts);
		active = {
			elm,
			grip,
			pointerId: ev.pointerId,
			startX: ev.clientX,
			startY: ev.clientY,
			startLeft: elm.offsetLeft,
			startTop: elm.offsetTop,
			startTranslate: opts.translate ? readTranslate(elm) : null,
			clampBox: containerElm && measureClampBox(elm, ev, opts.bound),
			containerElm,
			containerBBox: containerElm && measureBBox(containerElm),
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		if (opts.cancelOnEsc ?? true) window.addEventListener('keydown', onKey);

		emit('grab', ev, active, {dx: 0, dy: 0, x: ev.clientX, y: ev.clientY});
	};

	const onMove = (ev: PointerEvent) => {
		if (!active || ev.pointerId !== active.pointerId) return;

		const move = core.move(ev.clientX, ev.clientY);
		if (!move) return;

		const {isStart, ...pos} = move;
		emit(isStart ? 'dragStart' : 'dragging', ev, active, pos);
	};

	const onUp = (ev: PointerEvent) => {
		if (!active || ev.pointerId !== active.pointerId) return;

		const resolved = active;
		const pos = core.end(ev.clientX, ev.clientY);
		unbind();
		if (pos) emit('dragEnd', ev, resolved, pos);
		handlers.release?.({elm: resolved.elm, grip: resolved.grip});
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
			handlers.release?.({elm, grip});

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

export type Dragger = ReturnType<typeof createDragger>
