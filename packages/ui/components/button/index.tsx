import { Button as AriaButton, MenuButton, MenuProvider } from "@ariakit/react";
import { Menu, MenuItem } from "@ariakit/react";

import classNames from "classnames";
import type { ReactNode } from "react";
import type { Action } from "../../types";
import { Styles } from "./styles";

export type ButtonLevel = "primary" | "secondary";

interface IButtonProps {
  children: ReactNode;
  type?: "button" | "reset" | "submit";
  level?: ButtonLevel;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button = ({
  children,
  type = "button",
  level = "primary",
  onClick,
  disabled,
}: IButtonProps) => {
  return (
    <AriaButton
      onClick={onClick}
      className={classNames(
        level === Styles.secondary ? Styles.secondary : Styles.primary,
        Styles.common
      )}
      type={type}
      disabled={disabled}
    >
      {children}
    </AriaButton>
  );
};

Button.Menu = ({
  children,
  level = "secondary",
  items,
  placement = "bottom-start",
}: {
  children: ReactNode;
  level?: ButtonLevel;
  items: Action[];
  placement?: "bottom-end" | "bottom-start" | "top-end" | "top-start";
}) => {
  return (
    <MenuProvider placement={placement}>
      <MenuButton
        className={classNames(
          (level === "secondary" && Styles.secondary) || Styles.secondary,
          Styles.common
        )}
      >
        {children}
      </MenuButton>
      <Menu className={Styles.menu}>
        {items.map((child, index) => (
          <MenuItem
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            onClick={() => child.callback()}
            className={Styles.menuItem}
          >
            {child.icon}
            {child.label}
          </MenuItem>
        ))}
      </Menu>
    </MenuProvider>
  );
};
