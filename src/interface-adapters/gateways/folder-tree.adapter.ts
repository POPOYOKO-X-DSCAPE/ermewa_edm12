import { api } from "@src/infrastructure/services/raw.api";

import { folderTreeInternalSchema } from "../contracts/internal/folder-tree.internal";

export const folderTreeAdapter = api.adapt.ermewa.folderTree.get(
	folderTreeInternalSchema,
	(raw) => {
		type InternalNode = typeof folderTreeInternalSchema.infer;
		type ExternalNode = Omit<NonNullable<typeof raw.xTree>, "SOBJ"> & {
			SOBJ?: ExternalNode[];
		};

		const normalizeDisplay = (value: unknown): boolean | "ondemand" => {
			if (typeof value === "boolean") return value;
			if (typeof value === "string")
				return value === "ondemand" ? "ondemand" : false;
			return false;
		};

		const adaptFolderName = (
			name: NonNullable<ExternalNode["FNAME"]>,
		) => {
			type Entry = { SHO: string; DES: string };

			const get = (k: string): Entry | undefined =>
				(name as Record<string, Entry | undefined>)[k];

			const adaptEntry = (e: Entry) => ({
				short: e.SHO,
				description: e.DES,
			});

			const eng = get("ENG");
			const fra = get("FRA");
			const ger = get("GER");
			const def = get("");

			return {
				...(eng ? { english: adaptEntry(eng) } : {}),
				...(fra ? { french: adaptEntry(fra) } : {}),
				...(ger ? { german: adaptEntry(ger) } : {}),
				...(def ? { default: adaptEntry(def) } : {}),
			};
		};

		const adapt = (
			input: ExternalNode,
			parentPath: readonly string[] = [],
		): InternalNode => {
			const currentPath = [...parentPath, input.SID];

			return {
				sid: input.SID,
				level: input.LEV,
				name: input.XOBJ,
				status: input.XSTA,
				type: input.XTYP,

				path: currentPath,
				natures: [],

				...(input.FLD ? { folder: input.FLD } : {}),
				...(input.FNAME
					? { folderName: adaptFolderName(input.FNAME) }
					: {}),

				display: {
					folder: String(normalizeDisplay(input.FDISPLAY?.FLD)),
					sid: String(normalizeDisplay(input.FDISPLAY?.SID)),
				},

				links: input.XLNK ?? {},

				children:
					input.SOBJ?.map((child) => adapt(child, currentPath)) ?? [],
			} satisfies InternalNode;
		};

		return adapt(raw.xTree as ExternalNode);
	},
);
