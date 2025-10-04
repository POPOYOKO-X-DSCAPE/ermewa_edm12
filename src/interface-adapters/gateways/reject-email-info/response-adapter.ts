import type { RejectEmailInfoBody } from "@/interface-adapters/external-types";

const adaptNatureMaskResponse = (
  input: RejectEmailInfoBody['xRML'][string]
) => {
  
  return {
    subject: input.MSG_OBJ,
    text: input.MSG_BODY,
    to: input.MSG_DEST.map(dest => dest.MAIL),
    cc: input.MSG_CC
  }
}

export default adaptNatureMaskResponse;
