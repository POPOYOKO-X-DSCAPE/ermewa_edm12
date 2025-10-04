import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";

import type { UpdateRequestInterface } from "@/interface-adapters/gateways/document-update/request-adapter";

import useTextualContent from "@/presentation/hooks/use-textual-content";

import { Dialog } from "../dialog";
import { Snackbar } from "../snackbar";

import Button from "../button";

import "./index.scss";

type SyncTableProps = {
  records: UpdateRequestInterface[];
  savable: boolean;
  save: () => Promise<void>;
};

const SyncTable: React.FC<SyncTableProps> = ({ records, savable, save }) => {
  const text = useTextualContent();

  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => setIsOpen(false);

  useEffect(() => {
    console.log("sync table records:");
    console.log(records);
  }, [records]);

  return (
    <div className={classNames("sync-table", { closed: !isOpen || !savable })}>
      {isOpen && (
        <Dialog onClose={() => closeDialog()}>
          <table>
            <thead>
              <tr>
                <th>{text.documentCode}</th>
                <th>{text.documentBaseName}</th>
                <th>{text.documentDate}</th>
                <th>{text.documentExpiringDate}</th>
                <th>File updated ?</th>
                <th>{text.documentStatus}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.documentCode}>
                  <td title={record.documentCode}>{record.documentCode}</td>
                  <td title={record.name}>{record.name}</td>
                  <td title={record.documentDate}>
                    {record.documentDate || "-"}
                  </td>
                  <td title={record.documentExpires}>
                    {record.documentExpires || "-"}
                  </td>
                  <td>{record.fileData ? "Yes" : "No"}</td>
                  <td title={record.status?.toString() || ""}>
                    {record.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={() => save()}>{text.syncUpdates}</Button>
        </Dialog>
      )}
      {records.length > 0 && (
        <Snackbar onClick={() => setIsOpen(!isOpen)}>
          {text.detectedUpdates} <b>({records.length})</b>
        </Snackbar>
      )}
    </div>
  );
};

export default SyncTable;
