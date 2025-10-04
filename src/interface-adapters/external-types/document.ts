import type { LanguageOptions } from "./miscellaneous";

// fetch document

export type DocumentBodyResponse = {
  UPDTIME: string;
  COD: string;
  DOCDATE: string;
  DOCEXPIRE?: string;
  NAT: string;
  URL: string;
  STATE: number;
  STATEDES: {
    FRA: string;
    ENG: string;
    GER: string;
  };
  MEM?: string;
  NAME: {
    BASENAME: string;
    DOCNAME: {
      [lang: string]: string;
    };
  };
  XFILE: {
    PDF: {
      LAN: {
        [lang: string]: {
          UPDTIME: string;
          MASTER: boolean;
          PUB: boolean;
          LEG: boolean;
          URLDET: string;
          URLSHO: string;
        };
      };
    };
  };
  XLINK: {
    UPDTIME: string;
    OBJ: string;
    NAT: string;
    SID: string;
    MASTER: boolean;
    STATE: number;
    STATEDES: {
      FRA: string;
      ENG: string;
      GER: string;
    };
  }[];
};

export type DocumentResponse = {
  json(): Promise<DocumentBodyResponse>;
} & Response;

// update document

export type UpdateBodyResponse = {
  $ClassName: string;
  $ClassVer: string;
  xRetUpdated: {
    $ClassName: string;
    $ClassVer: string;
    xDocUpdated: {
      BASENAME: string;
      CODACT: string;
      DOCDATE: string;
      DOCEXPIRE?: string;
      ETag: number;
      NATURE: string;
      STATE: number;
      UPDSTAFLG: number;
      UPDSTAMSG: string;
      UPDTIME: string;
      USER: string;
      XDOC: string;
      XDOAFILEDATA?: {
        $uuid: string;
        CODLAN: string;
        DOCTYP: string;
        URLSHO: string;
        STATELNK?: number;
        SID?: string;
        OBJHYB?: string;
      }[];
      XDOAOBJLINK?: {
        $uuid: string;
        OBJHYB: string;
        SID: string;
        STATELNK: number;
      }[];
    };
  }[];
};

export type UpdateResponse = {
  json(): Promise<UpdateBodyResponse>;
} & Response;

export type UpdateBodyRequest = {
  $ClassName: string;
  $ClassVer: string;
  xUpdate: {
    $ClassName: string;
    $ClassVer: string;
    XDOC: string;
    UPDTIME: string;
    URL?: string;
    line?: number;
    Nature?: string;
    DocDate?: string;
    DocExpire?: string;
    State?: string;
    Name: {
      BaseName: string;
      DocName?: {
        [language in LanguageOptions | ""]: string;
      };
    };
    Mem?: string;
    Master?: Partial<{
      Format: string;
      Pub: string;
      Lan: string;
      Obj: string;
      ObjID: string;
    }>;
    objLink?: {
      [folderCode: string]: {
        SID: string;
        State: number;
      };
    };
    fileData?: {
      [fileType: string]: {
        LAN: {
          [language: string]: {
            data: string;
            encode: string;
          };
        };
      };
    };
  }[];
};

// upload document

export type UploadBodyResponse = {
  $ClassName: string;
  $ClassVer: string;
  xRetUploaded: {
    $ClassName: string;
    $ClassVer: string;
    $uid: string;
    $stamp: string;
    xDocUploaded: {
      XDOC: string;
      UPDTIME: string;
      UPDSTAFLG: number;
      UPDSTAMSG: string;
      BASENAME: string;
      NATURE: string;
      STATE: number;
      USER: string;
      DOCDATE: string;
      XDOAOBJLINK: {
        SID: string;
        OBJHYB: string;
      }[];
      XDOAFILEDATA: {
        URLSHO: string;
        URLDET: string;
        CODLAN: string;
        CODTYP: string;
      }[];
    };
  }[];
};

export type UploadResponse = {
  json(): Promise<UploadBodyResponse>;
};

export type UploadBodyRequest = {
  $ClassName: string;
  $ClassVer: string;
  xEdmDoc: {
    $ClassName: string;
    $ClassVer: string;
    DocDate: string;
    DocExpire: string;
    line: number;
    XDOC: string;
    Nature: string;
    State: number;
    Name: {
      BaseName: string;
      DocName: {
        [language: string]: string;
      };
    };
    Master: {
      Format: string;
      Pub: string;
      Lan: string;
      Obj: string;
      ObjID: string;
    };
    objLink: {
      [folderName: string]: {
        SID: string;
      };
    };
    fileData: {
      [fileType: string]: {
        LAN: {
          [language: string]: {
            data: string;
            encode: string;
          };
        };
      };
    };
  };
};

// delete document

export type DeleteBodyRequest = {
  XDOC: {
    [documentCode: string]: {
      COD: string;
      STATE: number;
      URL: string;
    };
    // @ts-expect-error explanation< 'this structure comes from backend and is corrected by its corresponding adapter.' >
    XFILE: {
      [extension: string]: {
        LAN: {
          [language: string]: {
            URLFUL: string;
            URLSHO: string;
          };
        };
      };
    };
  };
};

export type DeleteBodyResponse = Record<string, unknown>;

export type DeleteResponse = {
  json(): Promise<DeleteBodyResponse>;
};
