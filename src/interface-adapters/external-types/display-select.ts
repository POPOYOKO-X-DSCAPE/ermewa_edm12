export type DisplaySelectBodyResponse = {
  $ClassName: "IerXEdm12Sel"
  $ClassVer: "12.7.5"
  $stamp:string;
  $uid: string;
  headers: {
    login: string;
    uPid: string;
    uSid: string;
  }
  xSel: {
    $uuid: string;
    $etag: string;
    REQNUM: string;
    REQORD: number;
    REQSTA: string;
    BPSNUM: number;
    ETBNUM: string;
    YME06: string;
    WSHCOD: string;
    MACNUM: string;
    COPHID: string;
    WYSA01: string;
    REQROOT: string;
    REQROOT_REF: {
      $title: string;
    };
    REQFATHER: string;
    REQFATHER_REF: {
      $title: string;
    };
    REQTYP: string;
    REQTYP_REF: {
      $title: string;
      $description: string
    };
    CONREV:string;
    CONREV_REF: {
      $title: string
    }
  }[]
}

export type DisplaySelectResponse = {
  json(): Promise<DisplaySelectBodyResponse>
} & Response;
