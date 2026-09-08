import { createSchema } from "../../../core/domain.builders";

export const displaySelectInternalSchema = createSchema(({ array }) =>
	array({
		id: "string",
		etag: "string",
		requestNumber: "string",
		requestOrder: "number",
		requestStatus: "string",
		bpsNumber: "string",
		establishmentNumber: "string",
		yme06: "string",
		workshopCode: "string",
		machineNumber: "string",
		cophid: "string",
		wysa01: "string",
		requestInitialDate: "string",
		beginDate: "string",
		endDate: "string",
		requestCloseDate: "string",
		requestRoot: {
			code: "string",
			label: "string",
		},
		requestFather: {
			code: "string",
			label: "string",
		},
		requestType: {
			code: "string",
			label: "string",
			description: "string",
		},
		contractRevision: {
			code: "string",
			label: "string",
		},
	}),
);
