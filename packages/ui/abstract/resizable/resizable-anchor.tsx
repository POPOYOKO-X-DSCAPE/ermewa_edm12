import { useContext } from "react";
import { Context } from "./resizable-context";

interface IAnchorProps {
	children: React.ReactNode;
}

export const Anchor = ({ children }: IAnchorProps) => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("Content must be used within a Provider");
	}

	const handleDrag = (e: React.MouseEvent) => {
		context.resize(e);
	};

	return <div onMouseDown={handleDrag}>{children}</div>;
};
