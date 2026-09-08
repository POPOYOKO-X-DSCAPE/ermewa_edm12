import { Heading, HeadingLevel } from "@ariakit/react";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Button } from "../../components/button/button";
import { Dialog } from "../../components/dialog/dialog";
import {
	type EmailViewerStrings,
	resolveEmailViewerStrings,
} from "../email-strings";
import { styles } from "../styles";

export const RejectContextDialog = ({
	isOpen,
	onClose,
	content,
	strings,
}: {
	isOpen: boolean;
	onClose: () => void;
	content: string;
	strings?: Partial<EmailViewerStrings>;
}) => {
	const resolvedStrings = resolveEmailViewerStrings(strings);
	useEffect(() => {
		if (!isOpen) {
			return;
		}
	}, [isOpen]);

	return (
		<Dialog
			isOpen={isOpen}
			closeButtonContent={null}
			onClose={() => {
				onClose();
			}}
		>
			<div className={classNames(styles.metaDialogBody)}>
				<p>
					<span className={styles.redColor}>{content}</span>
				</p>
			</div>
			<div className={classNames(styles.metaActions)}>
				<Button level="secondary" onClick={() => onClose()}>
					{resolvedStrings.dismiss}
				</Button>
			</div>
		</Dialog>
	);
};
