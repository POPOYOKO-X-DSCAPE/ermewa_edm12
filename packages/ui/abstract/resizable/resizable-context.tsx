import { createContext } from "react";
import type { IResizable } from "./resizable-types";

interface IContext {
	size: IResizable["size"];
	resize: (e: React.MouseEvent) => void;
	ref: React.RefObject<HTMLDivElement | null>;
}

export const Context = createContext<IContext | undefined>(undefined);
