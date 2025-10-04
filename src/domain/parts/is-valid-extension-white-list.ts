const isValidExtensionWhiteList = (extensionWhiteList: string): boolean => {
	const handledExtensions = [
		"xls?",
		"xls",
		"xlsx",
		"ods",
		"csv",
		"doc?",
		"doc",
		"docx",
		"odt",
		"ppt",
		"pptx",
		"odp",
		"jpeg",
		"jpg",
		"png",
		"xml",
		"json",
		"txt",
		"msg",
		"pdf",
	];

	const isValid = extensionWhiteList
		.split(",")
		.map((whiteListItem) => {
			const extensions = whiteListItem.split("/");

			return extensions
				.map((extension) => handledExtensions.includes(extension))
				.every((v) => !!v);
		})
		.every((v) => !!v);

	return isValid;
};

export default isValidExtensionWhiteList;
