import { useEffect, useMemo, useState } from "react";

import classNames from "classnames";

import type { DisplaySelectParameterInterface } from "./domain/types";

import { useAppContext } from "./presentation/contexts/app-context";
import {
  PersisterContextProvider,
  usePersisterContext,
} from "./presentation/contexts/persister-context";

import useDocument from "./presentation/hooks/use-document";
import usePDFActionsStatus from "./presentation/hooks/use-pdf-actions-status";
import useViewerProps from "./presentation/hooks/use-viewer-props";

// import { DocumentViewer } from "./presentation/components/document-viewer";
import { Loader } from "./presentation/components/loader";
import { Navigation } from "./presentation/components/navigation/navigation";

import Button from "./presentation/components/button";
import EditableField from "./presentation/components/editable-field";
// import SyncTable from "./presentation/components/sync-table";
import FolderSelect from "./presentation/components/folder-select";

import "./app.scss";
import { Heading, HeadingLevel } from "@ariakit/react";
import { Icon } from "./presentation/components/icon";

import { App as AbstractApp } from "@packages/ui/abstract/app";
import { DocumentViewer } from "@packages/ui/components/document-viewer/";

const App = () => {
  const {
    appProfile: {
      application: { version, name: applicationName },
      user: { login, languages },
      profile: {
        parameters: { displaySelectLayout },
      },
    },
    displaySelect,
    appTitle,
    loadingPath,
    folderTree,
    naturesStore,
    saveNatures,
    navigateFn,
    currentNode,
    currentFiles,
    isConverterEnabled,
  } = useAppContext();

  const {
    status,
    isLoading,
    selectedDocument,
    initialRecord,
    createNewDocument,
    cancelDocument,
    displayedFile,
  } = useDocument();
  const { records, setRequest } = usePersisterContext();

  const { extensionsTargetMap } = usePDFActionsStatus(
    currentFiles.map(({ instance }) => instance),
    currentNode.nature?.config.extension?.split(",") || [],
    isConverterEnabled
  );

  const viewerProps = useViewerProps();

  const currentRecord = useMemo(() => {
    return (
      records.find(
        (record) => record.documentCode === currentNode.document?.documentCode
      ) || initialRecord
    );
  }, [records, currentNode, initialRecord]);

  const appName = useMemo(() => {
    for (const lang of languages) {
      if (applicationName[lang]) {
        return applicationName[lang];
      }
    }
    return "";
  }, [languages, applicationName]);

  // test
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!displayedFile?.instance) return;

    const url = URL.createObjectURL(displayedFile.instance);
    setDocumentUrl(url);

    // Nettoyage pour éviter les fuites mémoire
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [displayedFile?.instance]);

  return (
    <AbstractApp>
      <HeadingLevel>
        <header className="app-header">
          <div className={classNames("app-name")}>
            <Heading>
              {appName}&nbsp;
              <br />
              <span>
                <span className={classNames("version")}>{version}</span>
                {" · "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
                {" · "}
                {login}
              </span>
            </Heading>
          </div>

          {folderTree && <div className="wagon">{appTitle}</div>}
          <div className={"right"}>
            {folderTree && (
              <Button
                onClick={() => {
                  const pathParts = window.location.pathname
                    .split("/")
                    .filter(Boolean);

                  const basePathIndex = import.meta.env.DEV ? 0 : 2;
                  const basePath = pathParts[basePathIndex];

                  if (basePath) {
                    const targetPath = `/${pathParts.slice(0, basePathIndex + 1).join("/")}/`;
                    window.location.href = targetPath;
                  }
                }}
              >
                <Icon.MenuSearch size="small" />
                Folders
              </Button>
            )}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <div
              className="logged-user"
              title={login}
              onClick={() => {
                window.location.reload();
              }}
            >
              {login[0]}
            </div>
          </div>
        </header>
        <main>
          {!folderTree && (
            <FolderSelect
              items={displaySelect}
              parameter={displaySelectLayout as DisplaySelectParameterInterface}
            />
          )}
          {folderTree && (
            <Navigation
              {...{
                loadingPath,
                navigateFn,
                folderTree,
                naturesStore,
                saveNatures,
                createNewDocument,
                cancelDocument,
                currentNode,
                records,
              }}
            />
          )}

          {/* {currentRecord && (
					<DocumentViewer {...viewerProps}>
					<div className="document-infos">
					{!isLoading ? (
						<div
						title={
							status.label !== "rejected"
							? status.label
							: `${status.label} - ${selectedDocument?.memo}`
							}
							className="document-status"
							style={{ backgroundColor: status.backgroundColor }}
							/>
							) : (
								<Loader />
								)}
								<EditableField
								label="Base Name"
								initialValue={currentRecord.name}
								onChange={(value) => {
									setRequest({
										documentCode: currentRecord.documentCode,
										name: value,
										});
										}}
										/>
										{currentNode.nature?.config.documentDate && (
											<EditableField
											isDate
											label="Document Date"
											initialValue={currentRecord.documentDate}
											onChange={(value) => {
												setRequest({
													documentCode: currentRecord.documentCode,
													name: currentRecord.name,
													documentDate: value,
													});
													}}
													/>
													)}
													{currentNode.nature?.config.dueDate !== 3 && (
														<EditableField
														isDate
														label="Document Expires"
														initialValue={currentRecord?.documentExpires}
														onChange={(value) => {
															setRequest({
																documentCode: currentRecord.documentCode,
																name: currentRecord.name,
																documentExpires: value,
																});
																}}
																/>
																)}
																</div>
																<div className="document-actions">
																<div className={classNames("extensions")}>
																{extensionsTargetMap.map(({ Icon, ext, key }) => (
																	<span key={key} className="file-extension-icon" title={ext}>
																	{Icon}
																	</span>
																	))}
																	</div>
																	{viewerProps.actions
																	.filter(({ slot }) => slot === "document")
																	.map(
																		({ handler, label, predicate }) =>
																		predicate && (
																		<Button onClick={() => handler()} disabled={isLoading}>
																		{label}
																		</Button>
																		),
																		)}
																		</div>
																		</DocumentViewer>
																		)} */}
          {currentNode.document?.file.type && documentUrl && (
            <DocumentViewer
              url={documentUrl}
              type={currentNode.document.file.type}
              name={currentNode.document.name.baseName}
              date={currentNode.document.documentDate}
              expires={currentNode.document.documentExpires}
              status={currentNode.document.state}
              readonly={false}
            />
          )}
          {/* <SyncTable {...{ records, savable, save }} /> */}
        </main>
      </HeadingLevel>
    </AbstractApp>
  );
};

export default () => {
  return (
    <PersisterContextProvider>
      <App />
    </PersisterContextProvider>
  );
};
