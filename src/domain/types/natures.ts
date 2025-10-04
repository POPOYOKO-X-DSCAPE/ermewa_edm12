export type NaturesInterface = {
  [key: string]: {
    description: {
      french: string;
    };
    show: {
      english: string;
      french: string;
      german: string;
    };
    natures: {
      [key: string]: {
        master: boolean;
        linkedTo: string;
        code: string;
        show?: string;
        description?: {
          english: string;
          french: string;
          german: string;
        };
        record?: string;
        genre?: string;
        extension?: string;
        history?: string;
        limit?: number;
        numberLines?: number;
        documentDate?: boolean;
        dueDate?: number;
        enableAxfr?: boolean;
        isEditable: boolean;
        isControllable: boolean;
        maxSize?: number;
        isUploadAllowed: boolean;
        enableFlag?: boolean;
      };
    };
  };
};
