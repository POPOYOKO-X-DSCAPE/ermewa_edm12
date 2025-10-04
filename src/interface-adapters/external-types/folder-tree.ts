export type ErmiFolderName = Partial<{
	[key in "ENG" | "FRA" | "GER" | ""]: {
		DES: string;
		SHO?: string;
	};
}>;

export type FolderTreeBodyResponse = {
	SID: string;
	LEV: string;
	XOBJ: string;
	XTYP: string;
	XSTA: string;
	FLD?: string;
	FNAME?: ErmiFolderName;
	FDISPLAY: {
		FLD: boolean | string;
		SID: boolean | string;
	};
	XLNK?: {
		[key: string]: {
			X3OBJ: string;
			XTYP: string;
			SID: string;
			VID: string;
			DID: string;
			FID: string;
			FMT: string;
			ITMREF: string;
			MACTYP: string;
			STATITM: string;
			YHI00: string;
			YHI00FMT: string;
		};
	};
	SOBJ?: FolderTreeBodyResponse[];
};

export type FolderTreeResponse = {
	json(): Promise<{ xTree: FolderTreeBodyResponse }>;
} & Response;
