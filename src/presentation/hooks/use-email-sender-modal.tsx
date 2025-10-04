import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

import type { EmailInterface } from "@/domain/types";
import EmailSenderModal from "../components/email-sender-modal";

type OnSendCallback = (email: EmailInterface) => void;

type ModalOptions = {
  title: string;
};

const useEmailSenderModal = () => {
  const openModal = (
    initialEmail: EmailInterface,
    onSend: OnSendCallback,
    options?: Partial<ModalOptions>
  ) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const close = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleSend = (email: EmailInterface) => {
      onSend(email);
      close();
    };

    const modal: ReactElement = (
      <EmailSenderModal
        initialEmail={initialEmail}
        onSend={handleSend}
        onClose={close}
        title={options?.title}
      />
    );

    root.render(modal);
  };

  return { openModal };
};

export default useEmailSenderModal;
