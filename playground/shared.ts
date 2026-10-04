import type {DragInstance, DraggableEvent} from '../src';

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

export function logOutput (name: string, ev: DraggableEvent) {
	const id = ev.elm.id || ev.elm.dataset.name || ev.elm.className;
	
	logLine(`${name.padEnd(9)} ${id} dx:${ev.dx} dy:${ev.dy} x:${ev.x} y:${ev.y}`);
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
