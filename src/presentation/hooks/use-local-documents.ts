import type { DocumentInterface } from "@/domain/types";
import { useState } from "preact/hooks";
import { v4 as uid } from "uuid";

const useLocalDocuments = () => {
  const [localDocuments, setLocalDocuments] = useState<
    Record<string, DocumentInterface[]>
  >({});

  const createNewDocument = (nature: string, folder: string) => {
    const key = folder + nature;
    const documentCode = uid();

    const newDocument = {
      // @ts-ignore
      nature,
      folder,
      name: {
        baseName: "New document",
        documentName: { english: "test", french: "test", german: "" },
      },
      state: 0,
      stateDescription: { english: "", german: "", french: "" },
      documentCode,
      documentDate: "",
      documentExpires: "",
      file: {
        detailedUrl: "",
        lang: "",
        shortUrl: "",
        type: "",
      },
      isLocal: true,
      isMaster: false,
      lastTimeUpdated: "",
      link: {
        state: 1,
        stateDescription: { english: "", german: "", french: "" },
      },
      url: "",
    } satisfies DocumentInterface;
    if (key) {
      setLocalDocuments((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), newDocument],
      }));
    }

    return documentCode;
  };

  const cancelDocument = (
    documentCode: string,
    natureCode: string,
    folder: string
  ) => {
    setLocalDocuments((prev) => ({
      ...prev,
      [`${folder}${natureCode}`]: prev[`${folder}${natureCode}`].filter(
        ({ documentCode: code }) => code !== documentCode
      ),
    }));
  };

  return { localDocuments, createNewDocument, cancelDocument };
};

export default useLocalDocuments;
