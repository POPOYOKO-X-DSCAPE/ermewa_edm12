export type NatureMaskBody = {
  headers: {
    xSid: string;
  };
  xOHN: {
    [key: string]: {
      COD: string;
      HEADERS: {
        ERROR: {
          COD: string;
          MSG: string;
        };
        LCKCOD: string;
        MASTER: boolean;
        TYPE: string;
        TYPEDES: string;
      };
      XDOC: {
        [key: string]: {
          UPDTIME: string;
          DOCDATE?: string;
          DOCEXPIRE?: string;
          COD: string;
          LINK: {
            STATE: number;
            STATEDES: {
              ENG: string;
              FRA: string;
              GER: string;
            };
          };
          MEM: string;
          MASTER: boolean;
          URL: string;
          NAME: {
            BASENAME: string;
            DOCNAME: {
              ENG: string;
              FRA: string;
              GER: string;
            };
          };
          STATE: number;
          STATEDES: {
            ENG: string;
            FRA: string;
            GER: string;
          };
          XFILE: {
            [key: string]: {
              LAN: {
                [key: string]: {
                  URLDET: string;
                  URLSHO: string;
                };
              };
            };
          };
        };
      };
    };
  };
};
export type NatureMaskResponse = {
  json(): Promise<NatureMaskBody>;
} & Response;
