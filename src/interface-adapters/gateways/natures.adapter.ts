import { api } from "@src/infrastructure/services/raw.api";

import { naturesInternalSchema } from "../contracts/internal/natures.internal";

export const naturesAdapter = api.adapt.ermewa.natures.get(
	naturesInternalSchema,
	(raw) => {
		const result: typeof naturesInternalSchema.infer = {};

		type InternalNature =
			(typeof naturesInternalSchema.infer)[string]["natures"][string];

		for (const folderKey in raw.xNat) {
			const entry = raw.xNat[folderKey];

			const adaptedNature: Record<string, InternalNature> = {};

			for (const natKey in entry.NAT) {
				const nat = entry.NAT[natKey];

				adaptedNature[natKey] = {
					linkedTo: nat.LINKEDTO,
					code: natKey,
					show: nat.SHO,

					description: nat.DES
						? {
								english: nat.DES.ENG,
								french: nat.DES.FRA,
								german: nat.DES.GER,
							}
						: undefined,

					record: nat.RCD,
					genre: nat.GNR,
					extensions: nat.EXT?.split(","),
					history: nat.HIS,
					limit: nat.LMG,
					numberLines: nat.NBL,
					mode: nat.NBL === 1 ? "mono" : "multi",

					documentDate: nat.DOCDATE,
					dueDate: nat.DUEDATE,
					hasExpirationDate: nat.DUEDATE !== 3,

					flags: {
						editable: nat.ENAEDT || false,
						controllable: nat.ENACTL || false,
						uploadEnabled: nat.ENAUPL || false,
						flagEnabled: nat.ENAFLG,
						enableAxfr: nat.ENAXFR,
					},

					maxSize: nat.MAXSIZE,
				};
			}

			result[folderKey] = {
				description: {
					french: entry.DES.FRA,
				},
				show: {
					english: entry.SHO.ENG,
					french: entry.SHO.FRA,
					german: entry.SHO.GER,
				},
				natures: adaptedNature,
			};
		}

		return result;
	},
);
