import type React from "react";
import { useRef, useState } from "react";
import { Context } from "./snackbar-context";

interface IProviderProps {
	children: React.ReactNode;
	isInitiallyVisible?: boolean;
}

export const Provider = ({
	children,
	isInitiallyVisible,
}: IProviderProps) => {
	const ref = useRef<HTMLDivElement>(null);

	const [message, setMessage] = useState<string>("test");
	const [isVisible, setIsVisible] = useState<boolean>(
		isInitiallyVisible || false,
	);

	const show = (msg: string, duration = 7000) => {
		setMessage(msg);
		setIsVisible(true);
		setTimeout(() => {
			setIsVisible(false);
		}, duration);
	};

	const hide = () => setIsVisible(false);

	return (
		<Context.Provider
			value={{
				message,
				isVisible,
				hide,
				show,
				setIsVisible,
				ref,
			}}
		>
			{children}
			<div ref={ref} />
		</Context.Provider>
	);
};
