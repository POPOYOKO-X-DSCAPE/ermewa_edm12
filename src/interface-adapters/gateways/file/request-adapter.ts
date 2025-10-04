import type { FileBodyRequest } from "@/interface-adapters/external-types/file";

const adaptFileBodyRequest = (input: {
	documentCode: string;
	extension: string;
	url: string;
	detailedUrl: string;
}): FileBodyRequest => {
	const { documentCode, extension, url, detailedUrl } = input;

	return {
		XDOC: {
			[documentCode]: {
				URL: url.split("//")[1],
				XFILE: {
					[extension.toUpperCase()]: {
						LAN: {
							"": {
								URLDET: detailedUrl, //.split('//')[1]
							},
						},
					},
				},
			},
		},
	};
};

export default adaptFileBodyRequest;
