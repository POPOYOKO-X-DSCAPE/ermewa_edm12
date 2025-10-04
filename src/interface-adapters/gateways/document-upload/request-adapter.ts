import type { UploadBodyRequest } from "@/interface-adapters/external-types";

import { LANG_MAP } from "../app-profile/response-adapter";

type UploadRequestInterface = {
  natureCode: string;
  documentDate: string;
  expirationDate?: string;
  lineNumber: number;
  status: number;
  documentName: {
    baseName: string;
    name?: string;
  };
  master: {
    objectSid: string;
    publication?: string;
    format?: string;
    object?: string;
    language?: (typeof LANG_MAP)["ENG" | "FRA" | "GER" | ""];
  };
  content: string; // base64
};

const adaptDocumentUploadRequest = (
  input: UploadRequestInterface
): UploadBodyRequest => ({
  $ClassName: "IerXEdmUpload",
  $ClassVer: "12.7",
  xEdmDoc: {
    $ClassName: "IerXEdmDoc",
    $ClassVer: "12.7",
    DocDate: input.documentDate,
    DocExpire: input.expirationDate || "",
    line: input.lineNumber,
    XDOC: "",
    Nature: input.natureCode,
    State: input.status,
    Name: {
      BaseName: input.documentName.baseName,
      DocName: {
        "": input.documentName.baseName || "",
      },
    },
    Master: {
      Format: input.master.format || "undefined",
      Pub: input.master.publication || input.master.format || "undefined",
      Lan:
        Object.entries(LANG_MAP).find(
          ([, value]) => input.master.language === value
        )?.[0] || "",
      Obj: input.master.object || "MNR",
      ObjID: input.master.objectSid,
    },
    objLink: {
      /* POM: {
        SID: input.master.objectSid,
      }, */
    },
    fileData: {
      [input.master.format || "undefined"]: {
        LAN: {
          "": {
            data: input.content.split("base64,")[1],
            encode: "base64",
          },
        },
      },
    },
  },
});

export default adaptDocumentUploadRequest;
