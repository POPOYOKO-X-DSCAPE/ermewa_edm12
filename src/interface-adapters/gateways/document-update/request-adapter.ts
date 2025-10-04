import type { UpdateBodyRequest } from "@/interface-adapters/external-types";

type BaseUpdateRequestInterFace = {
  master: { folderName: string; sid: string };
  natureCode: string;
};

export type UpdateRequestInterface = {
  documentCode: string;
  lastUpdateTime: string;
  name: string;
  status?: number; // 0: undefined, 1: pending, 2: accepted, 3: rejected, 4: removed (logically)
  memo?: string;
  documentDate?: string;
  documentExpires?: string;
  line?: number;
  fileData?: {
    binary: string;
    extension: string;
    encoding: string;
    language?: string;
  };
};

export type FullUpdateRequestInterface = BaseUpdateRequestInterFace &
  UpdateRequestInterface;

const adaptDocumentUpdateRequest = (
  input: FullUpdateRequestInterface[]
): UpdateBodyRequest => ({
  $ClassName: "IerXEdm12Update",
  $ClassVer: "12.7",
  xUpdate: input.map(
    ({
      documentCode,
      lastUpdateTime,
      line,
      name,
      status,
      documentDate,
      documentExpires,
      fileData,
      memo,
      master,
      natureCode,
    }) => ({
      $ClassName: "IerXEdmUpdate",
      $ClassVer: "12.7",
      XDOC: documentCode,
      UPDTIME: lastUpdateTime,
      line,
      Nature: natureCode,
      Mem: memo,
      Master: {
        Obj: master.folderName,
        ObjID: master.sid,
        Format: fileData?.extension,
        Pub: fileData?.extension,
      },
      Name: {
        BaseName: name,
      },
      State: status?.toString(),
      DocDate: documentDate,
      DocExpire: documentExpires,
      ...(fileData && {
        fileData: {
          [fileData.extension?.toUpperCase()]: {
            LAN: {
              [fileData.language !== "default"
                ? fileData?.language?.toUpperCase() || ""
                : ""]: {
                data: fileData.binary.split("base64,")[1],
                encode: fileData.encoding,
              },
            },
          },
        },
      }),
    })
  ),
});

export default adaptDocumentUpdateRequest;
