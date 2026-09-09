import classNames from "classnames";
import { styles } from "./styles";
interface CardProps {
	children: React.ReactNode;
	onClick?: () => void;
	classname?: string;
}

export const Card = ({ children, onClick, classname }: CardProps) => {
	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<article
			className={classNames(
				styles.container,
				classname,
				styles.clickable,
			)}
			onClick={handleClick}
		>
			{children}
		</article>
	);
};
