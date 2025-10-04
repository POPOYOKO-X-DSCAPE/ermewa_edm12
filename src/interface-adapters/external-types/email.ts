export type Attachment = {
  filename: string;
  content: string;
  encoding: string;
};

export type EmailBodyRequest = {
  $ClassName: string;
  $ClassVer: string;
  xMessage: {
    $ClassName: string;
    $ClassVer: string;
    from: string;
    to: string;
    subject: string;
    cc?: string;
    bcc?: string;
    text?: string;
    html?: string;
    attachments?: Attachment[];
  };
};
