export type Edges = {top: number, right: number, bottom: number, left: number}

type Rect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>

export function getEdgeProximity (container: HTMLElement, rect: Rect): Edges;
export function getEdgeProximity (container: HTMLElement, x: number, y: number): Edges;
export function getEdgeProximity (container: HTMLElement, rectOrX: Rect | number, y?: number): Edges {
	const rect = typeof rectOrX === 'number'
		? {left: rectOrX, right: rectOrX, top: y!, bottom: y!}
		: rectOrX;
	const box = container.getBoundingClientRect();
	const left = box.left + container.clientLeft;
	const top = box.top + container.clientTop;

	return {
		top: rect.top - top,
		right: left + container.clientWidth - rect.right,
		bottom: top + container.clientHeight - rect.bottom,
		left: rect.left - left,
	};
}
