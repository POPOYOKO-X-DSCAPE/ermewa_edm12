import type { ComponentChildren } from "preact";
import "./index.scss";
import Button from "../button";

interface DialogProps {
	children: ComponentChildren;
	onClose: () => void;
}

export const Dialog = ({ children, onClose }: DialogProps) => {
	return (
		<div className={`overlay`} onClick={() => onClose()}>
			<dialog>
				<Button onClick={() => onClose()}>X</Button>
				<div className={"content"}>{children}</div>
			</dialog>
		</div>
	);
};
