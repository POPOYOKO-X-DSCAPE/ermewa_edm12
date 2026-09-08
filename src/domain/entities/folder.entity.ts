import { createEntity } from "../../core/domain.builders";

export default createEntity(
	(kind, { primaryKey, ref: { has }, refs: { folder, nature } }) => ({
		[kind]: folder,

		sid: primaryKey("nonEmptyString"),

		type: "nonEmptyString",
		state: "string",
		name: "nonEmptyString",
		shortName: "string?",

		// display: "boolean | 'onDemand'" // todo: <figure out the right shape/type>,

		parent: has(0).to(1)(folder),
		children: has(0).toMany()(folder),

		natures: has(0).toMany()(nature),
	}),
);
