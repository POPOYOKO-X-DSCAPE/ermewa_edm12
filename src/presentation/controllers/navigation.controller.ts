import { createController } from "@src/core/presentation.builder";

type SelectDocumentOptions = Readonly<{
	syncUrl?: boolean;
}>;

export const navigationBaseController = createController(
	({ stores }) => ({
		selectDocument: (
			description: {
				documentCode: string;
				natureCode: string;
				folder: { name: string; sid: string };
			},
			opts?: SelectDocumentOptions,
		) => {
			const { documentCode, natureCode, folder } = description;
			stores.appStore.patch({
				currentNavigation: {
					folder,
					natureCode,
					documentCode,
				},
			});

			if (!documentCode || !folder.sid || !natureCode) return;

			if (opts?.syncUrl === false) return;

			const url = new URL(window.location.href);
			url.searchParams.set("FLD", `${folder.name}$${folder.sid}`);
			url.searchParams.set("NAT", natureCode);
			url.searchParams.set("DOC", documentCode);

			window.history.replaceState(null, "", url.toString());
		},
	}),
);

export const navigationController = navigationBaseController.build();
