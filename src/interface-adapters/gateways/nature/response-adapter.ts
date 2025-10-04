import type { NaturesInterface } from "@/domain/types";
import type { NaturesBody } from "@/interface-adapters/external-types";

function adaptNaturesResponse(response: NaturesBody): NaturesInterface {
  const adaptedNatures: NaturesInterface = {};

  for (const key in response.xNat) {
    const entry = response.xNat[key];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const adaptedNature: { [key: string]: any } = {};

    for (const natKey in entry.NAT) {
      const nat = entry.NAT[natKey];
      const adapted = {
        // master: nat.MASTER,
        linkedTo: nat.LINKEDTO,
        code: natKey, // nat.COD (en cours de changement pour nat.RCD),
        show: nat.SHO,
        description: {
          french: nat.DES?.FRA,
          english: nat.DES?.ENG,
          german: nat.DES?.GER,
        },
        record: nat.RCD,
        genre: nat.GNR,
        extension: nat.EXT,
        history: nat.HIS,
        limit: nat.LMG,
        numberLines: nat.NBL,
        documentDate: nat.DOCDATE,
        dueDate: nat.DUEDATE,
        enableAxfr: nat.ENAXFR,
        isEditable: nat.ENAEDT || false,
        maxSize: nat.MAXSIZE,
        isControllable: nat.ENACTL || false,
        isUploadAllowed: nat.ENAUPL || false,
        enableFlag: nat.ENAFLG,
      };

      adaptedNature[natKey] = adapted;
    }

    const adaptedEntry = {
      description: { french: entry.DES.FRA },
      show: {
        english: entry.SHO.ENG,
        french: entry.SHO.FRA,
        german: entry.SHO.GER,
      },
      natures: adaptedNature,
    };

    adaptedNatures[key] = adaptedEntry;
  }

  return adaptedNatures;
}

export default adaptNaturesResponse;
