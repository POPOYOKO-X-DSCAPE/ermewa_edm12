import { createSchema } from "../../../core/domain.builders";

export const documentDeleteInternalBodySchema = createSchema(() => ({
	documentCode: "string",
	state: "number",
	url: "string",
	fileExtension: "string",
	language: "string",
	fullUrl: "string",
	shortUrl: "string",
}));

export const documentDeleteInternalPayloadSchema = createSchema(
	() => "object",
);
