type Attachment = {
  filename: string;
  content: string;
  encoding: string;
};

export type EmailInterface = {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
};
