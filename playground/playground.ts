import {draggables} from '../src';

const container = document.getElementById('the-container')!;
const drgElm = document.getElementById('drag-me')!;
const testBtn = document.getElementById('test-btn')!;
const toggleAxisBtn = document.getElementById('toggle-axis-btn')!;
const toggleContainerBtn = document.getElementById('toggle-container-btn')!;
const toggleDragBtn = document.getElementById('toggle-draggability-btn')!;
// const staticElm = document.getElementById('static')!;

toggleAxisBtn.addEventListener('click', () => {
	if (drgElm.dataset.dragAxis === 'x') drgElm.dataset.dragAxis = 'y';
	else if (drgElm.dataset.dragAxis === 'y') drgElm.dataset.dragAxis = '';
	else drgElm.dataset.dragAxis = 'x';
}, false);

toggleContainerBtn.addEventListener('click', () => {
	if ('dragZone' in container.dataset) delete container.dataset.dragZone;
	else container.dataset.dragZone = '';
}, false);

toggleDragBtn.addEventListener('click', () => {
	d.isEnabled
		? d.disable()
		: d.enable();
}, false);


// const gripHandle = document.getElementById('grips-container')!;
// const gripHandle = document.getElementById('grip-a')!;

testBtn.addEventListener('click', (ev) => {
	console.log(ev);
	alert('Clicked');
});

const d = draggables();

d.on('grab', () => console.log('grabbed'))
	.on('dragStart', () => console.log('dragStart'))
	.on('dragging', () => console.log('dragging'))
	.on('dragEnd', () => console.log('droped'));

// document.addEventListener('mousemove', (ev) => {
// 	console.log(ev.x, ev.y);
// })

// staticElm.addEventListener('mouseenter', () => {
// 	console.log('enter');
// }, false);
