export type BinaryExtension =
	| "json"
	| "unknown"
	| "pdf"
	| "jpg"
	| "jpeg"
	| "png"
	| "mpeg"
	| "svg"
	| "mp4"
	| "txt"
	| "xml"
	| "msg";

export type PdfConvertibleExtension = "pdf" | "jpg" | "jpeg" | "png";
export type AskableImageExtension = "jpg" | "jpeg" | "png";
export type DocumentImportChoice = "native" | "pdf";

export const runtimeReplaceableExtensions = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
	"mpeg",
	"svg",
	"mp4",
	"txt",
	"xml",
	"msg",
	"json",
] as const satisfies readonly BinaryExtension[];

export const pdfConvertibleExtensions = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
] as const satisfies readonly PdfConvertibleExtension[];

export const pdfAppendableExtensions = pdfConvertibleExtensions;

export const askableImageExtensions = [
	"jpg",
	"jpeg",
	"png",
] as const satisfies readonly AskableImageExtension[];


const toUnique = <T extends string>(values: readonly T[]): readonly T[] =>
	Array.from(new Set(values)) as readonly T[];

const hasExtension = <T extends string>(
	extensions: readonly string[],
	extension: T,
): boolean => extensions.includes(extension);

const isPdfConvertibleExtension = (
	extension: string,
): extension is PdfConvertibleExtension =>
	(pdfConvertibleExtensions as readonly string[]).includes(extension);

const isAskableImageExtension = (
	extension: string,
): extension is AskableImageExtension =>
	(askableImageExtensions as readonly string[]).includes(extension);

const intersectOrdered = <T extends string>(
	preferredOrder: readonly T[],
	allowed: ReadonlySet<string>,
): readonly T[] => preferredOrder.filter((value) => allowed.has(value));

export const normalizeBinaryExtension = (
	value: string | undefined,
): BinaryExtension => {
	switch (value?.trim().toLowerCase()) {
		case "json":
		case "unknown":
		case "pdf":
		case "jpg":
		case "jpeg":
		case "png":
		case "mpeg":
		case "svg":
		case "mp4":
		case "txt":
		case "xml":
		case "msg":
			return value.trim().toLowerCase() as BinaryExtension;
		default:
			return "unknown";
	}
};

const normalizeBinaryExtensionFromMimeType = (
	value: string | undefined,
): BinaryExtension => {
	switch (value?.trim().toLowerCase()) {
		case "application/pdf":
			return "pdf";
		case "image/jpeg":
		case "image/jpg":
			return "jpg";
		case "image/png":
			return "png";
		case "image/svg+xml":
			return "svg";
		case "video/mp4":
			return "mp4";
		case "video/mpeg":
		case "audio/mpeg":
			return "mpeg";
		case "application/xml":
		case "text/xml":
			return "xml";
		case "application/json":
		case "text/json":
			return "json";
		case "text/plain":
			return "txt";
		case "application/vnd.ms-outlook":
			return "msg";
		default:
			return "unknown";
	}
};

export const resolveFileBinaryExtension = (
	file: Pick<File, "name" | "type">,
): BinaryExtension => {
	const fromName = normalizeBinaryExtension(file.name.split(".").pop());

	if (fromName !== "unknown") {
		return fromName;
	}

	return normalizeBinaryExtensionFromMimeType(file.type);
};

export const normalizeNatureExtensions = (
	values: readonly string[] | undefined,
): readonly string[] =>
	toUnique(
		(values ?? [])
			.map((value) => value.trim().toLowerCase().replace(/^\./, ""))
			.filter(Boolean),
	);

const buildAcceptAttribute = (extensions: readonly string[]): string =>
	toUnique(extensions.map((extension) => `.${extension}`)).join(",");

export type DocumentImportIntent = Readonly<{
	allowed: boolean;
	extensions: readonly string[];
	accept: string;
	multiple: boolean;
}>;

export type DocumentImportPolicy = Readonly<{
	natureExtensions: readonly string[];
	replace: DocumentImportIntent;
	addPages: DocumentImportIntent;
}>;

export type DocumentImportDecision =
	| Readonly<{
			kind: "native";
			file: File;
			extension: BinaryExtension;
			policy: DocumentImportPolicy;
	  }>
	| Readonly<{
			kind: "pdf";
			files: readonly File[];
			policy: DocumentImportPolicy;
	  }>
	| Readonly<{
			kind: "ask-user";
			file: File;
			extension: AskableImageExtension;
			policy: DocumentImportPolicy;
	  }>
	| Readonly<{
			kind: "reject";
			reason: string;
			policy: DocumentImportPolicy;
	  }>;

export const resolveDocumentImportPolicy = (input: {
	natureExtensions?: readonly string[];
	currentFileType?: string;
}): DocumentImportPolicy => {
	const normalizedNatureExtensions = normalizeNatureExtensions(
		input.natureExtensions,
	);

	const normalizedCurrentFileType = normalizeBinaryExtension(
		input.currentFileType,
	);

	const hasExplicitNatureExtensions = normalizedNatureExtensions.length > 0;
	const natureAllowed = new Set(normalizedNatureExtensions);
	const pdfAllowed = hasExplicitNatureExtensions
		? natureAllowed.has("pdf")
		: normalizedCurrentFileType === "pdf";

	const nativeReplaceExtensions = hasExplicitNatureExtensions
		? intersectOrdered(runtimeReplaceableExtensions, natureAllowed)
		: runtimeReplaceableExtensions;

	const replaceExtensions = pdfAllowed
		? toUnique([
				...nativeReplaceExtensions,
				...pdfConvertibleExtensions,
		  ])
		: nativeReplaceExtensions;

	const addPagesExtensions = pdfAllowed ? pdfAppendableExtensions : [];

	return {
		natureExtensions: normalizedNatureExtensions,
		replace: {
			allowed: replaceExtensions.length > 0,
			extensions: replaceExtensions,
			accept: buildAcceptAttribute(replaceExtensions),
			multiple: pdfAllowed,
		},
		addPages: {
			allowed: addPagesExtensions.length > 0,
			extensions: addPagesExtensions,
			accept: buildAcceptAttribute(addPagesExtensions),
			multiple: addPagesExtensions.length > 0,
		},
	};
};

export const resolveDocumentImportDecision = (input: {
	files: readonly File[];
	natureExtensions?: readonly string[];
	currentFileType?: string;
	preferredChoice?: DocumentImportChoice;
}): DocumentImportDecision => {
	const files = input.files.filter(
		(file): file is File => file instanceof File,
	);

	const policy = resolveDocumentImportPolicy({
		natureExtensions: input.natureExtensions,
		currentFileType: input.currentFileType,
	});

	if (!files.length) {
		return {
			kind: "reject",
			reason: "No file selected.",
			policy,
		};
	}

	const fileExtensions = files.map((file) => resolveFileBinaryExtension(file));
	const rejectedFileIndex = fileExtensions.findIndex(
		(extension) => !policy.replace.extensions.includes(extension),
	);

	if (rejectedFileIndex >= 0) {
		return {
			kind: "reject",
			reason: `This file type is not allowed for this nature: ${files[rejectedFileIndex]?.name ?? "file"}`,
			policy,
		};
	}

	const pdfAllowed = hasExtension(policy.replace.extensions, "pdf");

	if (files.length > 1) {
		if (!policy.replace.multiple || !pdfAllowed) {
			return {
				kind: "reject",
				reason: "Multiple files can only be imported when PDF is allowed.",
				policy,
			};
		}

		if (!fileExtensions.every(isPdfConvertibleExtension)) {
			return {
				kind: "reject",
				reason: "Only PDF, JPG, JPEG and PNG files can be merged into a PDF.",
				policy,
			};
		}

		return {
			kind: "pdf",
			files,
			policy,
		};
	}

	const [file] = files;
	const [extension] = fileExtensions;
	const natureExtensions = policy.natureExtensions;
	const nativeAllowed =
		natureExtensions.length === 0 || natureExtensions.includes(extension);

	if (extension === "pdf") {
		return {
			kind: "pdf",
			files,
			policy,
		};
	}

	if (
		pdfAllowed &&
		nativeAllowed &&
		isAskableImageExtension(extension)
	) {
		if (input.preferredChoice === "native") {
			return {
				kind: "native",
				file,
				extension,
				policy,
			};
		}

		if (input.preferredChoice === "pdf") {
			return {
				kind: "pdf",
				files,
				policy,
			};
		}

		return {
			kind: "ask-user",
			file,
			extension,
			policy,
		};
	}

	if (pdfAllowed && isPdfConvertibleExtension(extension) && !nativeAllowed) {
		return {
			kind: "pdf",
			files,
			policy,
		};
	}

	if (nativeAllowed) {
		return {
			kind: "native",
			file,
			extension,
			policy,
		};
	}

	return {
		kind: "reject",
		reason: `This file type is not allowed for this nature: ${file.name}`,
		policy,
	};
};
