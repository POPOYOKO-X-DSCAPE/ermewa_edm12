import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import type { IconSize } from "../icon";
import { Icon } from "../icon";

import "./index.scss";

interface ButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}


const Button = ({ children, onClick, disabled }: ButtonProps) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick(e);
        e.stopPropagation();
        e.preventDefault();
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface ButtonMenuProps {
  buttonsProps: ButtonProps[];
  children: ReactNode;
}

Button.Menu = ({ buttonsProps, children }: ButtonMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={classNames("menu")}
      type="button"
      onClick={(e) => {
        setIsOpen(!isOpen);
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {children}
      {isOpen && (
        <ul>
          {buttonsProps.map((button) => (
            // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
            <Button onClick={(e) => button.onClick(e)}>
              {button.children}
            </Button>
          ))}
        </ul>
      )}
    </div>
  );
};

interface ButtonMenuIconProps {
  size: IconSize;
  title?: string;
  buttons: {
    children: React.ReactElement[];
    onClick: (e: MouseEvent<HTMLDivElement>) => void;
  }[];
}

Button.MenuIcon = ({ size, title, buttons }: ButtonMenuIconProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {    
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className={classNames("menu", "icon")} ref={menuRef}>
      <Button.Icon
        title={title ? title : "more actions"}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon.More size={size} />
      </Button.Icon>
      {isOpen && (
        <ul>
          <div className={classNames("header")}>
            <Button.Icon
              title={title ? title : "close"}
              onClick={() => setIsOpen(!isOpen)}
            >
              <Icon.Close size={size} />
            </Button.Icon>
          </div>
          {buttons.map((button) =>
            button.children.map((child, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <div
                className={classNames("inner")}
                // biome-ignore lint/suspicious/noArrayIndexKey: TODO
                key={index}
                onClick={(e) => {
                  button.onClick(e);
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(false);
                }}
              >
                {child}
              </div>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

interface ButtonIconProps {
  children: React.ReactElement<typeof Icon>;
  title: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

Button.Icon = ({ children, title, onClick }: ButtonIconProps) => {
  return (
    <button
      title={title}
      className={classNames("icon")}
      type={"button"}
      onClick={(e) => {
        onClick(e);
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {children}
    </button>
  );
};

export default Button;
