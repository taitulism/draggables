import type {DragState} from '../src';

const PAGES = ['core', 'notes', 'axis', 'resize', 'gesture', 'rect', 'viewport-pan', 'misc'];

const nav = document.getElementById('nav')!;
const clearLogBtn = document.getElementById('clear-log')!;
const log = document.getElementById('log')!;

const current = location.pathname.split('/').pop()?.replace('.html', '').replace(/^(index)?$/, 'core');

const href = (page: string) => page === 'core' ? './' : `./${page}.html`;

nav.innerHTML = PAGES
	.map((page) => `<a href="${href(page)}"${page === current ? ' aria-current="page"' : ''}>${page}</a>`)
	.join('');

clearLogBtn.addEventListener('click', () => log.textContent = '');

export function logLine (line: string) {
	log.textContent = `${line}\n${log.textContent}`;
}

export function logOutput (name: string, dragState: DragState) {
	const id = dragState.elm.id || dragState.elm.dataset.name || dragState.elm.className;
	
	logLine(`${name.padEnd(9)} ${id} dx:${dragState.dx} dy:${dragState.dy} x:${dragState.x} y:${dragState.y}`);
}

export function logCancel (elm: HTMLElement) {
	logLine(`${'dragCancel'.padEnd(9)} ${elm.id || elm.dataset.name || elm.className}`);
}

export function lockCursor () {
	document.body.classList.add('dragging');
}

export function unlockCursor () {
	document.body.classList.remove('dragging');
}
