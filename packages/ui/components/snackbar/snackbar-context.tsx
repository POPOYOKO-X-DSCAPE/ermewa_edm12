import { type ReactNode, createContext } from "react";

interface IContext {
	message: ReactNode;
	isVisible: boolean;
	setIsVisible: (visible: boolean) => void;
	show: (message: string, duration?: number) => void;
	hide: () => void;
	ref: React.RefObject<HTMLDivElement | null>;
}

export const Context = createContext<IContext | undefined>(undefined);
