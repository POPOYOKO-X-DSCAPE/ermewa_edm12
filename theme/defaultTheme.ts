import { buildComponentTokens } from "@packages/ui/theme/flatten";
import { defineTokens } from "@pandacss/dev";
import { components } from "./components";

export const componentsTokens = defineTokens(
	buildComponentTokens(components),
);
