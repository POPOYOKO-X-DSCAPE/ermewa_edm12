export type Observer<T> = (value: T) => void;

export type Visitor = {
	visit(value: any, key: string, path: string, obj: Record<string, any>): void;
};

export type RecursiveVisitor = (
	obj: Record<string, any>,
	visitor: Visitor,
	path?: string,
) => void;
