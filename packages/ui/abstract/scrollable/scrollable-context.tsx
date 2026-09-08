import { createContext } from "react";

interface IContext {
	axis: "x" | "y";
	contentSize: number;
	relativePosition: number;
	OnWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
	OnBarDrag: (e: React.DragEvent<HTMLElement>) => void;
	ref: React.RefObject<HTMLDivElement | null>;
}

export const Context = createContext<IContext | undefined>(undefined);
