import type { EmailInterface } from "@/domain/types";
import { useState } from "react";


interface EmailSenderModalProps {
  initialEmail: EmailInterface;
  onSend: (email: EmailInterface) => void;
  onClose: () => void;
  title?: string;
}

const modalOverlayStyle: React.CSSProperties  = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalContentStyle: React.CSSProperties  = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "4px",
  width: "90%",
  maxWidth: "500px",
};

const EmailSenderModal = ({
  initialEmail,
  onSend,
  onClose,
  title,
}: EmailSenderModalProps) => {
  const [email, setEmail] = useState<EmailInterface>(initialEmail);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    setEmail((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = () => {
    onSend(email);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2>{title || "Pré-remplir l'email"}</h2>
        <form>
          <div>
            <label htmlFor="from">From:</label>
            <input
              type="text"
              id="from"
              name="from"
              value={email.from}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
            />
          </div>
          <div>
            <label htmlFor="to">To:</label>
            <input
              type="text"
              id="to"
              name="to"
              value={email.to}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
            />
          </div>
          <div>
            <label htmlFor="cc">CC:</label>
            <input
              type="text"
              id="cc"
              name="cc"
              value={email.cc || ""}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
            />
          </div>
          <div>
            <label htmlFor="bcc">BCC:</label>
            <input
              type="text"
              id="bcc"
              name="bcc"
              value={email.bcc || ""}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
            />
          </div>
          <div>
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={email.subject}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
            />
          </div>
          <div>
            <label htmlFor="text">Text:</label>
            <textarea
              id="text"
              name="text"
              value={email.text || ""}
              onChange={handleChange}
              style={{ width: "100%", marginBottom: "8px" }}
              rows={4}
              maxLength={255}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ marginRight: "8px" }}
            >
              Annuler
            </button>
            <button type="button" onClick={handleSend}>
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailSenderModal;
