import type { DeleteBodyRequest } from "@/interface-adapters/external-types/document";

export type DeleteRequestInterface = {
  documentCode: string;
  state: number;
  url: string;
  fileExtension: string;
  language: string;
  fullUrl: string;
  shortUrl: string;
};

const adaptDocumentDeleteRequest = (
  input: DeleteRequestInterface
): DeleteBodyRequest => ({
  // @ts-expect-error explanation< 'this structure comes from backend and is corrected by its corresponding adapter.' >
  XDOC: {
    [input.documentCode]: {
      COD: input.documentCode,
      STATE: input.state,
      URL: input.url,
    },
    XFILE: {
      [input.fileExtension.toUpperCase()]: {
        LAN: {
          [input.language.toUpperCase()]: {
            URLFUL: input.fullUrl,
            URLSHO: input.shortUrl,
          },
        },
      },
    },
  },
});

export default adaptDocumentDeleteRequest;
