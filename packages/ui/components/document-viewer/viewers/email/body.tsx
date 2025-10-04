import React from "react";
import { Stack } from "../../../../abstract/stack";

import "./index.scss";

type EmailBodyProps = {
  body: string;
};

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const EmailBody = ({ body }: EmailBodyProps) => {
  const safe = escapeText(body);
  const lines = safe.split(/\r\n|\n|\r/);

  return (
    <Stack className="body">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line.split("\t").map((chunk, j, arr) => (
            <React.Fragment key={j}>
              {chunk}
              {
                j < arr.length - 1 &&
                  "\u00A0\u00A0\u00A0\u00A0" /* équivalent à &nbsp;&nbsp;&nbsp;&nbsp; */
              }
            </React.Fragment>
          ))}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </Stack>
  );
};
