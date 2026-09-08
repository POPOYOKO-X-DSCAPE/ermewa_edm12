import { createSchema } from "../../../core/domain.builders";

export const naturesExternalPayloadSchema = createSchema(
	({ dict, optional }) => ({
		xNat: dict({
			DES: {
				FRA: "string",
			},
			SHO: {
				ENG: "string",
				FRA: "string",
				GER: "string",
			},
			NAT: optional(
				dict({
					LINKEDTO: "string?",
					COD: "string?",
					SHO: "string?",
					DES: {
						ENG: "string",
						FRA: "string",
						GER: "string",
					},
					RCD: "string?",
					GNR: "string?",
					EXT: "string?",
					HIS: "string?",
					LMG: "number?",
					NBL: "number?",
					DOCDATE: "boolean?",
					DUEDATE: "number?",
					ENAXFR: "boolean?",
					ENAEDT: "boolean?",
					ENACTL: "boolean?",
					MAXSIZE: "number?",
					ENAUPL: "boolean?",
					ENAFLG: "boolean?",
				}),
			),
		}),
	}),
);
