import { createSchema } from "../../../core/domain.builders";

export const fileInternalBodySchema = createSchema(() => ({
	documentCode: "string",
	extension: "string",
	url: "string",
	detailedUrl: "string",
}));

export const fileInternalPayloadSchema = createSchema(() => "object");
