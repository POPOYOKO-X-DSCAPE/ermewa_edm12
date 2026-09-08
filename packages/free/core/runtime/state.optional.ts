export const isOptionalType = (def: string) => def.endsWith("?");

export const stripOptionalType = (def: string) =>
	isOptionalType(def) ? def.slice(0, -1) : def;
