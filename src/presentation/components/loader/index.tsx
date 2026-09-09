import type { ReactNode } from "react";

import classNames from "classnames";
import { loader } from "./styles";

interface LoaderProps {
	children?: ReactNode;
	fillContainer?: boolean
}

export const Loader = ({ children, fillContainer = false }: LoaderProps) => {
	return <div className={classNames("loader", { "fill-container": fillContainer })}>{children && children}</div>;
};
