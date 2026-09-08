import { PDFDocument } from "pdf-lib";

export type PdfConvertibleFileExtension = "pdf" | "jpg" | "jpeg" | "png";

export type ConvertedPdfArtifact = Readonly<{
	bytes: Uint8Array;
	blob: Blob;
	base64: string;
	fileName: string;
}>;

const bytesToBlob = (bytes: Uint8Array): Blob => {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);

	return new Blob([buffer], {
		type: "application/pdf",
	});
};

const blobToBase64DataUrl = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("blob to base64 failed"));
				return;
			}

			resolve(result);
		};

		reader.onerror = () => {
			reject(reader.error ?? new Error("blob to base64 failed"));
		};

		reader.readAsDataURL(blob);
	});

const loadFileBytes = async (file: File): Promise<Uint8Array> => {
	const arrayBuffer = await file.arrayBuffer();
	return new Uint8Array(arrayBuffer);
};

const stripFileExtension = (value: string): string => {
	const trimmed = value.trim();
	const lastDotIndex = trimmed.lastIndexOf(".");

	if (lastDotIndex <= 0) {
		return trimmed || "document";
	}

	return trimmed.slice(0, lastDotIndex) || "document";
};

export const resolvePdfConvertibleFileExtension = (
	file: Pick<File, "name" | "type">,
): PdfConvertibleFileExtension | "unknown" => {
	const fromName = file.name.split(".").pop()?.trim().toLowerCase();

	switch (fromName) {
		case "pdf":
		case "jpg":
		case "jpeg":
		case "png":
			return fromName;
		default:
			break;
	}

	switch (file.type.trim().toLowerCase()) {
		case "application/pdf":
			return "pdf";
		case "image/jpeg":
		case "image/jpg":
			return "jpg";
		case "image/png":
			return "png";
		default:
			return "unknown";
	}
};

const appendPdfFile = async (
	target: PDFDocument,
	file: File,
): Promise<void> => {
	const bytes = await loadFileBytes(file);
	const source = await PDFDocument.load(bytes);
	const pageIndices = source.getPageIndices();

	if (!pageIndices.length) {
		return;
	}

	const copiedPages = await target.copyPages(source, pageIndices);
	for (const page of copiedPages) {
		target.addPage(page);
	}
};

const appendImageFile = async (
	target: PDFDocument,
	file: File,
	extension: "jpg" | "jpeg" | "png",
): Promise<void> => {
	const bytes = await loadFileBytes(file);
	const image =
		extension === "png"
			? await target.embedPng(bytes)
			: await target.embedJpg(bytes);

	const page = target.addPage([image.width, image.height]);

	page.drawImage(image, {
		x: 0,
		y: 0,
		width: image.width,
		height: image.height,
	});
};

export const convertFilesToPdfBytes = async (
	files: readonly File[],
): Promise<Uint8Array> => {
	const normalizedFiles = files.filter(
		(file): file is File => file instanceof File,
	);

	if (!normalizedFiles.length) {
		throw new Error("No file selected for PDF conversion.");
	}

	const target = await PDFDocument.create();

	for (const file of normalizedFiles) {
		const extension = resolvePdfConvertibleFileExtension(file);

		switch (extension) {
			case "pdf":
				await appendPdfFile(target, file);
				break;

			case "jpg":
			case "jpeg":
			case "png":
				await appendImageFile(target, file, extension);
				break;

			default:
				throw new Error(
					`Unsupported file type for PDF conversion: ${file.name}`,
				);
		}
	}

	return await target.save();
};

export const convertFilesToPdfArtifact = async (
	files: readonly File[],
): Promise<ConvertedPdfArtifact> => {
	const bytes = await convertFilesToPdfBytes(files);
	const blob = bytesToBlob(bytes);
	const base64 = await blobToBase64DataUrl(blob);
	const firstFile = files[0];
	const fileName =
		files.length === 1 && firstFile
			? `${stripFileExtension(firstFile.name)}.pdf`
			: `${stripFileExtension(firstFile?.name ?? "document")}.pdf`;

	return {
		bytes,
		blob,
		base64,
		fileName,
	};
};
