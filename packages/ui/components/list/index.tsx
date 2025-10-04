import { css } from "@styles";
import classNames from "classnames";
import type { ReactNode } from "react";

interface StackProps {
  type?: "unordered" | "ordered";
  items: (ReactNode | string)[];
}

export const List = ({ type = "unordered", items }: StackProps) => {
  const panda = css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    alignItems: "stretch",
    justifyContent: "stretch",
  });

  switch (type) {
    case "unordered":
      return (
        <ul className={classNames(panda)}>
          {items.map((child, index) => {
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            return <li key={index}>{child}</li>;
          })}
        </ul>
      );

    case "ordered":
      throw new Error("Ordered list are not implemented for now");

    default:
      break;
  }
};
