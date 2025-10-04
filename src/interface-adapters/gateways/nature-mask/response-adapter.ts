import type { NatureMaskInterface } from "@/domain/types/";
import type { NatureMaskBody } from "@/interface-adapters/external-types";

function adaptNatureMaskResponse(
  response: NatureMaskBody,
  showRemovedDocuments = false
): NatureMaskInterface {
  const result: NatureMaskInterface = {};

  for (const key in response.xOHN) {
    const xohn = response.xOHN[key];
    const documents = Object.values(xohn.XDOC).map((document) => ({
      documentCode: document.COD,
      lastTimeUpdated: document.UPDTIME,
      documentDate: document.DOCDATE,
      documentExpires: document.DOCEXPIRE,
      link: {
        state: document.LINK.STATE,
        stateDescription: {
          french: document.LINK.STATEDES.FRA,
          english: document.LINK.STATEDES.ENG,
          german: document.LINK.STATEDES.GER,
        },
      },
      isMaster: document.MASTER,
      url: document.URL,
      memo: document.MEM,
      name: {
        baseName: document.NAME.BASENAME,
        documentName: {
          french: document.NAME.DOCNAME.FRA || "none",
          english: document.NAME.DOCNAME.ENG || "none",
          german: document.NAME.DOCNAME.GER || "none",
        },
      },
      state: document.STATE,
      stateDescription: {
        french: document.STATEDES.FRA,
        english: document.STATEDES.ENG,
        german: document.STATEDES.GER,
      },
      file: {
        lang: "",
        type: Object.keys(document.XFILE)[0]?.toLowerCase(),
        detailedUrl: Object.values(document.XFILE)[0]?.LAN[""]?.URLDET,
        shortUrl: Object.values(document.XFILE)[0]?.LAN[""]?.URLSHO,
      },
      isLocal: false,
    }));

    result[key] = {
      sid: response.headers.xSid,
      code: xohn.COD,
      headers: {
        error: {
          code: xohn.HEADERS.ERROR.COD,
          message: xohn.HEADERS.ERROR.MSG,
        },
        lockCode: xohn.HEADERS.LCKCOD,
        isMaster: xohn.HEADERS.MASTER,
        type: xohn.HEADERS.TYPE as "O" | "M" | "F",
        typeDescription: xohn.HEADERS.TYPEDES as
          | "optional"
          | "mandatory"
          | "forbidden",
      },
      documents: showRemovedDocuments
        ? documents
        : documents.filter(({ state }) => state !== 4),
    };
  }

  return result;
}

export default adaptNatureMaskResponse;
