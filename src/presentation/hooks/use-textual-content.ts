import type { MSG_LABELS } from "@/interface-adapters/external-types";

import { useAppContext } from "../contexts/app-context";

type TextualContent = {
  [key in (typeof MSG_LABELS)[keyof typeof MSG_LABELS]]: string;
};

const useTextualContent = () => {
  const {
    appProfile: {
      messages,
      user: { languages: userLanguages },
    },
  } = useAppContext();

  const userLanguage = userLanguages[0];

  const translatedMessages = {} as TextualContent;

  for (const [identifier, { language }] of Object.entries(messages)) {
    const key = identifier as (typeof MSG_LABELS)[keyof typeof MSG_LABELS];
    translatedMessages[key] = language[userLanguage] ?? "[undefined]";
  }

  return translatedMessages;
};

export default useTextualContent;
