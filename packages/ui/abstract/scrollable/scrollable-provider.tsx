import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Context } from "./scrollable-context";
import type { IScrollable } from "./scrollable-types";

interface IProviderProps {
	children: React.ReactNode;
	axis: IScrollable["axis"];
}

export const Provider = ({ children, axis }: IProviderProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [relativePosition, setRelativePosition] = useState<number>(0);
	const [contentSize, setContentSize] = useState<number>(0);

	const OnBarDrag = useCallback((e: React.DragEvent<HTMLElement>) => {
		console.log(e);
	}, []);

	const OnWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
		// e.preventDefault();

		const target = e.currentTarget;

		const scrollAmount = e.deltaY;
		target.scrollTo({
			top: target.scrollTop + scrollAmount,
			behavior: "smooth",
		});
	}, []);

	return (
		<Context.Provider
			value={{
				OnBarDrag,
				OnWheel,
				relativePosition,
				contentSize,
				ref,
				axis,
			}}
		>
			<div
				ref={ref}
				style={{
					position: "relative",
					overflow: axis === "y" ? "clip auto" : "auto clip",
					width: "100%",
					maxHeight: "100%",
				}}
			>
				{children}
			</div>
		</Context.Provider>
	);
};
