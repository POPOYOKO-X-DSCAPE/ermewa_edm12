type MessageRecipient = {
  MAIL: string;
}

type Message = {
  MSG_OBJ: string;
  MSG_BODY?: string;
  MSG_DEST: MessageRecipient[];
  MSG_CC?: MessageRecipient[];
}

type XRML = {
  [key: string]: Message;
}

interface Headers {
  login: string;
  uPid: string;
  uSid: string;
}

export type RejectEmailInfoBody = {
  $ClassName: string;
  $ClassVer: string;
  $uid: string;
  $stamp: string;
  headers: Headers;
  xRML: XRML;
}

export type RejectEmailInfoResponse = {
  json(): Promise<RejectEmailInfoBody>;
} & Response;
