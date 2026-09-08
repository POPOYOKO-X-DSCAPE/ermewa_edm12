import { Fragment, type ReactNode, useEffect, useMemo } from "react";

import { Heading, HeadingLevel, useFormStore } from "@ariakit/react";
import { Button, Card, Input, Loadable, Stack } from "@packages/ui";
import { Scrollable } from "@packages/ui/abstract/scrollable/scrollable";
import { RiFilter2Line } from "@remixicon/react";
import { translations } from "@src/i18n";
import type {
	DisplaySelectItemView,
	DisplaySelectTextSegment,
	DisplaySelectViewProps,
} from "@src/presentation/contracts/display-select.interface";
import { styles } from "./styles";

const renderSegments = (
	segments: readonly DisplaySelectTextSegment[],
) =>
	segments.map((segment, index) =>
		segment.highlighted ? (
			<mark key={`${index}:${segment.text}`}>{segment.text}</mark>
		) : (
			<Fragment key={`${index}:${segment.text}`}>
				{segment.text}
			</Fragment>
		),
	);

const readFieldValue = (
	item: DisplaySelectItemView,
	key: DisplaySelectItemView["fields"][number]["key"],
) => item.fields.find((field) => field.key === key)?.value;

const Container = ({ children }: { children: ReactNode }) => (
	<Stack grow className={styles.container}>
		{children}
	</Stack>
);

const Header = ({ children }: { children?: ReactNode }) => (
	<Stack className={styles.header}>
		<Heading>Folder Selection</Heading>
		{children}
	</Stack>
);

const Filters = ({ children }: { children: ReactNode }) => (
	<Stack className={styles.filters}>{children}</Stack>
);

const Results = ({ children }: { children: ReactNode }) => (
	<Stack grow className={styles.results}>
		{children}
	</Stack>
);

export const DisplaySelectView = ({
	state,
	filters,
	items,
	totalCount,
	filteredCount,
	visibleCount,
	hasMore,
	remainingCount,
	manual,
	configurationError,
	errorMessage,
	isSubmitting,
	onFilterChange,
	onClearFilters,
	onShowAll,
	onSelectItem,
	onManualFolderNameChange,
	onManualFolderSidChange,
	onManualSubmit,
}: DisplaySelectViewProps) => {
	const { t } = translations;

	const manualForm = useFormStore({
		defaultValues: {
			folderName: manual.folderName,
			folderSid: manual.folderSid,
		},
	});

	useEffect(() => {
		manualForm.setValue("folderName", manual.folderName);
		manualForm.setValue("folderSid", manual.folderSid);
		manualForm.setError(
			"folderName",
			manual.errors.some((error) => error.field === "folderName")
				? t("displaySelectFolderNameRequired")
				: undefined,
		);
		manualForm.setError(
			"folderSid",
			manual.errors.some((error) => error.field === "folderSid")
				? t("displaySelectFolderNumberRequired")
				: undefined,
		);
	}, [
		manualForm,
		manual.folderName,
		manual.folderSid,
		manual.errors,
		t,
	]);

	if (state === "loading") {
		return (
			<Container>
				<HeadingLevel>
					<Header />
					<Results>
						<p role="status">{t("displaySelectLoading")}</p>
					</Results>
				</HeadingLevel>
			</Container>
		);
	}

	if (state === "error") {
		return (
			<Container>
				<Header />
				<Results>
					<p role="alert">
						{errorMessage ?? t("displaySelectLoadError")}
					</p>
				</Results>
			</Container>
		);
	}

	if (state === "invalid-configuration") {
		return (
			<Container>
				<Header />
				<Results>
					<p role="alert">
						{configurationError ??
							t("displaySelectInvalidConfiguration")}
					</p>
				</Results>
			</Container>
		);
	}

	if (state === "manual") {
		return (
			<Container>
				<Header>
					<HeadingLevel>
						<Heading>{t("displaySelectManualTitle")}</Heading>
					</HeadingLevel>
				</Header>
				<Filters>
					<form
						className="display-select__search"
						onSubmit={(event) => {
							event.preventDefault();
							void onManualSubmit();
						}}
					>
						<Stack>
							{manual.showFolderName && (
								<Input
									form={manualForm}
									name="folderName"
									label={t("displaySelectFolderName")}
									onChange={(event) =>
										onManualFolderNameChange(event.target.value)
									}
								/>
							)}

							<Input
								form={manualForm}
								name="folderSid"
								label={t("displaySelectFolderNumber")}
								onChange={(event) =>
									onManualFolderSidChange(event.target.value)
								}
							/>

							<button type="submit" disabled={isSubmitting}>
								{t("displaySelectLoadFolder")}
							</button>
						</Stack>
					</form>
				</Filters>
			</Container>
		);
	}

	const hasActiveFilters = filters.some((filter) =>
		Boolean(filter.value),
	);

	return (
		<Loadable.Provider>
			<Container>
				<Header>
					<p>
						{t("displaySelectShowingResult", {
							visible: visibleCount,
							filtered: filteredCount,
							total: totalCount,
						})}
					</p>
				</Header>
				<Filters>
					<form
						className="display-select__search"
						onSubmit={(event) => event.preventDefault()}
					>
						<fieldset className={styles.cappedWidth}>
							<HeadingLevel>
								<legend>
									<Heading>
										<Stack direction="row" alignItems="center">
											<RiFilter2Line size={24} />
											{t("displaySelectFilters")}
										</Stack>
									</Heading>
								</legend>
								<Stack direction="row" className={styles.inputs}>
									{filters.map((filter) => (
										<label key={filter.key}>
											<Stack grow>
												{filter.label}
												<input
													className={styles.input}
													type="search"
													name={filter.key}
													value={filter.value}
													placeholder={filter.placeholder}
													autoComplete="off"
													onChange={(event) =>
														onFilterChange(
															filter.key,
															event.currentTarget.value,
														)
													}
												/>
											</Stack>
										</label>
									))}
									{hasActiveFilters && (
										<Button onClick={onClearFilters}>
											{t("displaySelectClearFilters")}
										</Button>
									)}
								</Stack>
							</HeadingLevel>
						</fieldset>
					</form>
				</Filters>
				<Scrollable.Provider axis="y">
					<Scrollable.Content>
						<Results>
							{state === "empty" ? (
								<p role="status">{t("displaySelectNoMatches")}</p>
							) : (
								<Stack className={styles.resultsList}>
									{items.map((item) => (
										<Card
											key={item.id}
											onClick={() => void onSelectItem(item.id)}
											classname={styles.folderCard}
										>
											{item.fields.map((field) => (
												<Stack
													direction="column"
													key={field.key}
													className={`display-select__field display-select__field--${field.key} ${styles.field}`}
													data-field={field.key}
													grow
												>
													<HeadingLevel>
														<Heading>{field.label}</Heading>
													</HeadingLevel>
													<div
														className={`display-select__field-value ${styles.fieldValue}`}
													>
														{renderSegments(field.segments)}
													</div>
												</Stack>
											))}
										</Card>
									))}
								</Stack>
							)}
							{hasMore && (
								<Stack alignItems="center">
									<Button onClick={onShowAll}>
										{t("displaySelectShowAllRemaining", {
											count: remainingCount,
										})}
									</Button>
								</Stack>
							)}
						</Results>
					</Scrollable.Content>
				</Scrollable.Provider>
			</Container>
		</Loadable.Provider>
	);
};
