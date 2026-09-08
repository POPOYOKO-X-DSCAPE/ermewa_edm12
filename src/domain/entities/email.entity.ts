import { createEntity } from "../../core/domain.builders";

export default createEntity((kind, { array, refs: { email } }) => ({
	[kind]: email,

	from: "userEmail",
	to: "userEmail",

	cc: "userEmail?",
	bcc: "userEmail?",

	subject: "nonEmptyString",

	text: "string?",
	html: "string?",

	attachments: array({
		filename: "nonEmptyString",
		content: "nonEmptyString",
		encoding: "nonEmptyString",
	}),
}));
