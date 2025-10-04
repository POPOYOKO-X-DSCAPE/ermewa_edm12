import { createAbstractUseCaseBuilder } from "@packages/free";

import { converters, merge, split } from "@/infra-structures/libraries/pdf";
import { context } from "./context";
import { repositories } from "./repositories";

import helpers from "@/infra-structures/helpers/";
import services from "@/infra-structures/services";

import type {
  AppProfileResponse,
  DeleteBodyRequest,
  DeleteResponse,
  DisplaySelectResponse,
  DocumentBodyResponse,
  DocumentResponse,
  FolderTreeResponse,
  NatureMaskResponse,
  NaturesResponse,
  UpdateResponse,
  UploadBodyRequest,
  UploadResponse,
} from "@/interface-adapters/external-types/";

import {
  adaptAppProfileResponse,
  adaptDocumentDeleteRequest,
  adaptDocumentResponse,
  adaptDocumentUpdateRequest,
  adaptDocumentUploadRequest,
  adaptFileBodyRequest,
  adaptFolderTree,
  adaptNatureMasks,
  adaptNatures,
  adaptRejectEmailInfo,
} from "@/interface-adapters/gateways";
import type { LANG_MAP } from "@/interface-adapters/gateways/app-profile/response-adapter";

import type { EmailBodyRequest } from "@/interface-adapters/external-types/email";
import type { RejectEmailInfoResponse } from '@/interface-adapters/external-types/reject-email-info';
import adaptDisplaySelectResponse from '@/interface-adapters/gateways/display-select/response-adapter';
import type { DeleteRequestInterface } from "@/interface-adapters/gateways/document-delete/request-adapter";
import type { FullUpdateRequestInterface } from "@/interface-adapters/gateways/document-update/request-adapter";
import type { DocumentInterface, EmailInterface, NatureObject } from "./types";

const seedsEnabled = import.meta.env.VITE_API_ENABLE_SEEDS;

import extractInitialFolderPath from "./parts/extract-initial-folder-path";
import parseErmiEscapeSequence from "./parts/parse-ermi-escape-sequence";
import { getScrollHandler, loadFilePages } from "./parts/pdf-loading-utilities";

const createUseCaseBuilder = createAbstractUseCaseBuilder(repositories);

const { createUseCase } = createUseCaseBuilder({
  context,
  api: services,
  helpers,
});

const useCases = createUseCase(
  ({ repositories, services: { context: ctx, api, helpers } }) => ({
    initializeApp: async () => {
      try {
        const isDev = import.meta.env.MODE === "development";
        const seedsEnabled = import.meta.env.VITE_API_ENABLE_SEEDS;

        if (isDev && !seedsEnabled) {
          await services.dummy.get.auth();
        }        

        const [{ data: appProfileResponse }, { data: folderTreeResponse }] =
          await Promise.all([
            api.ermewa.get.appProfile<AppProfileResponse>(),
            api.ermewa.get.folderTree<FolderTreeResponse>(),
          ]);

        const [{ data: displaySelectResponse }, appProfileJson, folderTreeJson] = await Promise.all([
          await services.ermewa.get.displaySelect<DisplaySelectResponse>(),
          await appProfileResponse.json(),
          await folderTreeResponse.json(),
        ]);

        const displaySelectJson = await displaySelectResponse.json();
        const adaptedDisplaySelect = Object.keys(Object(displaySelectJson)).length > 0 ? adaptDisplaySelectResponse(displaySelectJson) : undefined; 

        const isFolderTreeDefined = Object.keys(folderTreeJson.xTree).length > 0;
        
        const folderTree = isFolderTreeDefined ? adaptFolderTree(folderTreeJson.xTree) : undefined;
        const loadingPath = folderTree ? extractInitialFolderPath(folderTree) : [];
        
        const mapping = {
          XPRM: appProfileJson,
          XTREE: folderTreeJson.xTree,
        };
        const appTitle = parseErmiEscapeSequence(
          appProfileJson.PRF.PRM.TITLE.PRM,
          // @ts-ignore
          mapping,
          appProfileJson.USER.LAN[0]
        );

        return {
          appProfile: adaptAppProfileResponse(appProfileJson),
          displaySelect: adaptedDisplaySelect,
          folderTree,
          loadingPath,
          appTitle,
        };
      } catch (error) {
        console.error(error);
      }
    },
    loadFolderContent: async (
      folderKeys: { object: string; sid: string },
      isSupervisor?: boolean
    ) => {
      const { object: folderName } = folderKeys;
      const showRemovedDocuments = isSupervisor;

      const natureMaskPromise = api.ermewa.get
        .naturesMasks<NatureMaskResponse>({
          params: { ...folderKeys },
        })
        .then(async ({ data }) => {
          const response = await data.json();

          return adaptNatureMasks(response, showRemovedDocuments);
        })
        .catch((e) => console.error(e));

      const naturesPromise = api.ermewa.get
        .natures<NaturesResponse>({
          params: { ...folderKeys },
        })
        .then(async ({ data }) => {
          const response = await data.json();
          return adaptNatures(response);
        });

      const [natureMask, natures] = await Promise.all([
        natureMaskPromise,
        naturesPromise,
      ]);

      let result: NatureObject[] = [];
      if (natures && natureMask) {
        result = natures[folderName]
          ? Object.values(natures[folderName].natures).map((nature) => ({
              ...natureMask[nature.code],
              folderName: folderName,
              config: nature,
            }))
          : [];
      }

      return result.filter((nature) => nature.headers?.isMaster);
    },
    addFiles: (
      documentCode: string,
      callback: (
        filePromises: Promise<{ fileId: string; instance: File }>[]
      ) => void,
      accept?: string
    ) => {
      const input = document.createElement("input");

      input.type = "file";
      input.multiple = true;
      input.style.display = "none";

      if (accept) input.accept = accept;

      input.onchange = async (e: Event) => {
        const element = e.currentTarget as HTMLInputElement;
        const fileList: FileList | null = element.files;

        if (fileList !== null && fileList.length > 0) {
          const filePromises = Array.from(fileList).map(async (instance) => {
            const safeInstanceName = instance.name
              .split(".")
              .map((part, index, array) =>
                index === array.length - 1 ? part.toLowerCase() : part
              )
              .join(".");

            // @ts-ignore
            const [{ id: fileId }] = repositories.files.create({
              instance: new File([instance], safeInstanceName, {
                type: instance.type,
              }),
              documentCode,
              isLocal: true,
              rotation: 0,
              pageCount: 1,
            });
            await loadFilePages(documentCode, instance, fileId);

            return { fileId, instance };
          });

          callback(filePromises);
        }
      };

      input.click();
      input.remove();
    },
    updateFiles: repositories.files.update,
    removeFiles: (identifiers: string | string[]) => {
      repositories.files.delete(identifiers);
    },
    splitPdf: async (id: string, documentCode: string) => {
      const pdf = repositories.files.state[id].state.instance;
      const files = await split(pdf);

      repositories.files.delete(id);

      repositories.files.create(
        files.map((instance, index) => ({
          documentCode,
          instance,
          rotation: 0,
          isLocal: true,
          index,
          pageCount: 1,
        }))
      );
    },
    convertFileToPdf: async (id: string) => {
      const state = repositories.files.read(id);
      const [file] = Object.values(state);

      const converter = file.state.instance.type.startsWith("image")
        ? converters.fromImage
        : converters.advanced;

      try {
        const converted = await converter(file.state.instance);
        repositories.files.update(id, { instance: converted });

        if (converted) {
          const [dummyPage] = Object.values(
            repositories.pages.read({ fileId: id })
          );

          if (dummyPage) repositories.pages.delete(dummyPage.meta.id);

          loadFilePages(file.state.documentCode, converted, id);
        }
      } catch (error) {
        console.error("Failed to convert file.");
      }
    },
    mergeFilesToPdf: async (documentCode: string, targetName: string) => {
      const state = repositories.files.read({
        documentCode /* , isLocal: true */,
      });
      const files = Object.values(state)
        .sort((a, b) => a.state.index - b.state.index)
        .map(({ state: { instance } }) => ({ instance }));

      try {
        const processed = await Promise.all(
          files.map(async ({ instance }) => {
            if (instance.type === "application/pdf") return instance;
            if (instance.type.startsWith("image/"))
              return await converters.fromImage(instance);
            return await converters.advanced(instance);
          })
        );

        const ids = Object.values(state).map(({ meta: { id } }) => id);

        const toMerge = processed.filter((v) => v !== undefined);

        const merged = await merge(toMerge, targetName);

        repositories.files.delete(ids);

        const [{ id: mergedFileId }] = repositories.files.create({
          documentCode,
          instance: merged,
          rotation: 0,
          isLocal: true,
          index: 0,
          pageCount: toMerge.length,
        });
        ctx.patch({ _selectedFileId: mergedFileId });
      } catch (error) {
        console.error(error);
      }
    },
    updateImageRotation: (id: string, rotation: number) =>
      repositories.files.state[id].patch({ rotation }),
    updateDisplayedFile: (id: string) => ctx.patch({ _selectedFileId: id }),
    addPdfStamp: () => {
      const displayedFile = repositories.files.read(
        ctx.state._selectedFileId
      )[0].state.instance;
      /**
       * To implement: Stamp logic
       */
      return displayedFile;
    },
    getFileFromServer: async (params: {
      name: string;
      documentCode: string;
      extension: string;
      detailedUrl: string;
      url: string;
    }) => {
      if (seedsEnabled) return;

      const {
        name,
        documentCode,
        extension,
        url: apiUrl,
        detailedUrl,
      } = params;

      const requiredParams = {
        documentCode,
        extension,
        apiUrl,
        detailedUrl,
      };

      if (Object.values(requiredParams).some((param) => !param)) {
        console.error("Missing required parameters:", requiredParams);
        return;
      }

      const requestBody = adaptFileBodyRequest({
        documentCode,
        extension,
        url: apiUrl,
        detailedUrl,
      });

      try {
        const { data } = await services.ermewa.post.file<Response>({
          params: { documentCode, extension },
          body: requestBody,
        });

        if (!data) {
          console.error("Invalid response: 'data' is undefined.");
          return;
        }

        const contentType = data.headers.get("Content-Type");
        if (!contentType) {
          console.error("Missing content type.");
          return;
        }

        const blob = await data.blob();
        const pdfUrl = URL.createObjectURL(blob);

        const instance = await helpers.createFile({
          dataURL: pdfUrl,
          extension: extension.toLowerCase(),
          name: name || documentCode,
          type: contentType,
        });

        URL.revokeObjectURL(pdfUrl);

        const [{ id: fileId }] = repositories.files.create({
          instance,
          documentCode,
          isLocal: false,
          rotation: 0,
          index: 0,
          pageCount: 0,
        });

        if (contentType === "application/pdf") {
          loadFilePages(documentCode, instance, fileId);
        }

        return getScrollHandler;
      } catch (error) {
        console.error("Error fetching or processing the PDF file:", error);
      }
    },
    loadDocument: async (documentId: string) => {
      try {
        const response = await services.ermewa.get.document<
          DocumentResponse,
          DocumentBodyResponse
        >({
          params: { documentId },
        });
        const json = await response.data.json();

        // @ts-ignore <workaround to adapt to server json structure>
        const adaptedDocument = adaptDocumentResponse(json[documentId]);

        return adaptedDocument;
      } catch (error) {
        console.error(error);
      }
    },
    uploadDocument: async ({
      document,
      folderSid,
      natureCode,
      format,
      base64,
      object,
      language,
      publication,
    }: {
      document: DocumentInterface;
      folderSid: string;
      natureCode: string;
      object?: string;
      format: string;
      base64: string;
      language?: (typeof LANG_MAP)["ENG" | "FRA" | "GER" | ""];
      publication?: string;
    }) => {
      try {
        const body = adaptDocumentUploadRequest({
          master: {
            objectSid: folderSid,
            format,
            object,
            language,
            publication,
          },
          natureCode: natureCode,
          content: base64,
          status: document.state,
          documentDate: helpers.formatDate(new Date()),
          expirationDate: document.documentExpires,
          documentName: document.name,
          lineNumber: 0,
        });

        const response = await services.ermewa.post.upload<
          UploadResponse,
          UploadBodyRequest
        >({ body });
        const json = await response.data.json();

        return json;
      } catch (error) {
        console.error(error);
      }
    },
    updateDocuments: async (updates: FullUpdateRequestInterface[]) => {
      try {
        const body = adaptDocumentUpdateRequest(updates);
        console.log(body);

        const { data } =
          await services.ermewa.post.documentUpdate<UpdateResponse>({
            body,
          });

        console.log(data);
        const json = await data.json();
        console.log(json);

        // TODO: create adapter
        return json;
      } catch (error) {
        console.error(error);
      }
    },
    deleteDocument: async (request: DeleteRequestInterface) => {
      const body = adaptDocumentDeleteRequest(request);

      const { documentCode } = request;

      const response = await services.ermewa.post.documentDelete<
        DeleteResponse,
        DeleteBodyRequest
      >({
        params: { documentCode },
        body,
      });

      console.log(await response.data.json());
    },
    removeDocuments: repositories.documents.delete,
    sendMail: async (request: EmailInterface) => {
      const body = {
        $ClassName: "IerXMailer",
        $ClassVer: "12.7",
        xMessage: {
          $ClassName: "IerXMailMessage",
          $ClassVer: "12.7",
          from: request.from,
          to: request.to,
          subject: request.subject,
          ...(request.cc && { cc: request.cc }),
          ...(request.bcc && { bcc: request.bcc }),
          ...(request.text && { text: request.text }),
          ...(request.html && { html: request.html }),
          ...(request.attachments &&
            request.attachments.length > 0 && {
              attachments: request.attachments,
            }),
        },
      } satisfies EmailBodyRequest;

      console.log(body);

      const response = await services.ermewa.post.sendMail({ body });

      return response;
    },
    fetchRejectEmailInfo: async (documentCode: string) => {
      const response = await services.ermewa.get.rejectEmailInfo<RejectEmailInfoResponse>({ params: { documentCode } }); 
      const json = await response.data.json();
      const [toAdapt] = Object.values(json.xRML)
      const adapted = adaptRejectEmailInfo(toAdapt);
      
      return adapted;
    }
  })
);

export default useCases;
