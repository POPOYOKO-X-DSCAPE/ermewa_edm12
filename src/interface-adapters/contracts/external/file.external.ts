import { createSchema } from "../../../core/domain.builders";

export const fileExternalBodySchema = createSchema(({ dict }) => ({
	XDOC: dict({
		URL: "string",
		XFILE: dict({
			LAN: dict({
				URLDET: "string",
			}),
		}),
	}),
}));
