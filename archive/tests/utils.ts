export const translate = (x: number, y: number) => {
	if (x && y) return `${x}px ${y}px`;
	if (!x && !y) return '0px';
	if (x) return `${x}px`;
	if (y) return `0px ${y}px`;
};
