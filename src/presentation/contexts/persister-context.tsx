import { type Dispatch, type ReactNode, type SetStateAction, createContext, useContext, useMemo, useRef, useState } from "react";

import { DOCUMENT_STATUS_MAP } from "@/domain/types/document";
import useCases from "@/domain/use-cases";

import type { UpdateRequestInterface } from "@/interface-adapters/gateways/document-update/request-adapter";

import { useAppContext } from "./app-context";

type UpdateRequests = {
  [documentCode: string]: UpdateRequestInterface;
};

export type UpdateRequestParam = Omit<UpdateRequestInterface, "lastUpdateTime">;

const PersisterContext = createContext<{
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setForceSave: Dispatch<SetStateAction<boolean>>;
  records: UpdateRequestInterface[];
  getInitialState: (documentCode: string) => UpdateRequestInterface | null;
  setRequest: (request: UpdateRequestParam, silent?: boolean) => void;
  updateStatus: (
    newStatus: (typeof DOCUMENT_STATUS_MAP)[number]["label"],
    memo?: string
  ) => Promise<void>;
  save: () => Promise<void>;
  savable: boolean;
} | null>(null);

const extractLineFromURL = (input: string) => {
  const match = input.match(/\$LIG:(\d+)/);
  return match ? Number.parseInt(match[1], 10) : undefined;
};

export const PersisterContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const {
    navigationState: selections,
    naturesStore: naturesRegistry,
    currentNode: { document: currentDocument },
    appProfile: {
      profile: {
        parameters: {
          supervisionManagement: { parameter: supervisionLevel },
        },
      },
    },
    saveNatures,
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);

  // workaround
  const [forceSave, setForceSave] = useState(false);

  const initialRequests = useMemo(() => {
    const result: UpdateRequests = {};

    if (naturesRegistry) {
      // biome-ignore lint/complexity/noForEach: <explanation>
      Object.values(naturesRegistry).forEach((natures) =>
        // biome-ignore lint/complexity/noForEach: <explanation>
        natures.forEach((nature) =>
          // biome-ignore lint/complexity/noForEach: <explanation>
          nature.documents.forEach(
            ({
              documentCode,
              file: { detailedUrl },
              url,
              name: { baseName: name },
              state: status,
              lastTimeUpdated: lastUpdateTime,
              documentDate,
              documentExpires,
            }) => {
              const line =
                extractLineFromURL(url) || extractLineFromURL(detailedUrl);

              result[documentCode] = {
                documentCode,
                name,
                status,
                lastUpdateTime,
                line,
                ...(nature.config.documentDate && {
                  documentDate: documentDate || "",
                }),
                ...(nature.config.dueDate !== 3 && {
                  documentExpires: documentExpires || "",
                }),
              };
            }
          )
        )
      );
    }

    // console.log("initial persisted values:");
    // console.log(result);
    return result;
  }, [naturesRegistry]);

  const requests = useRef<UpdateRequests>({});
  const [records, setRecords] = useState<UpdateRequestInterface[]>([]);

  const savable = useMemo(() => {
    return forceSave && records.length > 0;
  }, [records, forceSave]);

  const setRequest = (request: UpdateRequestParam, silent = false) => {
    if (!silent) {
      setForceSave(true);
    }
    const initialRequest = initialRequests[request.documentCode];

    if (!initialRequest) {
      requests.current[request.documentCode] = {
        ...requests.current[request.documentCode],
        ...request,
      };
    } else {
      const { documentCode, name } = request;
      const diff: UpdateRequestParam = { documentCode, name };
      let hasDiff = false;

      for (const key in request) {
        const property = key as keyof UpdateRequestParam;

        if (request[property] !== initialRequest[property]) {
          // @ts-ignore
          diff[property] = request[property];
          hasDiff = true;
        }
      }

      if (hasDiff) {
        requests.current[request.documentCode] = {
          ...initialRequests[request.documentCode],
          ...requests.current[request.documentCode],
          ...diff,
        };
      } else {
        delete requests.current[request.documentCode];
      }
    }

    setRecords(Object.values(requests.current));
  };

  const getInitialState = (
    documentCode: string
  ): UpdateRequestInterface | null => {
    const mergedState = {
      ...initialRequests[documentCode],
      ...requests.current[documentCode],
    };

    return Object.keys(mergedState).length === 0 ? null : mergedState;
  };

  const save = async (documentCode?: string) => {
    if (!selections?.nature) {
      console.error("no selected nature");
      return;
    }

    const folderName = selections.folder?.name;
    const sid = selections.folder?.sid;
    const natureCode = selections.nature;
    const updateTime = currentDocument?.lastTimeUpdated;

    if (folderName && sid && natureCode) {
      const updates = Object.values(requests.current).map((request) => ({
        ...request,
        natureCode,
        master: { sid, folderName },
        lastUpdateTime: updateTime || request.lastUpdateTime,
      }));

      const update = updates.find(
        (u) =>
          u.documentCode.startsWith("DC") &&
          (u.documentCode === documentCode ||
            u.documentCode === currentDocument?.documentCode)
      );

      if (!update) {
        throw Error("No document to update.");
      }
      const payload = await useCases.updateDocuments([update]);

      if (!payload) {
        throw Error("error while trying to update the document on the server.");
      }

      const response = payload?.xRetUpdated.find(
        ({ xDocUpdated: { XDOC } }) => XDOC === update.documentCode
      );

      if (response?.xDocUpdated.UPDSTAFLG === 0) {
        const { UPDTIME, STATE, DOCDATE, DOCEXPIRE, BASENAME } =
          response.xDocUpdated;

        const restNatureObjects = naturesRegistry[sid].filter(
          ({ code }) => code !== natureCode
        );
        const natureObject = naturesRegistry[sid].find(
          ({ code }) => code === natureCode
        );

        const restDocuments =
          natureObject?.documents.filter(
            ({ documentCode: code }) => code !== update.documentCode
          ) || [];

        const currentDocument = natureObject?.documents.find(
          ({ documentCode: code }) => code === update.documentCode
        );

        if (natureObject && currentDocument) {
          saveNatures(sid, [
            ...restNatureObjects,
            {
              ...natureObject,
              documents: [
                ...restDocuments,
                {
                  ...currentDocument,
                  name: {
                    baseName: BASENAME,
                    documentName: currentDocument.name.documentName || BASENAME,
                  },
                  lastTimeUpdated: UPDTIME,
                  documentDate: DOCDATE,
                  documentExpires: DOCEXPIRE,
                  state: STATE,
                },
              ],
            },
          ]);
        }

        setForceSave(false);
      } else {
        alert(`error: failed to save document ${update.documentCode}`);
      }
    }
  };

  const updateStatus = async (
    newStatus: (typeof DOCUMENT_STATUS_MAP)[number]["label"],
    memo?: string
  ) => {
    setIsLoading(true);

    const status = DOCUMENT_STATUS_MAP.find(
      (status) => status.label === newStatus
    );

    const folderName = selections.folder?.name;
    const sid = selections.folder?.sid;
    const natureCode = selections.nature;
    const documentCode = selections.document;

    if (status && folderName && natureCode && sid && documentCode) {
      const restNatureObjects = naturesRegistry[sid].filter(
        ({ code }) => code !== natureCode
      );

      const natureObject = naturesRegistry[sid].find(
        ({ code }) => code === natureCode
      );
      const restDocuments =
        natureObject?.documents.filter(
          ({ documentCode: code }) => code !== documentCode
        ) || [];

      const currentDocument = natureObject?.documents.find(
        ({ documentCode: code }) => code === documentCode
      );

      if (!currentDocument) return;

      const toUpdate = getInitialState(documentCode);

      if (!toUpdate) return;

      const payload = await useCases.updateDocuments([
        {
          ...toUpdate,
          memo,
          status: status.index,
          lastUpdateTime: currentDocument.lastTimeUpdated,
          master: {
            folderName,
            sid,
          },
          natureCode,
        },
      ]);

      const response = payload?.xRetUpdated.find(
        ({ xDocUpdated: { XDOC } }) => XDOC === documentCode
      );

      if (response?.xDocUpdated.UPDSTAFLG === 0) {
        const { UPDTIME, STATE, DOCDATE, DOCEXPIRE, BASENAME } =
          response.xDocUpdated;

        if (natureObject && currentDocument) {
          saveNatures(sid, [
            ...restNatureObjects,
            {
              ...natureObject,
              documents: [
                ...restDocuments,
                ...(STATE !== 4 ||
                (STATE === 4 && Number(supervisionLevel) >= 100)
                  ? [
                      {
                        ...currentDocument,
                        lastTimeUpdated: UPDTIME,
                        state: STATE,
                        documentDate: DOCDATE,
                        documentExpires: DOCEXPIRE,
                        memo,
                        name: {
                          baseName: BASENAME,
                          documentName:
                            currentDocument.name.documentName || BASENAME,
                        },
                      },
                    ]
                  : []),
              ],
            },
          ]);
        }
      } else {
        alert("error: document status could not be updated.");
      }
    } else {
      console.error(`invalid status: ${newStatus}`);
    }

    setIsLoading(false);
  };

  return (
    <PersisterContext.Provider
      value={{
        isLoading,
        setIsLoading,
        setForceSave,
        records,
        setRequest,
        getInitialState,
        updateStatus,
        save,
        savable,
      }}
    >
      {children}
    </PersisterContext.Provider>
  );
};

export const usePersisterContext = () => {
  const context = useContext(PersisterContext);

  if (!context) {
    throw new Error(
      "usePersisterContext must be used within the scope of PersisterContextProvider"
    );
  }

  return context;
};
