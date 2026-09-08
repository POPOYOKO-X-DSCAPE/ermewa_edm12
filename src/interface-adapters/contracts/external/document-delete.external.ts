import { createSchema } from "../../../core/domain.builders";

export const documentDeleteExternalBodySchema = createSchema(
	({ dict }) => ({
		XDOC: dict({
			COD: "string",
			STATE: "number",
			URL: "string",
		}),

		XFILE: dict({
			LAN: dict({
				URLFUL: "string",
				URLSHO: "string",
			}),
		}),
	}),
);

export const documentDeleteExternalPayloadSchema = createSchema(
	() => "object",
);
