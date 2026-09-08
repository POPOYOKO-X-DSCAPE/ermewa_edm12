import { createEntity } from "../../core/domain.builders";

export default createEntity(
	(
		kind,
		{
			primaryKey,
			ref: { has, hasOne },
			refs: { nature, folder, document },
			oneOf,
			array,
		},
	) => ({
		[kind]: nature,

		code: primaryKey("nonEmptyString"),

		label: {
			short: "nonEmptyString",
			long: "nonEmptyString",
		},

		dueDate: "number",
		hasExpirationDate: "boolean?",

		flags: {
			editable: "boolean?",
			controllable: "boolean?",
			uploadEnabled: "boolean?",
			flagEnabled: "boolean?",
		},

		mode: oneOf("mono", "multi"),

		isMandatory: "boolean?",
		isForbidden: "boolean?",

		maxSize: "positiveInt?",
		extensions: array("string"),

		folder: hasOne()(folder),
		documents: has(0).toMany()(document),
	}),
);
