import type { RecursiveVisitor } from "../types";

const recursiveVisitor: RecursiveVisitor = (obj, visitor, path = "") => {
	const visitArray = (array: any[], parentPath = "") => {
		array.forEach((item: any, index) => {
			const itemPath = `${parentPath}.${index}`;

			if (Array.isArray(item)) {
				recursiveVisitor(item, visitor, itemPath);
			} else {
				visitor.visit(item, index.toString(), itemPath, obj);
			}
		});
	};

	const visitProperties = (obj: Record<string, any>, parentPath = "") => {
		for (const [key, value] of Object.entries(obj)) {
			const currentPath = parentPath ? `${parentPath}.${key}` : key;

			if (typeof value === "object" && value !== null) {
				recursiveVisitor(value, visitor, currentPath);
			} else if (Array.isArray(value)) {
				visitArray(value, currentPath);
			} else {
				visitor.visit(value, key, currentPath, obj);
			}
		}
	};

	visitProperties(obj, path);
};

export default recursiveVisitor;
