import type {DragInstance, DragData} from '../src';

const PAGES = ['core', 'notes', 'axis', 'resize', 'gesture', 'rect', 'scroller'];

const nav = document.getElementById('nav')!;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const clearLogBtn = document.getElementById('clear-log')!;
const log = document.getElementById('log')!;

const current = location.pathname.split('/').pop()?.replace('.html', '');

nav.innerHTML = PAGES
	.map((page) => `<a href="./${page}.html"${page === current ? ' aria-current="page"' : ''}>${page}</a>`)
	.join('');

clearLogBtn.addEventListener('click', () => log.textContent = '');

export function logLine (line: string) {
	log.textContent = `${line}\n${log.textContent}`;
}

export function logOutput (name: string, dragData: DragData) {
	const id = dragData.elm.id || dragData.elm.dataset.name || dragData.elm.className;
	
	logLine(`${name.padEnd(9)} ${id} dx:${dragData.dx} dy:${dragData.dy} x:${dragData.x} y:${dragData.y}`);
}

export function logCancel (elm: HTMLElement) {
	logLine(`${'dragCancel'.padEnd(9)} ${elm.id || elm.dataset.name || elm.className}`);
}

export function mount (setup: (threshold: number) => DragInstance[]) {
	let instances: DragInstance[] = [];

	const run = () => {
		instances.forEach((instance) => instance.destroy());
		instances = setup(Number(thresholdInput.value));
	};

	run();
	thresholdInput.addEventListener('change', run);
}
