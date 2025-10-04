import {
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist";

import { repositories } from "../repositories";
import { converters } from "@/infra-structures/libraries/pdf";

const pendingPagesQueue: {
  documentId: string;
  fileId: string;
  pageIndex: number;
  pageNumber?: number;
  distance: number;
  imageInstance?: File;
  pdfInstance?: File;
}[] = [];

const documentState: {
  [documentId: string]: { nextPageNumber: number; fileOrder: string[] };
} = {};

function initializeDocument(documentId: string) {
  if (!documentState[documentId]) {
    documentState[documentId] = {
      nextPageNumber: 1, // Start numbering from 1
      fileOrder: [],
    };
  }
}

function initializePendingPages(
  documentId: string,
  fileId: string,
  numPages: number
) {
  for (let i = 0; i < numPages; i++) {
    pendingPagesQueue.push({
      documentId,
      fileId,
      pageIndex: i,
      pageNumber: i + 1,
      distance: Number.POSITIVE_INFINITY,
    });
  }
}

function updateRepositoryWithPage(
  fileId: string,
  pageNumber: number,
  imageInstance: File,
  pdfInstance: File
) {
  repositories.pages.create({
    pageNumber,
    fileId,
    imageInstance,
    pdfInstance,
  });
}

async function renderPdfPage(
  pdfDocument: PDFDocumentProxy,
  pageIndex: number
): Promise<{ imageInstance: File; pdfInstance: File }> {
  const page: PDFPageProxy = await pdfDocument.getPage(pageIndex + 1);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  const viewport = page.getViewport({ scale: 1.5 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  const imageBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/png")
  );

  if (!imageBlob) {
    throw new Error(`Failed to create image for page ${pageIndex}`);
  }

  const imageInstance = new File([imageBlob], `page_${pageIndex + 1}.png`, {
    type: "image/png",
  });
  const pdfBlob = await converters.fromImage(imageInstance);
  const pdfInstance = new File([pdfBlob], `page_${pageIndex + 1}.pdf`, {
    type: "application/pdf",
  });

  canvas.width = 0;
  canvas.height = 0;

  return { imageInstance, pdfInstance };
}

async function processPdfFile(documentId: string, file: File, fileId: string) {
  const pdfUrl = URL.createObjectURL(file);
  const loadingTask = getDocument(pdfUrl);
  const pdfDocument: PDFDocumentProxy = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  repositories.files.update(fileId, { pageCount: numPages });

  URL.revokeObjectURL(pdfUrl);

  initializePendingPages(documentId, fileId, numPages);

  for (let i = 0; i < numPages; i++) {
    const { imageInstance, pdfInstance } = await renderPdfPage(pdfDocument, i);
    const document = documentState[documentId];
    const pageNumber = document.nextPageNumber++;

    updateRepositoryWithPage(fileId, pageNumber, imageInstance, pdfInstance);
    // console.log(
    //   `Page ${i + 1}/${numPages} processed (displayed as ${pageNumber}).`
    // );
  }
}

async function processImageFile(
  documentId: string,
  file: File,
  fileId: string
) {
  const document = documentState[documentId];
  const pageNumber = document.nextPageNumber++;

  const pdfBlob = await converters.fromImage(file);
  const pdfInstance = new File([pdfBlob], `${file.name}.pdf`, {
    type: "application/pdf",
  });

  pendingPagesQueue.push({
    documentId,
    fileId,
    pageIndex: 0,
    pageNumber,
    imageInstance: file,
    pdfInstance,
    distance: Number.POSITIVE_INFINITY,
  });

  updateRepositoryWithPage(fileId, pageNumber, file, pdfInstance);
}

async function processGenericFile(
  documentId: string,
  fileId: string,
  file: File
) {
  const document = documentState[documentId];
  const pageNumber = document.nextPageNumber++;

  pendingPagesQueue.push({
    documentId,
    fileId,
    pageIndex: 0,
    pageNumber,
    imageInstance: file,
    pdfInstance: file,
    distance: Number.POSITIVE_INFINITY,
  });

  repositories.pages.create({
    pageNumber,
    fileId,
    imageInstance: file,
    pdfInstance: file,
  });
}

const loadFilePages = async (
  documentId: string,
  file: File,
  fileId: string
) => {
  const fileType = file.type;

  initializeDocument(documentId);
  documentState[documentId].fileOrder.push(fileId);

  if (fileType.startsWith("image/")) {
    await processImageFile(documentId, file, fileId);
  } else if (fileType === "application/pdf") {
    await processPdfFile(documentId, file, fileId);
  } else {
    processGenericFile(documentId, fileId, file);
  }
};

function updatePagePriorities(scrollPosition: number, viewportHeight: number) {
  for (const page of pendingPagesQueue) {
    const pagePosition = page.pageIndex * 1000;
    page.distance = Math.abs(
      pagePosition - scrollPosition - viewportHeight / 2
    );
  }
}

function getScrollHandler(scrollElement: HTMLElement) {
  return () => {
    const viewportHeight = scrollElement.clientHeight;
    const scrollPosition = scrollElement.scrollTop;
    updatePagePriorities(scrollPosition, viewportHeight);
  };
}

export { loadFilePages, getScrollHandler };
