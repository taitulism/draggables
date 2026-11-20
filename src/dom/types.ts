export type TargetResolver = (ev: PointerEvent) => HTMLElement | null

export type DraggerOptions = {
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
	container: HTMLElement
	containerX: number
	containerY: number
	startContainerX: number
	startContainerY: number
}

type TranslateData = {
	tx: number
	ty: number
}

type HasContainer = {container: HTMLElement | string} | {target: string} | {bound: 'pointer'}

export type DragState<O extends DraggerOptions = DraggerOptions> = {
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

export type DragEventHandler<O extends DraggerOptions = DraggerOptions> =
	(dragState: DragState<O>) => void

export type Handlers<O extends DraggerOptions> = {
	grab?: DragEventHandler<O>
	dragStart?: DragEventHandler<O>
	dragging?: DragEventHandler<O>
	dragEnd?: DragEventHandler<O>
	dragCancel?: (data: Resolved) => void
	release?: (data: Resolved) => void
}

export type DragEventName = keyof Handlers<DraggerOptions>

export type Resolved = {elm: HTMLElement, grip: HTMLElement}

export type BBox = {left: number, top: number, right: number, bottom: number}

export type Point = {x: number, y: number}

export type Active = Resolved & {
	pointerId: number
	startX: number
	startY: number
	startLeft: number
	startTop: number
	startTranslate: Point | null
	clampBox: BBox | null
	containerElm: HTMLElement | null
	containerBBox: BBox | null
}
