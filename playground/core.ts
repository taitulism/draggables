import {startDrag, type Drag, type DragStep} from '../src/core/startDrag';

const box = document.getElementById('box')!;
const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const clearLogBtn = document.getElementById('clear-log')!;
const status = document.getElementById('status')!;
const log = document.getElementById('log')!;

let drag: Drag | undefined;
let startLeft = 0;
let startTop = 0;

function write (step: DragStep | null, label?: string) {
	const line = !step
		? `${label} -> null`
		: step.type === 'dragCancel'
			? step.type
			: `${step.type.padEnd(9)} dx:${step.dx} dy:${step.dy} x:${step.x} y:${step.y}`;

	log.textContent = line + '\n' + log.textContent;
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

	if (!step) return write(null, 'move');

	place(step.dx, step.dy);
	write(step);
}

function onUp (ev: PointerEvent) {
	const step = drag!.end(ev.clientX, ev.clientY);
	unbind();

	if (!step) return write(null, 'end (click)');

	place(step.dx, step.dy);
	write(step);
}

function onKeyDown (ev: KeyboardEvent) {
	if (ev.key !== 'Escape') return;

	const step = drag!.cancel();
	unbind();

	if (!step) return write(null, 'cancel');

	place(0, 0);
	write(step);
}

box.addEventListener('pointerdown', (ev) => {
	if (ev.button !== 0) return;

	drag = startDrag(ev.clientX, ev.clientY, {threshold: Number(thresholdInput.value)});
	startLeft = box.offsetLeft;
	startTop = box.offsetTop;
	write(null, `grab x:${ev.clientX} y:${ev.clientY}`);

	window.addEventListener('pointermove', onMove);
	window.addEventListener('pointerup', onUp);
	window.addEventListener('keydown', onKeyDown);
});

clearLogBtn.addEventListener('click', () => log.textContent = '');
