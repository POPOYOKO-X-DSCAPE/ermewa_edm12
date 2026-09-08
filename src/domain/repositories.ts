import { createRepositories } from "../core/domain.builders";
import entityBuilders from "./entities";

export const repositories = createRepositories(entityBuilders);
