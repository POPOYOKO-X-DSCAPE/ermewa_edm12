import { css } from "@styles";
import classNames from "classnames";
import type { ReactNode } from "react";
import { forwardRef, useEffect, useRef } from "react";
import { Abstract, type AbstractProps } from "..";

export interface StackProps extends AbstractProps {
  direction?: "column" | "row";
  alignItems?: "stretch" | "start" | "end" | "center";
  justifyContent?: "stretch" | "start" | "end" | "center";
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = "column",
      children,
      className,
      scrollable,
      justifyContent = "stretch",
      alignItems = "stretch",
      grow,
      position,
      onClick,
    },
    ref
  ) => {
    const panda = css({
      display: "flex",
      flexDirection: direction,
      maxHeight: "100%",
      maxWidth: "100%",
      alignItems: alignItems,
      justifyContent: justifyContent,
    });
    const pandaParentScroll = css({
      maxWidth: "100%",
      maxHeight: "100%",
      overflow: "auto",
      minWidth: !grow && direction === "column" ? "min-content" : "initial",
    });
    const pandaScroll = css({
      display: "flex",
      height: "0",
      flexDirection: direction,
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const parent = scrollRef.current?.parentElement;
      if (parent) {
        const gap = window.getComputedStyle(parent).gap;
        if (scrollRef.current) {
          scrollRef.current.style.gap = gap;
          const lastChild = scrollRef.current.lastElementChild as HTMLElement;
          if (lastChild) {
            lastChild.style.marginBottom = gap;
          }
        }
      }
    }, []);

    if (scrollable) {
      return (
        <Abstract
          ref={ref}
          className={classNames(pandaParentScroll, className)}
          grow={grow}
          position={position}
          onClick={onClick}
        >
          <Abstract ref={scrollRef} className={classNames(pandaScroll)} grow>
            {children}
          </Abstract>
        </Abstract>
      );
    }

    return (
      <Abstract
        ref={ref}
        className={classNames(panda, className)}
        grow={grow}
        position={position}
        onClick={onClick}
      >
        {children}
      </Abstract>
    );
  }
);

Stack.displayName = "Stack";
