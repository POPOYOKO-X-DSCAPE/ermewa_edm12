import type { ReactNode } from "react";

import type { DisplaySelectViewProps } from "@src/presentation/contracts/display-select.interface";

import {
	useDisplaySelect,
	type UseDisplaySelectOptions,
} from "./use-display-select";

export type DisplaySelectFeatureProps = UseDisplaySelectOptions &
	Readonly<{
		children: (props: DisplaySelectViewProps) => ReactNode;
	}>;

export const DisplaySelectFeature = ({
	children,
	...options
}: DisplaySelectFeatureProps) => children(useDisplaySelect(options));

export { useDisplaySelect } from "./use-display-select";
export type { UseDisplaySelectOptions } from "./use-display-select";
