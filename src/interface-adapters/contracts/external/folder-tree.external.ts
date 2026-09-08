import { createSchema } from "../../../core/domain.builders";

const folderNameEntrySchema = {
	DES: "string",
	SHO: "string",
} as const;

const folderLinkSchema = {
	X3OBJ: "string",
	XTYP: "string",
	SID: "string",
	VID: "string",
	DID: "string",
	FID: "string",
	FMT: "string",
	ITMREF: "string",
	MACTYP: "string",
	STATITM: "string",
	YHI00: "string",
	YHI00FMT: "string",
} as const;

export const folderTreeExternalPayloadSchema = createSchema(
	({ dict, optional, array, lazy }) => {
		const node = lazy((self) => ({
			SID: "string",
			LEV: "string",
			XOBJ: "string",
			XTYP: "string",
			XSTA: "string",

			FLD: optional("string"),

			FNAME: optional(dict(folderNameEntrySchema)),

			FDISPLAY: {
				FLD: "string",
				SID: "string",
			},

			XLNK: optional(dict(folderLinkSchema)),

			SOBJ: optional(array(self)),
		}));

		return {
			xTree: node,
		};
	},
);
