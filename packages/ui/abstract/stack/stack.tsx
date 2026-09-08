import { css } from "@styles";
import classNames from "classnames";
import type { ReactNode } from "react";
import { forwardRef, useEffect, useRef } from "react";
import { Abstract, type AbstractProps } from "../abstract/abstract";

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
			role,
			ariaLabel,
			ariaLive,
		},
		ref,
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
			position: "relative",
			maxWidth: "100%",
			maxHeight: "100%",
			overflow: "auto",
			// width: "max-content",
			minWidth:
				!grow && direction === "column" ? "min-content" : "initial",
		});

		const pandaScroll = css({
			// position: "absolute",
			display: "flex",
			width: direction === "column" ? "100%" : "auto",
			flexDirection: direction,
		});

		const scrollRef = useRef<HTMLDivElement>(null);

		const parent = scrollRef.current?.parentElement;
		if (scrollRef.current) {
			scrollRef.current.style.position = "absolute";
		}
		useEffect(() => {
			if (scrollRef.current && parent) {
				const gap = window.getComputedStyle(parent).gap;
				scrollRef.current.style.gap = gap;
				const lastChild = scrollRef.current
					.lastElementChild as HTMLElement;
				if (lastChild) {
					lastChild.style.marginBottom = gap;
				}
			}
		}, [parent]);

		if (scrollable) {
			return (
				<Abstract
					ref={ref}
					className={classNames(pandaParentScroll, className)}
					grow={grow}
					position={position}
				>
					<Abstract
						ref={ref}
						className={classNames(pandaScroll)}
						grow
						role={role}
						ariaLabel={ariaLabel}
						ariaLive={ariaLive}
					>
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
				role={role}
				ariaLabel={ariaLabel}
				ariaLive={ariaLive}
			>
				{children}
			</Abstract>
		);
	},
);

Stack.displayName = "Stack";
