import { createRepositories } from "./data-models";

export const { repositories, createViewModel } = createRepositories({
  documentNatures: {},
  documents: {},
  files: {
    ordered: "index",
    aggregates: {
      documents: {
        groupBy: (entity) => entity.state.documentCode,
      },
    },
  },
  pages: {
    ordered: "pageNumber",
    aggregates: {
      files: {
        groupBy: (entity) => entity.state.fileId,
      },
    },
  },
});
