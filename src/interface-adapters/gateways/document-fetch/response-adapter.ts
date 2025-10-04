import type { DocumentBodyResponse } from "@/interface-adapters/external-types";

import type { DocumentInterface } from "@/domain/types";

function adaptDocumentResponse(input: DocumentBodyResponse): DocumentInterface {
  // workaround to adapt to server response;
  const [TYPE, fileStructure] = Object.entries(input.XFILE)[0];
  const [LAN, file] = Object.entries(fileStructure.LAN)[0];
  // workaround to adapt to server response;

  return {
    documentCode: input.COD,
    documentDate: input.DOCDATE,
    documentExpires: input.DOCEXPIRE,
    file: {
      detailedUrl: file.URLDET,
      lang: LAN.toLowerCase(),
      shortUrl: file.URLSHO,
      type: TYPE.toLowerCase(),
    },
    isLocal: false,
    isMaster: file.MASTER,
    lastTimeUpdated: input.UPDTIME,
    // links: input.XLINK.map(({ STATE, STATEDES }) => ({
    //   state: STATE,
    //   stateDescription: {
    //     english: STATEDES.ENG,
    //     french: STATEDES.FRA,
    //     german: STATEDES.GER,
    //   },
    // })),
    link: {
      state: input.STATE,
      stateDescription: {
        english: input.STATEDES.ENG,
        french: input.STATEDES.FRA,
        german: input.STATEDES.GER,
      },
    },
    memo: input.MEM,
    name: {
      baseName: input.NAME.BASENAME,
      documentName: {
        english: input.NAME.DOCNAME.ENG,
        french: input.NAME.DOCNAME.FRA,
        german: input.NAME.DOCNAME.GER,
      },
    },
    state: input.STATE,
    stateDescription: {
      english: input.STATEDES.ENG,
      french: input.STATEDES.FRA,
      german: input.STATEDES.GER,
    },
    url: input.URL,
  };
}

export default adaptDocumentResponse;
