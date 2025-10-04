import { useEffect, useMemo, useState } from "preact/hooks";
import { useLocation, useNavigate } from "react-router-dom";

import type { FolderTreeInterface } from "@/domain/types";

import findNodeBySid from "@/domain/parts/find-node-by-sid";

export const useUrlNavigation = (folderTree: FolderTreeInterface | null) => {
	const location = useLocation();
	const navigate = useNavigate();

	const [folderPaths, setFolderPaths] = useState<{
		folder: { sid: string; name: string } | null;
		document: string | null;
		nature: string | null;
	}>({
		folder: null,
		document: null,
		nature: null,
	});

	const selections = useMemo(() => {
		if (!folderTree || !folderPaths)
			return {
				folder: null,
				nature: null,
				document: null,
			};

		const { folder, nature: natureCode, document: documentCode } = folderPaths;

		const folderNode =
			(folderTree && folder?.sid && findNodeBySid(folderTree, folder.sid)) ||
			null;
		const natureNode =
			(folderNode &&
				folderNode.natures?.find((nature) => nature.code === natureCode)) ||
			null;
		const documentNode =
			(natureNode &&
				natureNode.documents.find(
					(document) => document.documentCode === documentCode,
				)) ||
			null;

		return {
			folder: folderNode,
			nature: natureNode,
			document: documentNode,
		};
	}, [folderPaths, folderTree]);

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const folderParam = queryParams.get("FLD");
		const natureParam = queryParams.get("NAT");
		const docParam = queryParams.get("DOC");

		if (folderParam && folderTree) {
			const [_, folderSid] = folderParam.split("$");
			const folder = findNodeBySid(folderTree, folderSid);

			setFolderPaths({
				folder: (folder && { name: folder.name, sid: folder.sid }) || null,
				nature: natureParam || null,
				document: docParam || null,
			});
		}
	}, [location.search, folderTree]);

	const navigateToFolder = (folderDesc: { sid: string; name: string }) => {
		const { sid, name } = folderDesc;

		if (!folderTree) return;

		const folder = findNodeBySid(folderTree, sid);
		if (folder) {
			navigate(`/?FLD=${name}$${sid}`);
			setFolderPaths({
				folder: folderDesc,
				nature: null,
				document: null,
			});
		}
	};

	const navigateToNature = (
		folderDesc: { sid: string; name: string },
		natureCode: string,
	) => {
		const { sid, name: folderName } = folderDesc;

		if (!folderTree) return;

		const folder = findNodeBySid(folderTree, sid);

		if (folder && folder.natures) {
			const foundNature = folder.natures.find(
				(nature) => nature.code === natureCode,
			);

			if (foundNature) {
				navigate(`/?FLD=${folderName}$${sid}&NAT=${natureCode}`);
				setFolderPaths({
					folder: folderDesc,
					nature: natureCode,
					document: null,
				});
			}
		}
	};

	const navigateToDoc = (
		folderDesc: { sid: string; name: string },
		natureCode: string,
		documentCode: string,
	) => {
		const { sid, name: folderName } = folderDesc;

		if (!folderTree) return;

		const node = findNodeBySid(folderTree, sid);
		if (node && node.natures) {
			const foundNature = node.natures.find(
				(nature) => nature.code === natureCode,
			);
			if (
				foundNature &&
				foundNature.documents &&
				foundNature.documents.find(
					(document) => document.documentCode === documentCode,
				)
			) {
				navigate(
					`/?FLD=${folderName}$${sid}&NAT=${natureCode}&DOC=${documentCode}`,
				);
				setFolderPaths({
					folder: folderDesc,
					nature: natureCode,
					document: documentCode,
				});
			}
		}
	};

	return {
		folderPaths,
		selections,
		navigateToFolder,
		navigateToNature,
		navigateToDoc,
	};
};
