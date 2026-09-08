import { componentFactory } from "./domain.builders";

import controllers from "../presentation/controllers";
import models from "../presentation/models";

export const createComponent = componentFactory.react({
	controllers,
	models,
});
