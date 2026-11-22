import type {DragPosition} from '../core/Drag';
import {clamp} from '../utils/clamp';
import type {
	Active,
	BBox,
	DragEventName,
	DraggerOptions,
	Point,
	DragTarget,
	ScrollAnchor,
	ScrollDelta,
} from './types';

export const EVENT_NAMES: DragEventName[] = [
	'grab', 'dragStart', 'dragging', 'dragEnd', 'dragCancel', 'release',
];

export const assertName = (name: string) => {
	if (!EVENT_NAMES.includes(name as DragEventName)) throw new Error('No such event name');
};

export const closestIn = (contextElm: HTMLElement, from: EventTarget | null, selector: string) => {
	if (!(from instanceof Element)) return null;

	const elm = from.closest<HTMLElement>(selector);

	return elm && contextElm.contains(elm) ? elm : null;
};

export const createTargetResolver = (contextElm: HTMLElement, opts: DraggerOptions) => {
	const {target, grip, button = 0} = opts;

	return (ev: PointerEvent): DragTarget | null => {
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

export const resolveContainer = (
	contextElm: HTMLElement,
	elm: HTMLElement,
	{container}: DraggerOptions,
) => {
	if (typeof container === 'string') {
		return elm.parentElement?.closest<HTMLElement>(container) || contextElm;
	}

	return container || contextElm;
};

export const readTranslate = (elm: HTMLElement): Point => {
	const value = getComputedStyle(elm).translate;
	const [x = 0, y = 0] = value === 'none' ? [] : value.split(' ').map(parseFloat);

	return {x, y};
};

export const measureBBox = (box: HTMLElement): BBox => {
	const rect = box.getBoundingClientRect();
	const left = rect.left + box.clientLeft;
	const top = rect.top + box.clientTop;

	return {left, top, right: left + box.clientWidth, bottom: top + box.clientHeight};
};

export const measureClampBox = (
	elm: HTMLElement,
	ev: PointerEvent,
	clampMode: DraggerOptions['clamp'],
): BBox => {
	const {clientX: x, clientY: y} = ev;

	if (clampMode === 'pointer') return {left: x, top: y, right: x, bottom: y};

	return elm.getBoundingClientRect();
};

export const measureScrollAnchor = (box: HTMLElement): ScrollAnchor => {
	const {left, top} = box.getBoundingClientRect();

	return {left, top, scrollLeft: box.scrollLeft, scrollTop: box.scrollTop};
};

export const measureScrollDelta = ({containerElm, scrollAnchor}: Active): ScrollDelta => {
	const {left, top} = containerElm.getBoundingClientRect();

	return {
		shiftX: scrollAnchor.left - left,
		shiftY: scrollAnchor.top - top,
		ownX: containerElm.scrollLeft - scrollAnchor.scrollLeft,
		ownY: containerElm.scrollTop - scrollAnchor.scrollTop,
	};
};

export const compensateScroll = (
	pos: DragPosition,
	{shiftX, shiftY, ownX, ownY}: ScrollDelta,
): DragPosition => ({
	...pos,
	dx: pos.dx + shiftX + ownX,
	dy: pos.dy + shiftY + ownY,
});

export const measureAnchoredBBox = (activeDrag: Active): BBox => {
	const {shiftX, shiftY} = measureScrollDelta(activeDrag);
	const {left, top, right, bottom} = measureBBox(activeDrag.containerElm);

	return {left: left + shiftX, top: top + shiftY, right: right + shiftX, bottom: bottom + shiftY};
};

export const clampMove = (
	{clampBox, containerBBox}: Active,
	pos: DragPosition,
	{ownX, ownY}: ScrollDelta,
): DragPosition => {
	if (!clampBox) return pos;

	const minX = containerBBox.left - clampBox.left + ownX;
	const maxX = containerBBox.right - clampBox.right + ownX;
	const minY = containerBBox.top - clampBox.top + ownY;
	const maxY = containerBBox.bottom - clampBox.bottom + ownY;

	return {
		...pos,
		dx: clamp(pos.dx, minX, maxX),
		dy: clamp(pos.dy, minY, maxY),
	};
};

export const toContainerPoints = (
	{startX, startY, containerElm, containerBBox}: Active,
	{dx, dy}: DragPosition,
) => {
	const startContainerX = startX - containerBBox.left;
	const startContainerY = startY - containerBBox.top;
	return {
		container: containerElm,
		startX: startContainerX,
		startY: startContainerY,
		x: startContainerX + dx,
		y: startContainerY + dy,
	};
};

export const toTranslate = ({startTranslate}: Active, {dx, dy}: DragPosition) => {
	if (!startTranslate) return {};
	return {tx: startTranslate.x + dx, ty: startTranslate.y + dy};
};
