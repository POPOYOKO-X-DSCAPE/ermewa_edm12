export interface IResizable {
	size: number;
	minSize?: number;
	maxSize?: number;
	axis: "x" | "y";
	initialSize?: number;
}
