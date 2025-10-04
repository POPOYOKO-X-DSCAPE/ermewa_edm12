import type { LanguageOptions } from "./miscellaneous";

export type FileBodyRequest = {
	XDOC: {
		[documentCode: string]: {
			URL: string;
			XFILE: {
				[fileType: string]: {
					LAN: Partial<{
						[language in LanguageOptions | ""]: {
							URLDET: string;
						};
					}>;
				};
			};
		};
	};
};
