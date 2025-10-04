import type { FolderTreeBodyResponse } from "@/interface-adapters/external-types";

function extractWagonNumber(
  input: string,
  links: FolderTreeBodyResponse["XLNK"]
) {
  // Expression régulière pour trouver les clés après "LNK"
  const regex = /LNK\.([^.]+)\.([^\]]+)[^#]/;

  const match = input.match(regex);

  if (match) {
    const firstKey = match[1];
    const secondKey = match[2].substring(0, match[2].length - 1); // Je retire le '#' à la fin de la seconde clé

    // @ts-ignore
    if (links?.[firstKey]?.[secondKey]) {
      // @ts-ignore
      return links[firstKey][secondKey];
    }

    return null; // Si les clés ne permettent pas d'accéder au numéro de wagon
  }

  return null; // Si le format de la chaîne ne correspond pas
}

export default extractWagonNumber;
