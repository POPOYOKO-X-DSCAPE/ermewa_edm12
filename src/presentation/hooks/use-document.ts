import { useMemo } from "react";

import { v4 as uid } from "uuid";

import type { DocumentInterface } from "@/domain/types";
import { DOCUMENT_STATUS_MAP } from "@/domain/types/document";

import helpers from "@/infra-structures/helpers";
import { merge } from "@/infra-structures/libraries/pdf";

import useCases from "@/domain/use-cases";
import { useAppContext } from "@/presentation/contexts/app-context";
import { usePersisterContext } from "@/presentation/contexts/persister-context";

import { repositories } from "@/domain/repositories";
import { LANG_MAP } from "@/interface-adapters/gateways/app-profile/response-adapter";
import usePDFActionsStatus from "./use-pdf-actions-status";
import useRepository from "./use-repository";

const useDocument = () => {
  const {
    appProfile: {
      profile: {
        parameters: {
          documentManagement: { parameter: authorizations },
          supervisionManagement: { parameter: supervisionLevel },
          fileManagement: { parameter: fileAllowedActions },
          defaultUploadStatus: { parameter: statusWithControl },
          uncontrolledDocumentStatus: { parameter: statusWhenUncontrolled },
          mode: { parameter: mode },
        },
      },
      user: { languages },
    },
    currentNode: { document: currentDocument, nature, folder },
    currentFiles,
    displayedFile,
    isEditionMode,
    toggleEditionMode,
    naturesStore,
    saveNatures,
    isConverterEnabled,
    navigateFn,
    setLocalMemory,
  } = useAppContext();

  const { records } = usePersisterContext();

  const fileEntities = useRepository(repositories.files);
  const pageEntities = useRepository(repositories.pages);

  const extensions = useMemo(() => nature?.config.extension, [nature]);
  const language = Object.values(LANG_MAP).find((lang) =>
    lang === "default" ? "english" : languages.includes(lang)
  );

  const {
    isMergeEnabled,
    isUploadEnabled,
    extensionsAllowedOnDrop,
    extensionsUnavailableMap,
    extensionsAllowedOnDropMap,
  } = usePDFActionsStatus(
    currentFiles.map(({ instance }) => instance),
    extensions?.split(",") || [],
    isConverterEnabled
  );
  const { getInitialState, setRequest, isLoading, setIsLoading, setForceSave } =
    usePersisterContext();

  const isSupervisor = useMemo(() => {
    return Number(supervisionLevel) > 0;
  }, [supervisionLevel]);

  const status = useMemo(() => {
    if (currentDocument) {
      const index = currentDocument.state;
      return DOCUMENT_STATUS_MAP[index];
    }

    return DOCUMENT_STATUS_MAP[0];
  }, [currentDocument]);

  const isActionAllowed = (actionAllowed: boolean) => {
    if (mode === "READONLY") return false;
    if (mode === "EDIT") return actionAllowed;
    if (mode === "UPLOAD") {
      const validStatus = ["rejected", "pending"];
      return (validStatus.includes(status.label)) && actionAllowed;
    }
    return false;
  };

  const documentRights = useMemo(() => {
  const hasAuth = (key: string) => authorizations === "*" || authorizations.includes(key);
  
  return {
    canUpload: hasAuth("U"),
    canValidate: hasAuth("V"),
    canReject: hasAuth("R"),
    canSuppress: hasAuth("S"),
    canDelete: hasAuth("D"),
    canLink: hasAuth("L"),
    canMove: hasAuth("M"),
    modeEdit: mode === "EDIT",
    modeUpload: mode === "UPLOAD",
    modeReadonly: mode === "READONLY",
  };
}, [authorizations, mode]);

const fileActions = useMemo(() => {
  const hasFileAuth = (key: string) =>
    fileAllowedActions === "*" || fileAllowedActions.includes(key);
  return {
    canCopy: hasFileAuth("C"),
    canDownload: hasFileAuth("D"),
    canMail: hasFileAuth("M"),
    canSuppress: hasFileAuth("S"),
  };
}, [fileAllowedActions]);

  const getDefaultStatus = (natureCode: string, sid: string) => {
    const targetedNature = naturesStore[sid].find(
      ({ code }) => code === natureCode
    );

    if (!targetedNature) {
      throw Error(
        `Failed to identify nature: ${natureCode} for the folder ${sid}`
      );
    }

    const isControllable = targetedNature.config.isControllable;

    return isControllable
      ? Number.parseInt(statusWithControl)
      : Number.parseInt(statusWhenUncontrolled);
  };

  const initialRecord = useMemo(
    () => getInitialState(currentDocument?.documentCode || ""),
    [currentDocument?.documentCode, getInitialState]
  );

  const formAdapters = useMemo(() => {
    const documentForm = {
      name: initialRecord?.name || initialRecord?.documentCode,
      date: initialRecord?.documentDate,
      expires: initialRecord?.documentExpires,
    };

    const adapters = {} as {
      [key in keyof typeof documentForm]: {
        set: (value: string) => void;
        value: string | undefined;
      };
    };

    for (const key in documentForm) {
      const property = key as keyof typeof documentForm;
      const adapter = {
        value: documentForm[property],
        set: (value: string) => {
          if (initialRecord) {
            const { documentCode, name } = initialRecord;

            switch (property) {
              case "name":
                setRequest?.({ documentCode, name: value });
                break;
              case "date":
                setRequest?.({ documentCode, name, documentDate: value });
                break;
              case "expires":
                setRequest?.({ documentCode, name, documentExpires: value });
                break;
            }
          }
        },
      };
      adapters[property] = adapter;
    }

    return adapters;
  }, [setRequest, initialRecord]);

  const createNewDocument = (
    natureCode: string,
    folderSid: string,
    silent = false
  ) => {
    const defaultStatus = getDefaultStatus(natureCode, folderSid);

    if (defaultStatus === null) {
      console.error("no nature selected.");
      return;
    }

    const documentCode = uid();

    const newDocument = {
      name: {
        baseName: "New document",
        documentName: { english: "test", french: "test", german: "" },
      },
      state: defaultStatus,
      stateDescription: { english: "", german: "", french: "" },
      documentCode,
      documentDate: new Date().toISOString().split("T")[0],
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
      url: "",
    } satisfies DocumentInterface;

    if (!silent) {
      const restNatureObjects = naturesStore[folderSid].filter(
        ({ code }) => code !== natureCode
      );
      const natureObject = naturesStore[folderSid].find(
        ({ code }) => code === natureCode
      );

      if (natureObject) {
        saveNatures(folderSid, [
          ...restNatureObjects,
          {
            ...natureObject,
            documents: [...natureObject.documents, newDocument],
          },
        ]);
      }
    }

    return documentCode;
  };
  const cancelDocument = (
    documentCode: string,
    natureCode: string,
    folderSid: string
  ) => {
    const restNatureObjects = naturesStore[folderSid].filter(
      ({ code }) => code !== natureCode
    );

    const targetNature = naturesStore[folderSid].find(
      ({ code }) => code === natureCode
    );

    if (targetNature) {
      saveNatures(folderSid, [
        ...restNatureObjects,
        {
          ...targetNature,
          documents: targetNature.documents.filter(
            (document) => document.documentCode !== documentCode
          ),
        },
      ]);
    }
  };

  const updateFile = async (fileInstance: File) => {
    const documentCode = currentDocument?.documentCode;
    if (!documentCode || !initialRecord) return;

    const base64: string = (await helpers.getBase64(fileInstance)) as string;
    console.log(fileInstance);

    setRequest({
      documentCode,
      name: initialRecord?.name,
      fileData: {
        binary: base64,
        encoding: "base64",
        extension: fileInstance.name.split(".").pop() || "undefined",
        language,
      },
    });
  };

  const copyDocument = async () => {
    if (!currentDocument || (!isMergeEnabled && currentFiles.length > 2))
      return;

    setLocalMemory("copiedFileId", currentDocument.documentCode);

    try {
      let instance: File;

      if (isMergeEnabled) {
        instance = await merge(
          currentFiles.map(({ instance }) => instance),
          currentDocument.name.baseName
        );
      } else {
        instance = currentFiles[0].instance;
      }

      setLocalMemory("clipboard", instance);

      const fileContent = await helpers?.createBase64.fromFile(instance);
      const [fileName, extension] = instance.name.split(/(?=\.[^.]+$)/);

      const body = JSON.stringify({
        fileName,
        fileContent,
        encoding: "base64",
        mimeType: instance.type,
        ext: extension,
      });

      const response = await fetch(
        `${import.meta.env.VITE_LOCALHOST}/CopyAndPaste/clipboard`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      console.log(response);

      return response;
    } catch (error) {
      console.error(error);
    }
  };

  const uploadDocument = async () => {
    if (!folder || !nature || !currentDocument || !isUploadEnabled) return;

    const record = records.find(
      (record) => record.documentCode === currentDocument.documentCode
    );

    const {
      name: { baseName, documentName },
      documentDate,
      documentExpires,
    } = currentDocument;

    const toUpload = {
      ...currentDocument,
      name: {
        baseName: record?.name || baseName,
        documentName: {
          english: record?.name || documentName.english,
          french: record?.name || documentName.french,
          german: record?.name || documentName.german,
        },
      },
      documentDate: record?.documentDate || documentDate,
      documentExpires: record?.documentExpires || documentExpires,
    } satisfies typeof currentDocument;

    if (!record?.fileData) {
      console.error("No binary content found.");
      return;
    }

    const {
      fileData: { binary, extension },
    } = record;
    
    const response = (
      await useCases.uploadDocument({
        folderSid: folder?.sid,
        natureCode: nature.code,
        document: toUpload,
        object: folder.name,
        base64: binary,
        format: extension,
        // publication: '',
        language,
      })
    )?.xRetUploaded[0].xDocUploaded;

    if (!response) {
      return;
    }

    const restNatureObjects = naturesStore[folder.sid].filter(
      ({ code }) => code !== nature.code
    );
    const natureObject = naturesStore[folder.sid].find(
      ({ code }) => code === nature.code
    );

    const restDocuments =
      natureObject?.documents.filter(
        ({ documentCode: code }) => code !== currentDocument.documentCode
      ) || [];

    if (natureObject && currentDocument && response.UPDSTAFLG === 0) {
      const instance = helpers.base64ToFile(
        record.fileData.binary,
        `${record.name}.${extension}`
      );
      const files = fileEntities.filter(
        ({ state: { documentCode } }) =>
          documentCode === currentDocument?.documentCode
      );

      const [container, ...otherFiles] = files;
      console.log(container);
      console.log(otherFiles);

      container.patch({
        isLocal: false,
        documentCode: response.XDOC,
        instance,
      });
      for (const otherFile of [container, ...otherFiles]) {
        const pages = pageEntities.filter(
          ({ state: { fileId } }) => fileId === otherFile.meta.id
        );
        for (const page of pages) {
          page.patch({ fileId: container.meta.id });
        }
        repositories.files.delete(otherFile.meta.id);
      }

      saveNatures(folder.sid, [
        ...restNatureObjects,
        {
          ...natureObject,
          documents: [
            ...restDocuments,
            {
              ...currentDocument,
              lastTimeUpdated: response.UPDTIME,
              state: response.STATE,
              documentCode: response.XDOC,
              file: {
                lang: response.XDOAFILEDATA[0]?.CODLAN,
                type: response.XDOAFILEDATA[0]?.CODTYP,
                detailedUrl: response.XDOAFILEDATA[0]?.URLDET,
                shortUrl: response.XDOAFILEDATA[0]?.URLSHO,
              },
              url: response.XDOAFILEDATA[0]?.URLDET,
              documentDate: response.DOCDATE,
              name: { ...currentDocument.name, baseName: response.BASENAME },
              isLocal: false,
            },
          ],
        },
      ]);

      navigateFn({
        folder: { name: folder.name, sid: folder.sid },
        nature: nature.code,
        document: response.XDOC,
      });

      setForceSave(false);
    } else {
      alert("Error: upload attempt failed.");
    }
  };

  const deleteDocument = async () => {
    try {
      if (currentDocument) {
        console.log(currentDocument);

        const {
          documentCode,
          url,
          file: { lang, detailedUrl, shortUrl, type },
          state,
        } = currentDocument;

        await useCases.deleteDocument({
          documentCode,
          fullUrl: detailedUrl,
          shortUrl,
          url,
          state,
          language: lang,
          fileExtension: type,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const download = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFiles[0].instance.name;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    isLoading,
    setIsLoading,
    extensions,
    extensionsAllowedOnDrop,
    extensionsMap: [...extensionsAllowedOnDropMap, ...extensionsUnavailableMap],
    isMergeEnabled,
    isUploadEnabled,
    selectedDocument: currentDocument,
    formAdapters,
    isSupervisor,
    documentRights,
    fileActions,
    isEditionMode,
    initialState: currentDocument?.documentCode
      ? getInitialState(currentDocument.documentCode)
      : null,
    initialRecord,
    isLocal: currentDocument?.isLocal,
    status,
    currentFiles,
    displayedFile,
    isActionAllowed,
    toggleEditionMode,
    createNewDocument,
    copyDocument,
    updateFile,
    uploadDocument,
    deleteDocument,
    downloadDocument: async () => {
      if (!currentDocument) return;

      if (isMergeEnabled || currentFiles.length === 1) {
        const mergedFile = await merge(
          currentFiles.map(({ instance }) => instance),
          `${currentDocument.name.baseName}.pdf`
        );
        download(mergedFile);
      }
    },
    cancelDocument,
    cancel: () => {
      cancelDocument(
        currentDocument?.documentCode || "",
        nature?.code || "",
        folder?.sid || ""
      );
    },
  };
};

export default useDocument;
