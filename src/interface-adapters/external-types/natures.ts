type DueDate = number;
/*   0 // undefined 
| 1 // mandatory 
| 2 // optional 
| 3 // none 
; */

export type NaturesBody = {
  $ClassName: string;
  $ClassVer: string;
  $uid: string;
  $stamp: string;
  headers: {
    login: string;
    uPid: string;
    uSid: string;
    xNat: string;
    xSid: string;
  };
  xNat: {
    [folderName: string]: {
      DES: {
        FRA: string;
      };
      SHO: {
        ENG: string;
        FRA: string;
        GER: string;
      };
      NAT: {
        [natureCode: string]: {
          // MASTER: boolean;
          LINKEDTO?: string;
          COD?: string;
          SHO?: string;
          DES?: {
            ENG: string;
            FRA: string;
            GER: string;
          };
          RCD?: string;
          GNR?: string;
          EXT?: string;
          HIS?: string;
          LMG?: number;
          NBL?: number;
          DOCDATE?: boolean;
          DUEDATE?: DueDate;
          ENAXFR?: boolean;
          ENAEDT?: boolean;
          ENACTL?: boolean;
          MAXSIZE?: number;
          ENAUPL?: boolean;
          ENAFLG?: boolean;
        };
      };
    };
  };
};

export type NaturesResponse = {
  json(): Promise<NaturesBody>;
} & Response;
