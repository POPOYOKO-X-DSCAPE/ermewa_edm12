import { Children, type ReactNode, isValidElement } from "react";

interface IFilteredChildren {
	children: ReactNode;
	includes?: Array<React.ElementType | string>;
	excludes?: Array<React.ElementType | string>;
	strict?: boolean;
	allowWarnings?: boolean; // New prop to toggle warnings
}

const isValidChild = (
	child: ReactNode,
	validComponents: Array<React.ElementType | string>,
) => {
	if (typeof child === "string") {
		return validComponents.includes(child);
	}
	return isValidElement(child) && validComponents.includes(child.type);
};

const isForbiddenChild = (
	child: ReactNode,
	excludes: Array<React.ElementType | string> | undefined,
) => {
	if (!excludes) return false; // If no excludes, don't consider it forbidden.
	if (typeof child === "string") {
		return excludes.includes(child);
	}
	return isValidElement(child) && excludes.includes(child.type);
};
/**
 * FilteredChildren component filters React children based on include and exclude lists.
 *
 * It allows for a flexible way to render child components based on specified criteria.
 *
 * If no `includes` are provided, all child components are allowed except those listed in `excludes`.
 * If `includes` is provided, only children that are valid according to this list will be rendered.
 *
 * @param {object} props - The properties for the FilteredChildren component.
 * @param {ReactNode} props.children - The children elements to filter.
 * @param {Array<React.ElementType | string>} [props.includes] - An optional array of allowed component types.
 * If provided, only these components will be rendered.
 * @param {Array<React.ElementType | string>} [props.excludes] - An optional array of excluded component types.
 * If provided, these components will not be rendered.
 * @param {boolean} [props.strict=false] - Indicates whether strict validation should be applied.
 * If true, an error will be thrown for any invalid or forbidden components.
 *
 * @throws {Error} If `strict` is true and a forbidden element is encountered, or if an invalid element is encountered when `includes` is defined.
 *
 * @returns {ReactNode} The filtered children that match either the allowed or excluded criteria.
 *
 * @example
 * ```tsx
 * import { FilteredChildren } from './FilteredChildren';
 *
 * const MyComponent = () => {
 *   return (
 *     <FilteredChildren
 *       includes={['MyComponentA', MyComponentB]}
 *       excludes={['ForbiddenComponent']}
 *       strict={true}
 *     >
 *       <MyComponentA />
 *       <MyComponentB />
 *       <ForbiddenComponent />
 *       <span>Allowed Span</span>
 *     </FilteredChildren>
 *   );
 * };
 * ```
 */

export const FilteredChildren = ({
	children,
	includes,
	excludes,
	strict = false,
	allowWarnings = false, // Initialize allowWarnings
}: IFilteredChildren) => {
	return Children.map(children, (child) => {
		// Check if the child is in the excludes list
		if (isForbiddenChild(child, excludes)) {
			if (strict) {
				throw new Error(
					`Forbidden element: ${child} is not allowed. ${
						excludes
							? `Forbidden types: ${excludes
									.map((component) =>
										typeof component === "string"
											? component
											: component.name || component,
									)
									.join(", ")}`
							: ""
					}`,
				);
			}

			if (allowWarnings) {
				console.warn(
					`Warning: Element of type '${child}' is forbidden. ${
						excludes
							? `Forbidden types: ${excludes
									.map((component) =>
										typeof component === "string"
											? component
											: component.name || component,
									)
									.join(", ")}`
							: ""
					}`,
				);
			}
			return null; // Skip forbidden components
		}

		// Check inclusion logic
		if (includes) {
			// If includes is provided, only return the valid ones
			if (isValidChild(child, includes)) {
				return child;
			}
		} else {
			// If includes is not provided, allow all except excluded ones
			return child; // Allow all components
		}

		if (strict) {
			throw new Error(
				`Invalid element: ${child} is not of a valid type. ${
					includes
						? `Expected: ${includes
								.map((component) =>
									typeof component === "string"
										? component
										: component.name || component,
								)
								.join(", ")}`
						: ""
				}`,
			);
		}

		let childType = "undefined";
		if (isValidElement(child)) {
			const type = child.type;
			if (typeof type === "string") {
				childType = type;
			} else if (typeof type === "function") {
				childType = type.name || "Anonymous";
			}
		} else if (typeof child === "string") {
			childType = child;
		}

		if (allowWarnings) {
			console.warn(
				`Warning: Element of type '${childType}' is not valid. Expected: ${
					includes
						? includes
								.map((component) =>
									typeof component === "string"
										? component
										: component.name || component,
								)
								.join(", ")
						: "any valid component"
				}`,
			);
		}

		return null; // Skip this child
	});
};
