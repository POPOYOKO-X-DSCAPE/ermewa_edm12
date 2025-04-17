// biome-ignore lint/style/useImportType: <explanation>
import React from "react";

interface CardProps {
	children: React.ReactNode;
	onClick?: () => void;
}

export const Card = ({ children, onClick }: CardProps) => {
	const handleClick = () => {
		if (onClick) {
			onClick(); // Appelle la fonction onClick si elle est définie
		}
	};
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<article className="card" onClick={handleClick}>
			{children}
		</article>
	);
};
