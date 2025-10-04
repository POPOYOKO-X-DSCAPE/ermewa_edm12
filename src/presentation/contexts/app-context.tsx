import {
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import findNodeBySid from "@/domain/parts/find-node-by-sid";
import type {
	AppProfileInterface,
	DisplaySelectInterface,
	DocumentInterface,
	FileInterface,
	FolderTreeInterface,
	NatureObject,
} from "@/domain/types";
import useCases from "@/domain/use-cases";

import Logo from "@/presentation/assets/svg/ermewa-seeklogo.svg";

import { repositories } from "@/domain/repositories";
import initializeApp from "@/domain/use-cases/initialize-app";
import { Loader } from "../components/loader";
import useAsync from "../hooks/use-async";
import useFiles from "../hooks/use-files";
import usePingService from "../hooks/use-ping-service";
import useStore from "../hooks/use-store";
import useUrlNavigation, {
	type NavigationKeys,
} from "../hooks/use-url-navigation";

export type AppContext = {
	localMemory: {
		copiedFileId?: string;
		clipboard?: File;
	};
	setLocalMemory: (
		key: keyof AppContext["localMemory"],
		record?: AppContext["localMemory"][keyof AppContext["localMemory"]],
	) => void;
	isEditionMode: boolean;
	toggleEditionMode: (force?: boolean) => void;
	folderTree?: FolderTreeInterface;
	appProfile: AppProfileInterface;
	displaySelect?: DisplaySelectInterface;
	appTitle: string;
	loadingPath?: string[];
	navigationState: Partial<NavigationKeys>;
	navigateFn: (
		options: Partial<{
			folder: { name: string; sid: string };
			document: string;
			nature: string;
		}>,
	) => void;
	naturesStore: Record<string, NatureObject[]>;
	saveNatures: (folderSid: string, nature: NatureObject[]) => void;
	currentNode: {
		folder: FolderTreeInterface | undefined;
		nature: NatureObject | undefined;
		document: DocumentInterface | undefined;
	};
	currentFiles: FileInterface[];
	displayedFile: FileInterface | undefined;
	setDisplayedFile: Dispatch<SetStateAction<FileInterface | undefined>>;
	copiedFile:
		| {
				id: string;
				instance: File;
				rotation: number;
				documentCode: string;
				isLocal: boolean;
				index: number;
		  }
		| undefined;
	isConverterEnabled: boolean;
	reloadDocument: (
		documentCode?: string,
	) => Promise<DocumentInterface | undefined>;
};

const AppContext = createContext<AppContext | null>(null);

type AppContextProviderProps = {
	children: ReactNode;
};

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
	children,
}) => {
	const [isEditionMode, setIsEditionMode] = useState(false);

	const toggleEditionMode = (force?: boolean) => {
		setIsEditionMode((prev) => (force ? force : !prev));
	};

	const isConverterEnabled = usePingService("http://localhost:2099");

	const { store: localMemory, upsert: setLocalMemory } =
		useStore<AppContext["localMemory"]>();

	const { store: naturesStore, upsert: saveNatures } = useStore<
		AppContext["naturesStore"]
	>({});

	const { result: initialData } = useAsync(
		/* useCases.initializeApp */ initializeApp,
		{
			shouldLoadOnInit: true,
		},
	);

	const { navigationKeys: navigationState, navigateFn } =
		useUrlNavigation(initialData?.folderTree, {
			shouldCheckOnInit: true,
		});

	const currentNode = useMemo(() => {
		const {
			folder: folderDescription,
			nature: natureCode,
			document: documentCode,
		} = navigationState;

		let folder: FolderTreeInterface | undefined;
		let nature: NatureObject | undefined;
		let document: DocumentInterface | undefined;
		if (initialData?.folderTree && !!folderDescription?.sid) {
			folder = findNodeBySid(
				initialData.folderTree,
				folderDescription.sid,
			);
			if (folder) {
				nature = naturesStore[folder.sid]?.find(
					({ code }) => code === natureCode,
				);
				if (nature) {
					document = nature.documents.find(
						(document) => document.documentCode === documentCode,
					);
				}
			}
		}

		return { folder, nature, document };
	}, [navigationState, naturesStore, initialData]);

	const { files, displayedFile, setDisplayedFile } = useFiles(
		currentNode.document?.documentCode,
	);

	const copiedFile = useMemo(() => {
		const data = localMemory.copiedFileId
			? Object.values(
					repositories.files.read(localMemory.copiedFileId),
				)[0]
			: undefined;

		const result = data
			? { ...data.state, id: data.meta.id }
			: undefined;

		return result;
	}, [localMemory]);

	const loadPersistedFile = async () => {
		if (currentNode?.document) {
			const {
				documentCode,
				url,
				name: { baseName },
				file: { detailedUrl, type },
			} = currentNode.document;
			console.log(
				[baseName, documentCode, url, detailedUrl, type].join(" | "),
			);

			await useCases.getFileFromServer({
				name: baseName,
				documentCode,
				extension: type.toUpperCase(),
				url,
				detailedUrl,
			});
		}
	};

	const reloadDocument = async (documentCode?: string) => {
		let code = "";
		if (!currentNode.document?.documentCode && !documentCode) {
			console.error(
				"DocumentCode required to perform a document reload.",
			);
			return;
		}
		code =
			documentCode || (currentNode.document?.documentCode as string);
		try {
			const toDelete = files.map(({ id }) => id);
			const pagesToDelete = repositories.pages.entities
				.filter(({ state: { fileId } }) => toDelete.includes(fileId))
				.map(({ meta: { id } }) => id);
			const freshDocument = await useCases.loadDocument(code);
			await loadPersistedFile();
			repositories.files.delete(toDelete);
			repositories.pages.delete(pagesToDelete);
			console.log(freshDocument);
			const folderSid = currentNode.folder?.sid;
			if (folderSid && freshDocument) {
				const record = naturesStore[folderSid].map((nature) =>
					nature.code !== currentNode.nature?.code
						? nature
						: {
								...nature,
								documents: [
									...nature.documents.filter(
										(document) =>
											document.documentCode !== documentCode,
									),
									freshDocument,
								],
							},
				);
				saveNatures(folderSid, record);
				return freshDocument;
			}
		} catch (error) {
			console.error("document reload attempt failed.");
		}
	};

	const [persistedDocumentCodes, setPersistedDocumentCodes] = useState<
		string[]
	>([]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (
			currentNode?.document &&
			currentNode.document.isLocal === false
		) {
			const documentSelected = currentNode.document;

			if (
				!persistedDocumentCodes.includes(
					currentNode?.document.documentCode,
				)
			) {
				loadPersistedFile();
				setPersistedDocumentCodes((current) => [
					...current,
					documentSelected.documentCode,
				]);
			}
		}
	}, [currentNode?.document]);

	return initialData ? (
		<AppContext.Provider
			value={{
				...initialData,
				localMemory,
				setLocalMemory,
				isEditionMode,
				toggleEditionMode,
				navigationState,
				navigateFn,
				naturesStore,
				saveNatures,
				currentNode,
				currentFiles: files,
				displayedFile,
				setDisplayedFile,
				copiedFile,
				isConverterEnabled,
				reloadDocument,
			}}
		>
			{children}
		</AppContext.Provider>
	) : (
		<>
			<Loader fillContainer>
				Loading app
				<img src={Logo} alt={"Logo de Ermewa"} width={"92px"} />
			</Loader>
		</>
	);
};

export const useAppContext = () => {
	const context = useContext(AppContext);

	if (!context) {
		throw new Error(
			"useAppContext must be used within the scope of AppContextProvider.",
		);
	}

	return context;
};
