import { api } from "@src/infrastructure/services/raw.api";

import { displaySelectInternalSchema } from "../contracts/internal/display-select.internal";

export const displaySelectAdapter = api.adapt.ermewa.displaySelect.get(
	displaySelectInternalSchema,
	(raw) =>
		raw.xSel.map((item) => ({
			id: item.$uuid,
			etag: item.$etag,
			requestNumber: item.REQNUM,
			requestOrder: item.REQORD,
			requestStatus: item.REQSTA,
			bpsNumber: item.BPSNUM,
			establishmentNumber: item.ETBNUM,
			yme06: item.YME06,
			workshopCode: item.WSHCOD,
			machineNumber: item.MACNUM,
			cophid: item.COPHID,
			wysa01: item.WYSA01,
			requestInitialDate: item.REQINIDAT,
			beginDate: item.BEGDAT,
			endDate: item.ENDDAT,
			requestCloseDate: item.REQCLODAT,
			requestRoot: {
				code: item.REQROOT,
				label: item.REQROOT_REF.$title,
			},
			requestFather: {
				code: item.REQFATHER,
				label: item.REQFATHER_REF.$title,
			},
			requestType: {
				code: item.REQTYP,
				label: item.REQTYP_REF.$title,
				description: item.REQTYP_REF.$description,
			},
			contractRevision: {
				code: item.CONREV,
				label: item.CONREV_REF.$title,
			},
		})),
);
