import { useContext } from "react";
import { Context } from "./scrollable-context";

interface IBarProps {
	children: React.ReactNode;
}

export const Bar = ({ children }: IBarProps) => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("Bar must be used within a Provider");
	}

	const handleDrag = (e: React.DragEvent<HTMLElement>) => {
		context.OnBarDrag(e);
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		const target = e.currentTarget;

		const startX = e.clientX;
		const startY = e.clientY;

		const startScroll =
			context.axis === "x" ? target.scrollLeft : target.scrollTop;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const deltaX = moveEvent.clientX - startX;
			const deltaY = moveEvent.clientY - startY;

			const newScroll =
				context.axis === "x"
					? startScroll - deltaX
					: startScroll - deltaY;

			target.scrollLeft = newScroll;
			target.scrollTop = newScroll;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	return (
		<div onDrag={handleDrag} onMouseDown={handleMouseDown}>
			{children}
		</div>
	);
};
