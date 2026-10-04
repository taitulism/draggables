import {startDrag, type Drag, type DragStep} from '../src/core/startDrag';
import {logLine} from './shared';

const box = document.getElementById('box')!;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const status = document.getElementById('status')!;

let drag: Drag | undefined;
let startLeft = 0;
let startTop = 0;

function logCoreOutput (step: DragStep | null, label?: string) {
	const line = !step
		? `${label} -> null`
		: step.type === 'dragCancel'
			? step.type
			: `${step.type.padEnd(9)} dx:${step.dx} dy:${step.dy} x:${step.x} y:${step.y}`;

	logLine(line);
	status.textContent = step ? step.type : label ?? '';
}

function place (dx: number, dy: number) {
	box.style.left = `${startLeft + dx}px`;
	box.style.top = `${startTop + dy}px`;
}

function unbind () {
	window.removeEventListener('pointermove', onMove);
	window.removeEventListener('pointerup', onUp);
	window.removeEventListener('keydown', onKeyDown);
	drag = undefined;
}

function onMove (ev: PointerEvent) {
	const step = drag!.move(ev.clientX, ev.clientY);

	if (!step) return logCoreOutput(null, 'move');

	place(step.dx, step.dy);

	logCoreOutput(step);
}

function onUp (ev: PointerEvent) {
	const step = drag!.end(ev.clientX, ev.clientY);
	unbind();

	if (!step) return logCoreOutput(null, 'end (click)');

	place(step.dx, step.dy);

	logCoreOutput(step);
}

function onKeyDown (ev: KeyboardEvent) {
	if (ev.key !== 'Escape') return;

	const step = drag!.cancel();
	unbind();

	if (!step) return logCoreOutput(null, 'cancel');

	place(0, 0);

	logCoreOutput(step);
}

box.addEventListener('pointerdown', (ev) => {
	if (ev.button !== 0) return;

	drag = startDrag(ev.clientX, ev.clientY, {threshold: Number(thresholdInput.value)});
	startLeft = box.offsetLeft;
	startTop = box.offsetTop;

	logCoreOutput(null, `grab x:${ev.clientX} y:${ev.clientY}`);

	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	window.addEventListener('keydown', onKeyDown);
});
