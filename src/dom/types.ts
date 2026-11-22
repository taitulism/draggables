export type TargetResolver = (ev: PointerEvent) => HTMLElement | null

export type DraggerOptions = {
	target?: string | TargetResolver
	grip?: string
	button?: number
	threshold?: number
	container?: HTMLElement | string
	clamp?: 'element' | 'pointer'
	translate?: boolean
	cancelOnEsc?: boolean
}

type TranslateData = {
	tx: number
	ty: number
}

export type DragState<O extends DraggerOptions = DraggerOptions> = {
	ev: PointerEvent
	elm: HTMLElement
	grip: HTMLElement
	container: HTMLElement
	dx: number
	dy: number
	rawDx: number
	rawDy: number
	x: number
	y: number
	startX: number
	startY: number
	left: number
	top: number
}
	& (O extends {translate: true} ? TranslateData : Partial<TranslateData>)

export type DragEventHandler<O extends DraggerOptions = DraggerOptions> =
	(dragState: DragState<O>) => void

export type Handlers<O extends DraggerOptions> = {
	grab?: DragEventHandler<O>
	dragStart?: DragEventHandler<O>
	dragging?: DragEventHandler<O>
	dragEnd?: DragEventHandler<O>
	dragCancel?: (data: ReleaseData<O>) => void
	release?: (data: ReleaseData<O>) => void
}

type StartTranslateData = {
	startTx: number
	startTy: number
}

export type ReleaseData<O extends DraggerOptions = DraggerOptions> = DragTarget & {
	startLeft: number
	startTop: number
}
	& (O extends {translate: true} ? StartTranslateData : Partial<StartTranslateData>)

export type DragEventName = keyof Handlers<DraggerOptions>

export type DragTarget = {elm: HTMLElement, grip: HTMLElement}

export type BBox = {left: number, top: number, right: number, bottom: number}

export type Point = {x: number, y: number}

export type ScrollAnchor = {
	left: number,
	top: number,
	scrollLeft: number,
	scrollTop: number,
}

export type ScrollDelta = {
	shiftX: number,
	shiftY: number,
	ownX: number,
	ownY: number,
}

export type Active = DragTarget & {
	pointerId: number
	startX: number
	startY: number
	startLeft: number
	startTop: number
	startTranslate: Point | null
	clampBox: BBox | null
	containerElm: HTMLElement
	containerBBox: BBox
	scrollAnchor: ScrollAnchor
	scrollDelta: ScrollDelta
	lastEv: PointerEvent
}
