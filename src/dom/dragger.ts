import {Drag, type DragPosition} from '../core/Drag';
import type {DragState, DragEventHandler, DragEventName, DraggerOptions, Handlers, Active} from './types';
import {
	assertName,
	clampMove,
	measureBBox,
	measureClampBox,
	measureAnchoredBBox,
	measureScrollAnchor,
	measureScrollDelta,
	compensateScroll,
	readTranslate,
	resolveContainer,
	toContainerPoints,
	createTargetResolver,
	toTranslate,
} from './helpers';

export function createDragger<const O extends DraggerOptions = object> (
	contextElm: HTMLElement,
	opts: O & DraggerOptions = {} as O,
) {
	const resolveTarget = createTargetResolver(contextElm, opts);
	const core = new Drag({threshold: opts.threshold});
	let handlers: Handlers<O> = {};
	let active: Active | undefined;

	const unbind = () => {
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		window.removeEventListener('pointercancel', onCancel);
		window.removeEventListener('keydown', onKey);
		window.removeEventListener('scroll', onScroll, true);
		active = undefined;
	};

	const emit = (name: DragEventName, ev: PointerEvent, activeDrag: Active, rawPos: DragPosition) => {
		const {elm, grip, startLeft, startTop} = activeDrag;
		const pos = compensateScroll(rawPos, activeDrag.scrollDelta);
		const move = clampMove(activeDrag, pos, activeDrag.scrollDelta);

		(handlers[name] as DragEventHandler<O> | undefined)?.({
			ev,
			elm,
			grip,
			dx: move.dx,
			dy: move.dy,
			rawDx: pos.dx,
			rawDy: pos.dy,
			left: startLeft + move.dx,
			top: startTop + move.dy,
			...toContainerPoints(activeDrag, move),
			...toTranslate(activeDrag, move),
		} as DragState<O>);
	};

	const onDown = (ev: PointerEvent) => {
		if (active) return;

		const dragTarget = resolveTarget(ev);
		if (!dragTarget) return;

		const {elm, grip} = dragTarget;
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
			clampBox: opts.clamp ? measureClampBox(elm, ev, opts.clamp) : null,
			containerElm,
			containerBBox: measureBBox(containerElm),
			scrollAnchor: measureScrollAnchor(containerElm),
			scrollDelta: {shiftX: 0, shiftY: 0, ownX: 0, ownY: 0},
			lastEv: ev,
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		if (opts.cancelOnEsc ?? true) window.addEventListener('keydown', onKey);
		window.addEventListener('scroll', onScroll, true);

		emit('grab', ev, active, {dx: 0, dy: 0, x: ev.clientX, y: ev.clientY});
	};

	const onMove = (ev: PointerEvent) => {
		if (!active || ev.pointerId !== active.pointerId) return;

		active.lastEv = ev;
		const move = core.move(ev.clientX, ev.clientY);
		if (!move) return;

		const {isStart, ...pos} = move;
		emit(isStart ? 'dragStart' : 'dragging', ev, active, pos);
	};

	const onUp = (ev: PointerEvent) => {
		if (!active || ev.pointerId !== active.pointerId) return;

		const activeDrag = active;
		const pos = core.end(ev.clientX, ev.clientY);
		unbind();
		if (pos) emit('dragEnd', ev, activeDrag, pos);
		handlers.release?.({elm: activeDrag.elm, grip: activeDrag.grip});
	};

	const onScroll = () => {
		if (!active) return;

		active.scrollDelta = measureScrollDelta(active);
		instance.update();
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
			if (active) active.containerBBox = measureAnchoredBBox(active);

			return instance;
		},

		update () {
			if (active) onMove(active.lastEv);

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
