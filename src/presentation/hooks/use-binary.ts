import { useCallback, useEffect, useState } from "preact/hooks";
import helpers from "@/infra-structures/helpers";
import {
  converters,
  split,
  merge,
  getPdfPageImages,
} from "@/infra-structures/libraries/pdf";
import usePDFActionsStatus from "./use-pdf-actions-status";
import { usePersisterContext } from "../contexts/persister-context";

// Types
interface FileModel {
  instance: File | null;
  rotation: number;
  documentCode: string;
  isLocal: boolean;
  index: number;
}

interface PageModel {
  fileId: string;
  imageUrl: string;
  pdfUrl: string;
  pageNumber: number;
}

interface ChangeModel {
  documentCode: string;
  name: string;
  date?: string;
  expires?: string;
  status: number;
  isFileUpdated: boolean;
  isNewDocument: boolean;
}

const useBinary = (
  initialFile: File | null,
  targetExtensions: string[],
  isAdvancedConverterEnabled = false
) => {
  const { setRequest, getInitialState, save } = usePersisterContext();

  const [file, setFile] = useState<FileModel>({
    instance: initialFile || null,
    rotation: 0,
    documentCode: "",
    isLocal: !!initialFile,
    index: 0,
  });

  useEffect(() => {
    console.log("in");

    if (initialFile) {
      setFile((prev) => ({ ...prev, instance: initialFile }));
    }
  }, [initialFile]);

  const [binary, setBinary] = useState<string | null>(null);
  const [pages, setPages] = useState<PageModel[] | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const initialState = getInitialState(file.documentCode);

  const [changes, setChanges] = useState<ChangeModel>({
    documentCode: initialState.documentCode || "",
    name: initialFile?.name || initialState.name || "",
    date: initialState.documentDate,
    expires: initialState.documentExpires,
    status: initialState.status || 0,
    isFileUpdated: false,
    isNewDocument: !initialFile,
  });

  const { hasPDFTarget, isUploadEnabled, isMergeEnabled } = usePDFActionsStatus(
    file.instance ? [file.instance] : [],
    targetExtensions,
    isAdvancedConverterEnabled
  );

  const convertFileToPdf = useCallback(
    async (inputFile: File): Promise<File> => {
      if (
        !hasPDFTarget ||
        !isUploadEnabled ||
        inputFile.type === "application/pdf"
      ) {
        return inputFile;
      }

      const isImage = inputFile.type.startsWith("image/");
      const isOfficeFile = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].includes(inputFile.type);

      try {
        if (isImage) {
          return await converters.fromImage(inputFile);
        }
        if (isOfficeFile && isAdvancedConverterEnabled) {
          const convertedFile = await converters.advanced(inputFile);
          if (convertedFile) return convertedFile;
          console.warn(
            `⚠️ Échec de la conversion du fichier : ${inputFile.name}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la conversion du fichier ${inputFile.name}:`,
          error
        );
      }

      return inputFile;
    },
    [hasPDFTarget, isUploadEnabled, isAdvancedConverterEnabled]
  );

  useEffect(() => {
    const processFile = async () => {
      if (!file.instance) {
        setBinary(null);
        setPages(null);
        return;
      }

      setIsProcessing(true);

      const fileToProcess = await convertFileToPdf(file.instance);

      let extractedPages: PageModel[] | null = null;
      if (fileToProcess.type === "application/pdf") {
        const splitPages = await split(fileToProcess);
        const { images } = await getPdfPageImages(fileToProcess);

        extractedPages = splitPages.map((page, index) => ({
          fileId: fileToProcess.name,
          imageUrl: images[index],
          pdfUrl: URL.createObjectURL(page),
          pageNumber: index + 1,
        }));
      }

      const base64 = await helpers.getBase64(fileToProcess);

      setBinary(base64 as string);
      setFile((prev) => ({ ...prev, instance: fileToProcess }));
      setPages(extractedPages);
      setChanges((prev) => ({ ...prev, isFileUpdated: true }));

      setRequest({
        documentCode: changes.documentCode,
        name: changes.name,
        status: changes.status,
      });

      setIsProcessing(false);
    };

    processFile();
  }, [file.instance, convertFileToPdf, changes, setRequest]);

  const addPagesToDocument = async (newPages: File[]) => {
    if (!file.instance || !isMergeEnabled) return;

    setIsProcessing(true);

    const allFiles = [file.instance, ...newPages];
    const mergedPdf = await merge(allFiles, file.instance.name);

    const base64 = await helpers.getBase64(mergedPdf);

    const updatedPages = await split(mergedPdf).then((splitPages) =>
      splitPages.map((page, index) => ({
        fileId: mergedPdf.name,
        imageUrl: URL.createObjectURL(page),
        pdfUrl: URL.createObjectURL(page),
        pageNumber: index + 1,
      }))
    );

    setBinary(base64 as string);
    setPages(updatedPages);
    setFile((prev) => ({ ...prev, instance: mergedPdf }));

    setRequest({
      documentCode: changes.documentCode,
      name: changes.name,
      status: changes.status,
    });

    setIsProcessing(false);
  };

  return {
    file,
    binary,
    pages,
    changes,
    setFile,
    isProcessing,
    addPagesToDocument,
    save,
  };
};

export default useBinary;
