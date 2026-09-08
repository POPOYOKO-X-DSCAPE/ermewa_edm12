import { LoadableContent as Content } from "./loadable-content";
import { Context, useLoadable } from "./loadable-context";
import { LoadableLoader as Loader } from "./loadable-loader";
import { LoadableProvider as Provider } from "./loadable-provider";

export { Provider, Content, Loader, useLoadable };

export const Loadable = {
	Content,
	Context,
	Loader,
	Provider,
};
