import type { RemixiconComponentType } from "@remixicon/react";
import type { ReactElement } from "react";
import type { ButtonLevel } from "./components/button";

export type Action = {
	label: string;
	level?: ButtonLevel;
	icon?: ReactElement<RemixiconComponentType>;
	callback: () => void;
};
