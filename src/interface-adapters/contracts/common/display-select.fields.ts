export type DisplaySelectReference = Readonly<{
	code: string;
	label: string;
}>;

export type DisplaySelectDescribedReference = Readonly<{
	code: string;
	label: string;
	description: string;
}>;

export type DisplaySelectItem = Readonly<{
	id: string;
	etag: string;
	requestNumber: string;
	requestOrder: number;
	requestStatus: string;
	bpsNumber: string;
	establishmentNumber: string;
	yme06: string;
	workshopCode: string;
	machineNumber: string;
	cophid: string;
	wysa01: string;
	requestInitialDate: string;
	beginDate: string;
	endDate: string;
	requestCloseDate: string;
	requestRoot: DisplaySelectReference;
	requestFather: DisplaySelectReference;
	requestType: DisplaySelectDescribedReference;
	contractRevision: DisplaySelectReference;
}>;

export const displaySelectExternalFieldMap = {
	$UUID: "id",
	$ETAG: "etag",
	REQNUM: "requestNumber",
	REQORD: "requestOrder",
	REQSTA: "requestStatus",
	BPSNUM: "bpsNumber",
	ETBNUM: "establishmentNumber",
	YME06: "yme06",
	WSHCOD: "workshopCode",
	MACNUM: "machineNumber",
	COPHID: "cophid",
	WYSA01: "wysa01",
	REQINIDAT: "requestInitialDate",
	BEGDAT: "beginDate",
	ENDDAT: "endDate",
	REQCLODAT: "requestCloseDate",
	REQROOT: "requestRootCode",
	REQROOT_REF: "requestRootLabel",
	"REQROOT_REF.$TITLE": "requestRootLabel",
	REQFATHER: "requestFatherCode",
	REQFATHER_REF: "requestFatherLabel",
	"REQFATHER_REF.$TITLE": "requestFatherLabel",
	REQTYP: "requestTypeCode",
	REQTYP_REF: "requestTypeLabel",
	"REQTYP_REF.$TITLE": "requestTypeLabel",
	"REQTYP_REF.$DESCRIPTION": "requestTypeDescription",
	CONREV: "contractRevisionCode",
	CONREV_REF: "contractRevisionLabel",
	"CONREV_REF.$TITLE": "contractRevisionLabel",
} as const;

export type DisplaySelectExternalField =
	keyof typeof displaySelectExternalFieldMap;

export type DisplaySelectFieldKey =
	(typeof displaySelectExternalFieldMap)[DisplaySelectExternalField];

const normalizeExternalField = (value: string): string =>
	value.trim().replace(/\s+/g, "").toUpperCase();

export const resolveDisplaySelectFieldKey = (
	value: unknown,
): DisplaySelectFieldKey | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	return displaySelectExternalFieldMap[
		normalizeExternalField(value) as DisplaySelectExternalField
	];
};

export const readDisplaySelectFieldValue = (
	item: DisplaySelectItem,
	field: DisplaySelectFieldKey,
): string | number => {
	switch (field) {
		case "id":
			return item.id;
		case "etag":
			return item.etag;
		case "requestNumber":
			return item.requestNumber;
		case "requestOrder":
			return item.requestOrder;
		case "requestStatus":
			return item.requestStatus;
		case "bpsNumber":
			return item.bpsNumber;
		case "establishmentNumber":
			return item.establishmentNumber;
		case "yme06":
			return item.yme06;
		case "workshopCode":
			return item.workshopCode;
		case "machineNumber":
			return item.machineNumber;
		case "cophid":
			return item.cophid;
		case "wysa01":
			return item.wysa01;
		case "requestInitialDate":
			return item.requestInitialDate;
		case "beginDate":
			return item.beginDate;
		case "endDate":
			return item.endDate;
		case "requestCloseDate":
			return item.requestCloseDate;
		case "requestRootCode":
			return item.requestRoot.code;
		case "requestRootLabel":
			return item.requestRoot.label;
		case "requestFatherCode":
			return item.requestFather.code;
		case "requestFatherLabel":
			return item.requestFather.label;
		case "requestTypeCode":
			return item.requestType.code;
		case "requestTypeLabel":
			return item.requestType.label;
		case "requestTypeDescription":
			return item.requestType.description;
		case "contractRevisionCode":
			return item.contractRevision.code;
		case "contractRevisionLabel":
			return item.contractRevision.label;
	}
};
