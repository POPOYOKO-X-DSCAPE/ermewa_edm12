import classNames from "classnames";
import type { ComponentChildren } from "preact";
import "./index.scss";

interface CardProps {
	children: ComponentChildren;
}

export const Card = ({ children }: CardProps) => {
	return <div className={classNames("card")}>{children}</div>;
};
