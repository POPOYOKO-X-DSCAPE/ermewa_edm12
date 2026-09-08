import { displaySelectController } from "@src/presentation/controllers/display-select.controller";
import { readDisplaySelectionLayout } from "@src/presentation/models/display-select/display-select-layout";

import { DisplaySelectFeature } from ".";
import { DisplaySelectView } from "./display-select-view";

export const DisplaySelectPage = () => {
	const state = displaySelectController.readDisplaySelectState();

	return (
		<DisplaySelectFeature
			items={state.items}
			layout={readDisplaySelectionLayout(state.appProfile)}
			loading={state.loading}
			errorMessage={state.errorMessage}
			locale={state.locale}
			onSelect={({ item, value }) => {
				displaySelectController.navigateToFolder({
					folderName: item.requestType.code,
					folderSid: value,
				});
			}}
			onManualSubmit={(selection) => {
				displaySelectController.navigateToFolder(selection);
			}}
		>
			{(viewProps) => <DisplaySelectView {...viewProps} />}
		</DisplaySelectFeature>
	);
};
