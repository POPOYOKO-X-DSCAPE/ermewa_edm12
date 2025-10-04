import classNames from "classnames";
import { useMemo } from "react";

import { DOCUMENT_STATUS_MAP } from "@/domain/types/document";
import { usePersisterContext } from "@/presentation/contexts/persister-context";

import type { DocumentNodeProps } from "./types";

import Button from "../button";
import { Icon } from "../icon";

import "./document.scss";
import { useAppContext } from "@/presentation/contexts/app-context";

const DocumentNode: React.FC<DocumentNodeProps> = ({
  actions,
  document,
  handleNavigation,
  cancelDocument,
  // customRef,
  updates,
  isSelected,
}) => {
  const documentName = useMemo(
    () => updates?.name || document.name.baseName,
    [updates, document]
  );

  const {
    reloadDocument,
    currentNode: { document: currentDocument },
  } = useAppContext();
  const { getInitialState, setRequest, setIsLoading } = usePersisterContext();

  const status = useMemo(() => {
    if (document) {
      const index = getInitialState(document.documentCode)?.status || 0;
      return DOCUMENT_STATUS_MAP[index];
    }

    return DOCUMENT_STATUS_MAP[0];
  }, [document, getInitialState]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <li
      className={classNames("document-node", { active: isSelected })}
      onClick={handleNavigation}
      onDragEnter={handleNavigation}
      title={`${document.documentCode} - ${document.lastTimeUpdated}`}
      data-anchor={document.documentCode}
      // ref={customRef}
    >
      <div
        className="document-status"
        title={status.label}
        style={{ backgroundColor: status.backgroundColor }}
      />
      {documentName}
      <div className={classNames("actions")}>
        {document.isLocal ? (
          <>
            <span
              className={classNames("flag")}
              title={"save it to database to save your work"}
            >
              <span className={classNames("wip")} />
              local document
              <span className={classNames("wip")} />
            </span>
            <Button.Icon
              title="cancel"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cancelDocument();
              }}
            >
              <Icon.Delete size="medium" />
            </Button.Icon>
          </>
        ) : (
          currentDocument?.documentCode === document.documentCode && (
            <Button.Icon
              title="reload"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsLoading(true);
                const freshDocument = await reloadDocument(
                  document.documentCode
                );
                if (freshDocument) {
                  setRequest(
                    {
                      documentCode: freshDocument.documentCode,
                      name: freshDocument.name.baseName,
                      documentDate: freshDocument.documentDate,
                      documentExpires: freshDocument.documentExpires,
                      status: freshDocument.state,
                    },
                    true // workaround to avoid save button appearance on document reload
                  );
                }
                setIsLoading(false);
              }}
            >
              <Icon.Reload size="medium" />
            </Button.Icon>
          )
        )}
        { isSelected && <Button.MenuIcon
          size="medium"
          buttons={actions.map(({ handler, label }, index) => ({
            onClick: handler,
            children: [
              <p
                key={`document-action-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  index
                }`}
              >
                {label}
              </p>,
            ],
          }))}
        />}
      </div>
    </li>
  );
};

export default DocumentNode;
