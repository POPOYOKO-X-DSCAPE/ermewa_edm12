import {
	Disclosure,
	DisclosureContent,
	DisclosureProvider,
	useDisclosureStore,
} from "@ariakit/react";
import { Badge, Stack } from "@packages/ui";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiFile2Line,
} from "@remixicon/react";
import { createComponent } from "@src/core/component.builder";
import { useState } from "react";
import { css } from "../../../../../../../styled-system/css";
import { DocumentNode } from "./document-node";
import type { SelectDocumentHandler } from "./side-bar";
import { Styles } from "./styles";

const styles = {
	disclosure: css({
		padding: "s.padding.m",
		borderBottom:
			"1px solid color-mix(in srgb, var(--colors-s-fg-default-initial) 40%, transparent)",
		cursor: "pointer",
		backgroundColor: "s.bg.elevated.initial",
		_hover: {
			backgroundColor: "s.bg.elevated.hover",
		},
	}),
	disclosureContent: css({
		padding: "s.padding.m",
		gap: "s.padding.m",
	}),
	badge: Styles.modifiedBadge,
};

export const UnsavedDocuments = createComponent<{
	selectDocument?: SelectDocumentHandler;
}>(
		({
			models: {
				folderTreeModel: { unsavedDocuments },
				i18nModel: { i18n },
			},
		controllers: {
			documentController: { selectDocument: controllerSelectDocument },
		},
		props,
	}) => {
		const [isOpen, setIsOpen] = useState(false);

		const disclosure = useDisclosureStore({
			open: isOpen,
			setOpen: (open: boolean) => {
				setIsOpen(open);
			},
		});

		const count = unsavedDocuments?.length ?? 0;
		const selectDocument =
			props.selectDocument ?? controllerSelectDocument;

		if (count === 0) {
			return null;
		}

		return (
			<Stack>
				<DisclosureProvider>
					<Disclosure store={disclosure}>
						<Stack
							grow
							direction="row"
							alignItems="center"
							className={styles.disclosure}
						>
							<Stack grow direction="row" alignItems="center">
								<Stack>
									<Stack>
										<RiFile2Line />
									</Stack>
									<Stack
										position={{
											type: "relativeToParent",
											position: ["bottom", "left"],
										}}
										className={styles.badge}
									>
										<Badge>{count}</Badge>
									</Stack>
								</Stack>

								<Stack>{i18n.t("sidebarUnsavedDocuments")}</Stack>
							</Stack>
							{isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
						</Stack>
					</Disclosure>

					<DisclosureContent store={disclosure}>
						<Stack className={styles.disclosureContent}>
							{unsavedDocuments.map((document) => (
								<DocumentNode
									key={document.id}
									document={document}
									selectDocument={selectDocument}
								/>
							))}
						</Stack>
					</DisclosureContent>
				</DisclosureProvider>
			</Stack>
		);
	},
);
