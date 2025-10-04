import { createTypeDefinitions } from "@packages/free";

import isValidExtensionWhiteList from "./parts/is-valid-extension-white-list";

const { createSchemas } = createTypeDefinitions({
  "string?": (_: string | undefined) => ({}),
  "file-extension-white-list": (value: string) => ({
    type: [
      typeof value === "string",
      `${value} is of type '${typeof value}', 'string' expected.`,
    ],
    value: [
      isValidExtensionWhiteList(value),
      `[${value}] contains invalid or unhandled file extensions.`,
    ],
  }),
  "file-instance": (value: File) => ({
    type: [value instanceof File, `Invalid type, instance of 'File' expected.`],
  }),
  "file-pages": (_: { pageNumber: number; imageUrl: string }[]) => ({}),
  "file-is-local": (value: boolean) => ({
    type: [
      typeof value === "boolean",
      `${value} is of type '${typeof value}', 'boolean' expected.`,
    ],
  }),
  "translation-object": (_: {
    english: string;
    french: string;
    german: string;
  }) => ({}),
  "document-name": (_: {
    baseName: string;
    documentName?: { english: string; french: string; german: string };
  }) => ({}),
  "document-file": (_: {
    shortUrl: string;
    detailedUrl: string;
    type: string;
    lang: string;
  }) => ({}),
  "document-link": (_: {
    state: number;
    stateDescription: { english: string; french: string; german: string };
  }) => ({}),
});

const { createRepositories } = createSchemas({
  _documents: {
    lastTimeUpdated: "string",
    natureCode: "string",
    nodeSid: "string",
    name: "document-name",
    documentCode: "string",
    file: "document-file",
    url: "string",
    state: "number",
  },
  documents: {
    documentCode: "string",
    lastTimeUpdated: "string",
    documentExpires: "string?",
    documentDate: "string?",
    link: "document-link",
    isMaster: "boolean",
    name: "document-name",
    state: "number",
    stateDescription: "translation-object",
    url: "string",
    file: "document-file",
    isLocal: "boolean",
    natureCode: "string",
    folderSid: "string",
  },
  files: {
    instance: "file-instance",
    rotation: "number",
    documentCode: "string",
    isLocal: "file-is-local",
    index: "number",
    pageCount: "number",
  },
  pages: {
    fileId: "string",
    imageInstance: "file-instance",
    pdfInstance: "file-instance",
    pageNumber: "number",
  },
  changes: {
    documentCode: "string",
    name: "string",
    date: "date",
    expires: "date",
    status: "number",
    isFileUpdated: "boolean",
    isNewDocument: "boolean",
  },
});

export { createRepositories };
