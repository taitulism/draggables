import type {DragPosition} from '../core/Drag';
import {clamp} from '../clamp';
import type {Active, BBox, DragEventName, DragInstanceOptions, Point, Resolved} from './types';

export const EVENT_NAMES: DragEventName[] = ['grab', 'dragStart', 'dragging', 'dragEnd', 'dragCancel'];

export const assertName = (name: string) => {
	if (!EVENT_NAMES.includes(name as DragEventName)) throw new Error('No such event name');
};

export const closestIn = (contextElm: HTMLElement, from: EventTarget | null, selector: string) => {
	if (!(from instanceof Element)) return null;

	const elm = from.closest<HTMLElement>(selector);

	return elm && contextElm.contains(elm) ? elm : null;
};

export const toResolver = (contextElm: HTMLElement, opts: DragInstanceOptions) => {
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

export const resolveContainer = (
	contextElm: HTMLElement,
	elm: HTMLElement,
	{container, target, bound}: DragInstanceOptions,
) => {
	if (typeof container === 'string') {
		const found = elm.parentElement?.closest<HTMLElement>(container) || null;

		// eslint-disable-next-line no-console
		if (!found) console.warn(`draggable: container "${container}" matched no ancestor`);

		return found;
	}

	if (container) return container;
	if (target) return contextElm;

	return bound === 'pointer' ? elm : null;
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
	bound: DragInstanceOptions['bound'],
): BBox => {
	const {clientX: x, clientY: y} = ev;

	if (bound === 'pointer') return {left: x, top: y, right: x, bottom: y};

	return elm.getBoundingClientRect();
};

export const clampMove = ({clampBox, containerBBox}: Active, pos: DragPosition): DragPosition => {
	if (!clampBox || !containerBBox) return pos;

	return {
		...pos,
		dx: clamp(pos.dx, containerBBox.left - clampBox.left, containerBBox.right - clampBox.right),
		dy: clamp(pos.dy, containerBBox.top - clampBox.top, containerBBox.bottom - clampBox.bottom),
	};
};

export const toContainerPoints = ({startX, startY, containerBBox}: Active, {dx, dy}: DragPosition) => {
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

export const toTranslate = ({startTranslate}: Active, {dx, dy}: DragPosition) => {
	if (!startTranslate) return {};
	return {tx: startTranslate.x + dx, ty: startTranslate.y + dy};
};
