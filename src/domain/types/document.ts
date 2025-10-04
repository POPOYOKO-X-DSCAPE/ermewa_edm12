export type DocumentInterface = {
  documentCode: string;
  lastTimeUpdated: string;
  documentExpires: string | undefined;
  documentDate: string | undefined;
  link?: {
    state: number;
    stateDescription: {
      english: string;
      french: string;
      german: string;
    };
  };
  memo?: string;
  isMaster: boolean;
  name: {
    baseName: string;
    documentName: {
      english: string;
      french: string;
      german: string;
    };
  };
  state: number;
  stateDescription: {
    english: string;
    french: string;
    german: string;
  };
  url: string;
  file: {
    type: string;
    lang: string;
    detailedUrl: string;
    shortUrl: string;
  };
  isLocal: boolean;
};

export const DOCUMENT_STATUS_MAP = [
  {
    label: "undefined",
    backgroundColor: "grey",
    index: 0,
  },
  {
    label: "pending",
    backgroundColor: "orange",
    index: 1,
  },
  {
    label: "accepted",
    backgroundColor: "green",
    index: 2,
  },
  {
    label: "rejected",
    backgroundColor: "red",
    index: 3,
  },
  {
    label: "removed",
    backgroundColor: "black",
    index: 4,
  },
  {
    label: "N/A",
    backgroundColor: "lavender",
    index: 5,
  },
] as const;
