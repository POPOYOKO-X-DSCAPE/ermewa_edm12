import { createEntity } from "../../core/domain.builders";

export default createEntity(
	(
		kind,
		{ primaryKey, ref: { hasOne }, refs: { nature, document }, oneOf },
	) => ({
		[kind]: document,

		code: primaryKey("nonEmptyString"),

		isLocal: "boolean",

		name: "nonEmptyString",
		status: {
			number: "positiveInt",
			label: "string?",
		},

		documentDate: "string",
		expirationDate: "string?",
		lastUpdated: "string",

		url: "string",
		fullUrl: "string",
		shortUrl: "string",
		language: "string",
		fileExtension: oneOf(
			"json",
			"unknown",
			"pdf",
			"jpg",
			"jpeg",
			"png",
			"mpeg",
			"svg",
			"mp4",
			"txt",
			"xml",
			"msg",
		),
		memo: "string?",

		nature: hasOne()(nature),
	}),
);
