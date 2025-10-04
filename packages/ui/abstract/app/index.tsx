import { css } from "@styles";
import classNames from "classnames";
import type React from "react";
import "../../../../styled-system/styles.css";
import { hidden } from "kolorist";
import { Stack } from "../stack";

interface AppProps {
  children: React.ReactNode;
}

const panda = css({
  bg: "c.app.bg",
  color: "c.app.fg",
  width: "100vw",
  height: "100vh",
  maxWidth: "100vw",
  maxHeight: "100vh",
  "& h1": {
    fontSize: "c.app.h1",
    fontWeight: "c.app.h1",
  },
  "& h2": {
    fontSize: "c.app.h2",
    fontWeight: "c.app.h2",
  },
  "& h3": {
    fontSize: "c.app.h3",
    fontWeight: "c.app.h3",
  },
  "& h4": {
    fontSize: "c.app.h4",
    fontWeight: "c.app.h4",
  },
  "& h5": {
    fontSize: "c.app.h5",
    fontWeight: "c.app.h5",
  },
  "& h6": {
    fontSize: "c.app.h6",
    fontWeight: "c.app.h6",
  },
  "& button": {
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
  },
});

export const App = ({ children }: AppProps) => {
  return (
    <Stack direction="column" className={classNames("app", panda)}>
      {children}
    </Stack>
  );
};
