import { useMemo, useState } from "react";
import type { NatureNodeProps } from "./types";

import "./index.scss";

import { useAppContext } from "@/presentation/contexts/app-context";
import classNames from "classnames";
import Button from "../button";
import { Icon } from "../icon";

const NatureNode: React.FC<NatureNodeProps> = ({
  nature,
  createNewDocument,
  navigateFn,
  isMandatory = false,
  children,
}) => {
  const [open, setOpen] = useState(true);
  const {
    appProfile: {
      user: { languages },
    },
  } = useAppContext();

  const natureDescription = useMemo(() => {
    for (const lang of languages) {
      if (nature.config.description?.[lang]) {
        return nature.config.description[lang];
      }
    }
    return "";
  }, [languages, nature]);

  const toggleOpen = (force?: boolean) =>
    setOpen((prev) => (force !== undefined ? force : !prev));

  const handleAddDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleOpen(true);

    const code = createNewDocument(nature.code, nature.sid);
    navigateFn({
      folder: { name: nature.folderName, sid: nature.sid },
      nature: nature.code,
      document: code,
    });
  };

  const isEmpty = useMemo(
    () => nature.documents.length < 1,
    [nature.documents.length]
  );

  const isMono = useMemo(
    () => nature.config.numberLines === 1,
    [nature.config.numberLines]
  );

  const canAdd = useMemo(
    () => (isMono && isEmpty) || !isMono,
    [isMono, isEmpty]
  );

  return (
    <li className="nature-node nav-element">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <header
        className={classNames("label", {
          open,
        })}
        onClick={() => toggleOpen()}
      >
        {isMono ? (
          <Icon.Document size="small" />
        ) : (
          <Icon.Documents size="small" />
        )}
        <span>
          {isMandatory && (
            <span style={{ color: "red" }} title="mandatory">
              !&nbsp;
            </span>
          )}
          {nature.code} - {natureDescription}
        </span>

        <div className={classNames("actions")}>
          {canAdd && (
            <Button.Icon title="add document" onClick={handleAddDocument}>
              <Icon.Add size="small" />
            </Button.Icon>
          )}
          {!isEmpty ? (
            open ? (
              <Button.Icon title="collapse" onClick={() => toggleOpen()}>
                <Icon.ArrowUp size="small" />
              </Button.Icon>
            ) : (
              <Button.Icon title="open" onClick={() => toggleOpen()}>
                <Icon.ArrowDown size="small" />
              </Button.Icon>
            )
          ) : undefined}
        </div>
      </header>
      {
        <div className={classNames("nested", { open })}>
          <ul className="documents">{children(nature.documents)}</ul>
        </div>
      }
    </li>
  );
};

export default NatureNode;
