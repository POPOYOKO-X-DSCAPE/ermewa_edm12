type Mapping = {
  [key: string]: Mapping | string;
};

const parseErmiEscapeSequence = (
  input: string,
  mapping: Mapping,
  defaultKey = ""
): string => {
  const regex = /#([^#]+)#/g;

  let result = input;
  // @ts-ignore
  result = result.replace(regex, (match, path) => {
    const pathElements = path.split(".");

    let currentValue: Mapping | string | undefined = mapping[pathElements[0]];

    if (!currentValue) {
      return match;
    }

    for (let i = 1; i < pathElements.length; i++) {
      if (typeof currentValue === "string") {
        return match;
      }

      currentValue = currentValue[pathElements[i]];
      if (currentValue === undefined) {
        return match;
      }
    }

    const unresolved = import.meta.env.DEV ? match : "";

    // @ts-ignore
    return typeof currentValue === "string"
      ? currentValue
      : currentValue[defaultKey] || currentValue[""] || unresolved;
  });

  return result;
};

export default parseErmiEscapeSequence;
