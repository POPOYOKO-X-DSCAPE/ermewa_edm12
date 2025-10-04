import classNames from "classnames";
import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type {
	DisplaySelectInterface,
	DisplaySelectParameterInterface,
} from "@/domain/types";
import { formatText } from "@/infra-structures/helpers/strings";

import Button from "../button";
import { Form } from "../form";

import "./index.scss";

const BASENAME = import.meta.env.PROD ? "/app/EDM12" : "";

type FolderSelectProps = {
	items?: DisplaySelectInterface;
	parameter: DisplaySelectParameterInterface;
};

const normalizeText = (text: string): string =>
	text
		.normalize("NFKD")
		.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
		.replace(/\s+/g, "")
		.toLowerCase();

const highlightMatch = (text: string, query: string) => {
	if (!query) return <span className="value">{text}</span>;

	const rawText = text.toString();
	const normalizedQuery = normalizeText(query);
	if (!normalizedQuery) return <span className="value">{rawText}</span>;

	const escapeRegExp = (str: string) =>
		str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const regexQuery = normalizedQuery
		.split("")
		.map((char) => escapeRegExp(char))
		.join("[\\s\\-–—]*");

	const regex = new RegExp(regexQuery, "gi");

	let lastIndex = 0;
	const matches = [...rawText.matchAll(regex)];
	if (matches.length === 0) return <span className="value">{rawText}</span>;

	const result: React.ReactNode[] = [];

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const start = match.index ?? 0;
		const end = start + match[0].length;

		result.push(rawText.slice(lastIndex, start));

		result.push(
			<span key={`hl-${i}`} className="highlight">
				{rawText.slice(start, end)}
			</span>,
		);

		lastIndex = end;
	}

	result.push(rawText.slice(lastIndex));

	return <span className="value">{result}</span>;
};

const FolderSelect: React.FC<FolderSelectProps> = ({ items, parameter }) => {
	const location = useLocation();
	const navigate = useNavigate();

	const [filters, setFilters] = useState<Record<string, string>>({});
	const [showAllList, setShowAllList] = useState<boolean>();

	const folderRef = useRef<string>(null);
	const sidRef = useRef<string>(null);
	const [error, setError] = useState("");

	const urlParts = location.pathname.split("/").filter(Boolean);
	const basePathIndex = import.meta.env.DEV ? 0 : 2;

	const hasFolder = !!urlParts[basePathIndex];
	const isEmpty = !items || items.length === 0;

	const layout = parameter.value.dspQuery?.content.layout.items[0].layout;
	const headers = layout?.header;
	const itemLayouts = layout?.items[0].bind;

	const filteredItems = useMemo(() => {
		return items?.filter((item) =>
			Object.entries(filters).every(([key, value]) => {
				const normalizedFilter = normalizeText(value);
				const itemValue = normalizeText(
					item[key as keyof typeof item]?.toString() || "",
				);
				return itemValue.includes(normalizedFilter);
			}),
		);
	}, [items, filters]);

	const handleFilterChange = (alias: string, value?: string) => {
		setFilters((prev) => {
			const newFilters = { ...prev };
			if (value) {
				newFilters[alias] = value;
			} else {
				delete newFilters[alias];
			}
			return newFilters;
		});
	};

	const getFormattedPlaceholder = (header: (typeof headers)[number]) => {
		const itemLayout = itemLayouts.find(
			(layout) => layout.field === header.linkto,
		);
		if (!itemLayout) return "";
		// @ts-ignore
		const fieldValue = items[0]?.[header.linkto] || "";

		return itemLayout.format
			? formatText(fieldValue, itemLayout.format)
			: fieldValue;
	};

	const renderItem = (item: DisplaySelectInterface[number]) => {
		const LinkWrapper: React.FC<{
			link?: string;
			children: React.ReactNode;
		}> = ({ link, children }) => {
			return link ? <a href={link}>{children}</a> : <>{children}</>;
		};

		const itemLink = itemLayouts
			.map(({ field, actions }) => {
				const value = item[field as keyof typeof item];
				const actionItem = actions?.[0];
				if (actionItem?.action === "select") {
					return `${window.location.pathname.replace(/\/$/, "")}/${value}`;
				}
				return null;
			})
			.find((link) => link !== null);

		const renderFields = (item: DisplaySelectInterface[number]) => {
			return itemLayouts.map(({ field, format }) => {
				const value = item[field as keyof typeof item]?.toString() || "";
				const formattedValue = format ? formatText(value, format) : value;
				const fieldName = headers.find((h) => h.linkto === field)?.defaultTxt;

				return (
					<span
						key={field}
						className={classNames("field", fieldName?.toLowerCase())}
					>
						{highlightMatch(formattedValue, filters[field] || "")}
					</span>
				);
			});
		};

		return (
			<li key={item.$uuid} className={classNames("item", "card")}>
				<LinkWrapper link={itemLink}>{renderFields(item)}</LinkWrapper>
			</li>
		);
	};

	const handleManualSubmit = () => {
		setError("");

		const folder = folderRef.current?.trim();
		const sid = sidRef.current?.trim();
		const finalFolder = folder || urlParts[basePathIndex];

		if (!finalFolder) {
			setError("Le champ 'Folder' est requis.");
			return;
		}

		if (!sid) {
			setError("Le champ 'Folder Number' est requis.");
			return;
		}

		const safeFolder = encodeURIComponent(finalFolder);
		const safeSid = encodeURIComponent(sid);
		const newPath = `${BASENAME}/${safeFolder}/${safeSid}${location.search}`;

		navigate(newPath, { replace: true });

		setTimeout(() => {
			window.location.href = newPath;
		}, 50);
	};

	if (isEmpty) {
		return (
			<div className="manual-input">
				<form
					onSubmit={(e) => e.preventDefault()}
					onKeyPress={(e) => {
						if (e.key === "Enter") {
							handleManualSubmit();
						}
					}}
				>
					<h1>Manual Folder Selection</h1>
					{!hasFolder && (
						<Form.Input
							label="Folder Name"
							placeholder="Ex: MNR"
							type="text"
							onChange={(e) => {
								const value = (e.target as HTMLInputElement).value;
								folderRef.current = value;
							}}
						/>
					)}
					<Form.Input
						label="Folder Number"
						placeholder="Ex: 24000249-0002"
						type="text"
						onChange={(e) => {
							const value = (e.target as HTMLInputElement).value;
							sidRef.current = value;
						}}
					/>
					{error && <p style={{ color: "red" }}>{error}</p>}
					<Button onClick={handleManualSubmit}>Load</Button>
				</form>
			</div>
		);
	}

	return (
		<div className="list-container">
			<div className={classNames("layout", { scroller: showAllList })}>
				<div className={classNames("filters")}>
					<h1>Find a Folder</h1>
					<Form>
						{headers.map((header) => (
							<Form.Input
								key={header.alias}
								label={`By ${header.defaultTxt}`}
								placeholder={getFormattedPlaceholder(header)}
								type="text"
								onChange={(e) =>
									handleFilterChange(
										header.linkto,
										(e.target as HTMLInputElement).value,
									)
								}
							/>
						))}
					</Form>
				</div>
				<ul
					className={classNames("list", { open: showAllList })}
					onWheel={() => setShowAllList(true)}
				>
					{filteredItems?.map(renderItem)}
					{!showAllList && (
						<Button onClick={() => setShowAllList(true)}>Show all</Button>
					)}
				</ul>
			</div>
		</div>
	);
};

export default FolderSelect;
