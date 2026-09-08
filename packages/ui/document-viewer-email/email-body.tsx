import { css } from "@styles";
import React from "react";
import { Stack } from "../abstract/stack/stack";

const bodyStyle = css({
	backgroundColor: "s.bg.initial",
	color: "s.fg.initial",
	padding: "s.padding.l",
	lineHeight: "1.6",
	wordBreak: "break-all",
});

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
		<Stack scrollable grow>
			<Stack className={bodyStyle}>
				{lines.map((line, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<React.Fragment key={i}>
						{line.split("\t").map((chunk, j, arr) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<React.Fragment key={j}>
								{chunk}
								{j < arr.length - 1 && "\u00A0\u00A0\u00A0\u00A0"}
							</React.Fragment>
						))}
						{i < lines.length - 1 && <br />}
					</React.Fragment>
				))}
			</Stack>
		</Stack>
	);
};
