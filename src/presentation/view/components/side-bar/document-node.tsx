import { Tooltip, TooltipAnchor, TooltipProvider } from "@ariakit/react";
import { Badge, Ellipsis, Stack } from "@packages/ui";
import { RiFile2Line } from "@remixicon/react";
import { createComponent } from "@src/core/component.builder";
import { translations } from "@src/i18n";
import { Status } from "@src/presentation/components/status/status";
import type { SidebarDocument } from "@src/presentation/contracts/side-bar.interface";
import { memo, useCallback } from "react";
import { toSidebarActions } from "./action-icons";
import { resolveDocumentCodeFromNode } from "./node-ids";
import { SelectedDocumentActions } from "./selected-document-actions";
import type { SelectDocumentHandler } from "./side-bar";
import { SideBarElementRow } from "./side-bar-primitives";
import { SideBarActionButtons } from "./sidebar-actions";
import { Styles } from "./styles";

const DocumentNodeActions = createComponent<{
  documentCode: string;
}>(
  ({
    models: {
      documentModel: { documentNodeActionsByDocumentCode },
    },
    controllers: {
      documentController: { runDocumentAction },
    },
    props,
  }) => {
    const actions = toSidebarActions({
      documentCode: props.documentCode,
      actions: documentNodeActionsByDocumentCode(props.documentCode),
      runDocumentAction,
    });

    return <SideBarActionButtons actions={actions} />;
  },
);

const DocumentContent = memo(
  ({
    document,
    documentCode,
  }: {
    document: SidebarDocument;
    documentCode: string;
  }) => (
    <Stack direction="row" alignItems="center" className={Styles.gapped} grow>
      <Stack>
        <Stack>
          <RiFile2Line />
        </Stack>
        {document.badge && (
          <Stack
            position={{
              type: "relativeToParent",
              position: ["bottom", "left"],
            }}
            className={Styles.modifiedBadge}
          >
            <TooltipProvider>
              <TooltipAnchor>
                <Badge>{document.badge}</Badge>
              </TooltipAnchor>
              <Tooltip>
                {document.badge === "M"
                  ? translations.t("sidebarBadgeUnsavedChanges")
                  : translations.t("sidebarBadgeNotUploaded")}
              </Tooltip>
            </TooltipProvider>
          </Stack>
        )}
      </Stack>

      <TooltipProvider>
        <Tooltip>{document.status.label}</Tooltip>
        <TooltipAnchor>
          <Status statusType={document.status.number} />
        </TooltipAnchor>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>{documentCode}</Tooltip>
        <TooltipAnchor render={<div style={{ overflow: "hidden" }} />}>
          <Ellipsis>{document.name}</Ellipsis>
        </TooltipAnchor>
      </TooltipProvider>
    </Stack>
  ),
);

export const DocumentNode = memo(
  ({
    document,
    selectDocument,
  }: {
    document: SidebarDocument;
    selectDocument?: SelectDocumentHandler;
  }) => {
    const documentCode = resolveDocumentCodeFromNode(document);
    const [folderName, folderSid, natureCode] = document.path;

    const handleClick = useCallback(() => {
      if (!selectDocument) {
        document.selectOnAction();
        return;
      }

      void selectDocument({
        documentCode,
        natureCode,
        folder: {
          name: folderName,
          sid: folderSid,
        },
      });
    }, [
      document,
      documentCode,
      folderName,
      folderSid,
      natureCode,
      selectDocument,
    ]);

    return (
      <SideBarElementRow
        active={document.isSelected}
        onClick={handleClick}
        content={
          <DocumentContent document={document} documentCode={documentCode} />
        }
        actions={
          document.isSelected ? (
            <SelectedDocumentActions documentCode={documentCode} />
          ) : (
            <DocumentNodeActions documentCode={documentCode} />
          )
        }
      />
    );
  },
  (previousProps, nextProps) =>
    previousProps.document === nextProps.document &&
    previousProps.selectDocument === nextProps.selectDocument,
);
