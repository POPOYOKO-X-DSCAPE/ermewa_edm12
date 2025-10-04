import type { ComponentChildren } from "preact";
import "./index.scss";

import classNames from "classnames";

interface LoaderProps {
	children?: ComponentChildren;
	fillContainer?: boolean
}

export const Loader = ({ children, fillContainer = false }: LoaderProps) => {
	return <div className={classNames("loader", { "fill-container": fillContainer })}>{children && children}</div>;
};
