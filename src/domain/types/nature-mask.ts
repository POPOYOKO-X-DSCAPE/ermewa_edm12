import type { DocumentInterface } from "./document";

export type NatureMaskInterface = {
  [key: string]: {
    sid: string;
    code: string;
    headers: {
      error: {
        code: string;
        message: string;
      };
      lockCode: string;
      isMaster: boolean;
      type: "O" | "M" | "F";
      typeDescription: "optional" | "mandatory" | "forbidden";
    };
    documents: DocumentInterface[];
  };
};
