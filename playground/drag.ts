import {drag, type DragInstance, type DraggableEvent} from '../src';

const board = document.getElementById('board')!;
const panel = document.getElementById('panel')!;
const handle = document.getElementById('handle')!;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const clearLogBtn = document.getElementById('clear-log')!;
const log = document.getElementById('log')!;

function write (name: string, ev: DraggableEvent) {
	const id = ev.elm.id || ev.elm.textContent?.trim();
		log.textContent = `${name.padEnd(9)} ${id} dx:${ev.dx} dy:${ev.dy} x:${ev.x} y:${ev.y}\n` + log.textContent;
}

let notes: DragInstance;
let resize: DragInstance;

function setup () {
	notes?.destroy();
	resize?.destroy();
	const threshold = Number(thresholdInput.value);

	let startLeft = 0;
	let startTop = 0;

	notes = drag(board, {threshold})
		.on('grab', (ev) => {
			startLeft = ev.elm.offsetLeft;
			startTop = ev.elm.offsetTop;
			write('grab', ev);
		})
		.on('dragStart', (ev) => write('dragStart', ev))
		.on('dragging', (ev) => {
			const maxX = board.clientWidth - ev.elm.offsetWidth;
			const maxY = board.clientHeight - ev.elm.offsetHeight;
			ev.elm.style.left = `${Math.min(Math.max(startLeft + ev.dx, 0), maxX)}px`;
			ev.elm.style.top = `${Math.min(Math.max(startTop + ev.dy, 0), maxY)}px`;
			write('dragging', ev);
		})
		.on('dragEnd', (ev) => write('dragEnd', ev));

	let startW = 0;
	let startH = 0;

	resize = drag(handle, {threshold})
		.on('grab', (ev) => {
			startW = panel.offsetWidth;
			startH = panel.offsetHeight;
			write('grab', ev);
		})
		.on('dragging', (ev) => {
			panel.style.width = `${Math.max(startW + ev.dx, 60)}px`;
			panel.style.height = `${Math.max(startH + ev.dy, 40)}px`;
			write('dragging', ev);
		})
		.on('dragEnd', (ev) => write('dragEnd', ev));
}

setup();
thresholdInput.addEventListener('change', setup);
clearLogBtn.addEventListener('click', () => log.textContent = '');
