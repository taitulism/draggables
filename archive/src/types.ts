export type DragAxis = 'x' | 'y'
export type DragEventName = 'grab' | 'dragStart' | 'dragging' | 'dragEnd'
export type Point = [number, number]

export type DraggablesOptions = {
	padding?: number
	cornerPadding?: number
}

export type DragEventWrapper = {
	ev: PointerEvent
	elm: HTMLElement
	relPos: Point
}

export type ActiveDrag = {
	hasStarted: boolean
	elm: HTMLElement
	dragzoneElm: HTMLElement
	box: DOMRect
	dragzoneBox: DOMRect
	axis?: DragAxis
	mouseStartX: number
	mouseStartY: number
	moveX: number
	moveY: number
	prevX: number
	prevY: number
}

export type DragEventHandler = (dragEvent: DragEventWrapper) => void
export type EventsObj = {
	[key in DragEventName]: DragEventHandler | undefined
};
