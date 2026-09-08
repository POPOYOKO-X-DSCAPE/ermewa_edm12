// packages/ui/abstract/resizable/resizable-provider.tsx
import { useCallback, useRef, useState } from "react";
import { Context } from "./resizable-context";
import type { IResizable } from "./resizable-types";

interface IProviderProps {
	children: React.ReactNode;
	axis: IResizable["axis"];
	minSize?: IResizable["minSize"];
	maxSize?: IResizable["maxSize"];
	initialSize?: IResizable["initialSize"];
}

const calculateNewSize = (
	start: number,
	startSize: number,
	current: number,
	minSize?: number,
	maxSize?: number,
): number => {
	const delta = current - start;
	let newSize = startSize + delta;

	newSize = Math.max(minSize ?? 0, newSize);
	newSize = Math.min(maxSize ?? Number.POSITIVE_INFINITY, newSize);

	return newSize;
};

export const Provider = ({
	children,
	axis,
	minSize = 100,
	maxSize,
	initialSize,
}: IProviderProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<IResizable["size"]>(
		initialSize || maxSize || minSize,
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!ref.current) return;

			const start = axis === "x" ? e.clientX : e.clientY;
			const startSize =
				axis === "x"
					? ref.current.getBoundingClientRect().width
					: ref.current.getBoundingClientRect().height;

			const onMouseMove = (e: MouseEvent) => {
				const newSize = calculateNewSize(
					start,
					startSize,
					axis === "x" ? e.clientX : e.clientY,
					minSize,
					maxSize,
				);
				setSize(newSize);
			};

			const onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[axis, minSize, maxSize],
	);

	return (
		<Context.Provider value={{ size, resize: handleMouseDown, ref }}>
			<div
				ref={ref}
				style={
					axis === "x"
						? {
								width: size,
								position: "relative",
							}
						: { height: size, position: "relative" }
				}
			>
				{children}
			</div>
		</Context.Provider>
	);
};
