export type Zone = {elm: HTMLElement, box: DOMRect}

export const findDropzone = (x: number, y: number, selector: string, exclude?: HTMLElement) => {
	const hit = document.elementsFromPoint(x, y)
		.find(elm => !exclude?.contains(elm) && elm.matches(selector)) as HTMLElement | undefined;

	return hit ?? null;
};

export const measureZones = (selector: string, exclude?: HTMLElement): Zone[] =>
	[...document.querySelectorAll<HTMLElement>(selector)]
		.filter(elm => !exclude?.contains(elm))
		.map(elm => ({elm, box: elm.getBoundingClientRect()}));

export const hitZone = (zones: Zone[], x: number, y: number) => {
	const hit = zones.findLast(({box}) => x >= box.left && x < box.right && y >= box.top && y < box.bottom);

	return hit?.elm ?? null;
};
