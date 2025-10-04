import type {
	NatureMaskInterface,
	NaturesInterface,
} from "@/domain/types";

export type NatureObject = {
	config: NaturesInterface[string]["natures"][string];
	folderName: string;
} & NatureMaskInterface[string];

export type FolderName = Partial<{
	[key in "french" | "german" | "english" | "default"]: {
		short: string;
		description: string;
	};
}>;

export type FolderTreeInterface = {
	sid: string;
	level: string;
	name: string;
	type: string;
	status: string;
	path: string[];
	natures: NatureObject[];
	folder?: string;
	display: {
		folder: boolean | "ondemand";
		sid: boolean | "ondemand";
	};
	folderName?: FolderName;
	links: Record<string, unknown>;
	children?: FolderTreeInterface[];
};
