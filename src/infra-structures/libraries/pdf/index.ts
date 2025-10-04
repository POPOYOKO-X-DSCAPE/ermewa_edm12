import { PageSizes, PDFDocument, rgb } from "pdf-lib";
import { getDocument as getPdfDocument } from "pdfjs-dist/";

import helpers from "../../helpers";

const { getArrayBuffer, getFileNameAndExtension, createBase64 } = helpers;

type ValueOf<T> = T[keyof T];

const converters = {
  fromImage: async (image: File) => {
    const embedMap = {
      png: "embedPng",
      jpeg: "embedJpg",
      jpg: "embedJpg",
    } as const;

    const [fileName, extension] = <[string, keyof typeof embedMap]>(
      getFileNameAndExtension(image.name)
    );
    const embed: ValueOf<typeof embedMap> = embedMap[extension];

    const document = await PDFDocument.create();
    const imageBuffer = await image.arrayBuffer();
    const img = await document[embed](imageBuffer);

    const page = document.addPage(PageSizes.A4);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const scaleFactor = Math.min(pageWidth / img.width, pageHeight / img.height, 1);
    const imageWidth = img.width * scaleFactor;
    const imageHeight = img.height * scaleFactor;

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });

    page.drawImage(img, {
      x: (pageWidth - imageWidth) / 2,
      y: (pageHeight - imageHeight) / 2,
      width: imageWidth,
      height: imageHeight,
    });

    const newDocument = await document.save();

    return new File([newDocument], `${fileName}.pdf`, {
      type: "application/pdf",
    });
  },
  advanced: async (file: File) => {
    try {
      const fileContent = await createBase64.fromFile(file);
      const [fileName, extension] = file.name.split(/(?=\.[^.]+$)/);

      const body = JSON.stringify({
        fileName,
        fileContent,
        encoding: "base64",
        mimeType: file.type,
        ext: extension,
      });

      console.log(body);

      // const response = await fetch("http://localhost:2099/pdfGenerator/convert", {
      const response = await fetch(
        "http://localhost:2099/pdfGenerator/convert",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const { pdfFileContent } = await response.json();

      const buffer = getArrayBuffer(pdfFileContent);
      const newDocument = await (await PDFDocument.load(buffer)).save();
      const res = new File([newDocument], `${fileName}.pdf`, {
        type: "application/pdf",
      });

      return res;
    } catch (error: unknown) {
      console.error(error);
    }
  },
};

const split = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const PDF = await PDFDocument.load(buffer);

  const files = await Promise.all(
    PDF.getPages().map(async (_, index) => {
      const newDocument = await PDFDocument.create();
      const [copiedPage] = await newDocument.copyPages(PDF, [index]);
      newDocument.addPage(copiedPage);
      const saved = await newDocument.save();

      return new File(
        [saved],
        `${getFileNameAndExtension(file.name)[0]}-${index + 1}.pdf`,
        { type: "application/pdf" }
      );
    })
  );

  return files;
};

const merge = async (files: File[], filename: string) => {
  try {
    const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));

    const PDFDocuments = await Promise.all(
      buffers.map((buffer) =>
        PDFDocument.load(buffer, { ignoreEncryption: true })
      )
    );

    const [PDFFirstDocument, ...PDFRestDocuments] = PDFDocuments;

    for (const PDFRestDocument of PDFRestDocuments) {
      const pages = await PDFFirstDocument.copyPages(
        PDFRestDocument,
        PDFRestDocument.getPageIndices()
      );

      let fileIndex = 1;
      for (const page of pages) {
        PDFFirstDocument.addPage(page);
        fileIndex++;
      }
    }

    const merged = await PDFFirstDocument.save();
    const mergedFile = new File([merged], `${filename}.pdf`, {
      type: "application/pdf",
    });

    return mergedFile;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

const getPDFPageCountFromFile = async (
  file: File,
  cb: (pageCount: number) => void = (pageCount) => pageCount
) => {
  if (file.type !== "application/pdf") return 0;

  const buffer = await file.arrayBuffer();
  const document = await PDFDocument.load(buffer);
  const count = document.getPageCount();

  return cb(count);
};

const getPdfPageImages = async (file: File) => {
  const url = URL.createObjectURL(file);

  const pdf = await getPdfDocument(url).promise;
  const pageImages: Promise<string>[] = [];
  const pageCount = pdf.numPages;

  for (let i = 0; i < pageCount; i++) {
    const pageImagePromise = (async () => {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 1 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Canvas context not available");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      return canvas.toDataURL("image/png");
    })();

    pageImages.push(pageImagePromise);
  }

  const images = await Promise.all(pageImages);

  pdf.destroy();
  URL.revokeObjectURL(url);

  return { images, pageCount };
};

export { converters, split, merge, getPDFPageCountFromFile, getPdfPageImages };
