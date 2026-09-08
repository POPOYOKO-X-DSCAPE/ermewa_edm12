import { createEntity } from "../../core/domain.builders";

export default createEntity(
	(kind, { primaryKey, array, refs: { user } }) => ({
		[kind]: user,

		email: primaryKey("userEmail"),

		login: "username?",
		fullName: "nonEmptyString?",
		defaultLanguage: "string",
		languages: array("string"),
		app: "string",
	}),
);
