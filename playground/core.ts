import {Drag} from '../src/core/Drag';
import {logLine} from './shared';

const box = document.getElementById('box')!;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const status = document.getElementById('status')!;

const createDrag = () => new Drag({threshold: Number(thresholdInput.value)});

let drag = createDrag();
let startLeft = 0;
let startTop = 0;

function logCoreOutput (dragEventName: string, result?: unknown) {
	logLine(result === undefined ? dragEventName : `${dragEventName.padEnd(6)} -> ${JSON.stringify(result)}`);
	status.textContent = dragEventName;
}

function place (dx: number, dy: number) {
	box.style.left = `${startLeft + dx}px`;
	box.style.top = `${startTop + dy}px`;
}

function unbind () {
	window.removeEventListener('pointermove', onMove);
	window.removeEventListener('pointerup', onUp);
	window.removeEventListener('keydown', onKeyDown);
}

function onMove (ev: PointerEvent) {
	const move = drag.move(ev.clientX, ev.clientY);
	logCoreOutput('move', move);

	if (move) place(move.dx, move.dy);
}

function onUp (ev: PointerEvent) {
	const pos = drag.end(ev.clientX, ev.clientY);
	unbind();
	logCoreOutput('end', pos);

	if (pos) place(pos.dx, pos.dy);
}

function onKeyDown (ev: KeyboardEvent) {
	if (ev.key !== 'Escape') return;

	const wasDragging = drag.cancel();
	unbind();
	logCoreOutput('cancel', wasDragging);

	if (wasDragging) place(0, 0);
}

box.addEventListener('pointerdown', (ev) => {
	if (ev.button !== 0) return;

	drag.start(ev.clientX, ev.clientY);
	startLeft = box.offsetLeft;
	startTop = box.offsetTop;

	logCoreOutput(`start(${ev.clientX}, ${ev.clientY})`);

	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	window.addEventListener('keydown', onKeyDown);
});

thresholdInput.addEventListener('change', () => drag = createDrag());
