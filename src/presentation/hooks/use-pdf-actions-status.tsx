import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

import {
  faFileCode,
  faFileCsv,
  faFileExcel,
  faFileImage,
  faFilePdf,
  faFilePowerpoint,
  faFileText,
  faFileWord,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// type IconDescriptor = { Icon: JSX.Element; key: string; ext: string; };

const usePDFActionsStatus = (
  files: File[],
  targetExtensions: string[],
  isAdvancedConverterEnabled: boolean
) => {
  const [isMergeEnabled, setIsMergeEnabled] = useState(false);
  const [isStampEnabled, setIsStampEnabled] = useState(false);
  const [isUploadEnabled, setIsUploadEnabled] = useState(false);
  // const [extensionsAllowedOnDropMap, setExtensionsAllowedOnDropMap] = useState<IconDescriptor[]>([]);
  // const [extensionsUnavailableMap, setExtensionsUnavailableMap] = useState<IconDescriptor[]>([]);
  // const [extensionsTargetMap, setExtensionsTargetMap] = useState<IconDescriptor[]>([]);
  /** to implement(?) unavailableTargetExtensions */

  const convertibleNatively = ["pdf", "jpeg", "jpg", "png"];
  const convertibleByExternalService = [
    "ppt",
    "pptx",
    "odp",
    "doc",
    "docx",
    "odt",
    "xls",
    "xlsx",
    "ods",
    "csv",
  ];

  const convertibleExtensions = useMemo(
    () =>
      isAdvancedConverterEnabled
        ? [...convertibleNatively, ...convertibleByExternalService]
        : [...convertibleNatively],
    [isAdvancedConverterEnabled]
  );

  const hasPDFTarget = useMemo(
    () => targetExtensions.includes("pdf"),
    [targetExtensions]
  );
  const isDocumentEmpty = useMemo(() => files.length < 1, [files]);
  const hasMultipleFiles = useMemo(() => files.length > 1, [files]);

  const isEveryFileConvertible = useMemo(
    () =>
      files.length > 0 &&
      files.every((file) =>
        convertibleExtensions.includes(file.type.split("/")[1])
      ),
    [convertibleExtensions, files]
  );
  const hasSingleFile = useMemo(
    () => !hasMultipleFiles && !isDocumentEmpty,
    [hasMultipleFiles, isDocumentEmpty]
  );
  const hasSinglePDFFile = useMemo(
    () => hasSingleFile && files[0].type === "application/pdf",
    [hasSingleFile, files]
  );
  const hasSingleFileAndAllowedTarget = useMemo(() => {
    const file = files[0];
    if (!file) return false;

    const extensionFromType = file.type.split("/")[1];
    const extensionFromName =
      file.name.lastIndexOf(".") > 0
        ? file.name.slice(file.name.lastIndexOf(".") + 1)
        : "";

    return (
      hasSingleFile &&
      (targetExtensions.includes(extensionFromType) ||
        targetExtensions.includes(extensionFromName))
    );
  }, [targetExtensions, hasSingleFile, files]);

  const allowedExtensions = useMemo(() => {
    return hasPDFTarget
      ? Array.from(new Set([...convertibleExtensions, ...targetExtensions]))
      : [...targetExtensions];
  }, [hasPDFTarget, convertibleExtensions, targetExtensions]);
  const isEveryFileConvertibleAndHasPdfTarget = useMemo(
    () => isEveryFileConvertible && hasPDFTarget,
    [isEveryFileConvertible, hasPDFTarget]
  );

  useEffect(() => {
    setIsMergeEnabled(
      hasPDFTarget && hasMultipleFiles && isEveryFileConvertible
    );
  }, [hasPDFTarget, hasMultipleFiles, isEveryFileConvertible]);

  useEffect(() => {
    setIsStampEnabled(hasPDFTarget && hasSinglePDFFile);
  }, [hasPDFTarget, hasSinglePDFFile]);

  useEffect(() => {
    setIsUploadEnabled(
      hasSingleFileAndAllowedTarget || isEveryFileConvertibleAndHasPdfTarget
    );
  }, [hasSingleFileAndAllowedTarget, isEveryFileConvertibleAndHasPdfTarget]);

  const ArraysHaveCommonItem = useCallback(
    (array1: string[], array2: string[]) =>
      array1.some((item) => array2.includes(item)),
    []
  );

  const buildMapFromExtensionList = useCallback(
    (list: string[], greyedOut = false) => {
      const extensionMap = [
        { icon: faFilePdf, ext: ["pdf"], color: "#c11b06" },
        {
          icon: faFilePowerpoint,
          ext: ["ppt", "pptx", "odp"],
          color: "#d35232",
        },
        {
          icon: faFileWord,
          ext: ["doc?", "doc", "docx", "odt"],
          color: "#103f91",
        },
        { icon: faFileImage, ext: ["jpeg", "jpg", "png"], color: "#2aa6e9" },
        {
          icon: faFileExcel,
          ext: ["xls?", "xls", "xlsx", "ods"],
          color: "#185c37",
        },
        { icon: faFileCsv, ext: ["csv"], color: "#107c42" },
        { icon: faFileCode, ext: ["xml", "json"], color: "#ea7101" },
        { icon: faFileText, ext: ["txt", "msg"], color: "#222222" },
      ];

      return extensionMap
        .filter((item) => ArraysHaveCommonItem(list, item.ext))
        .map(({ icon, color, ext }) => {
          const unique = uuid();
          color = greyedOut ? "#bbbbbb" : color;

          return {
            Icon: (
              <FontAwesomeIcon
                {...{
                  icon,
                  color,
                }}
              />
            ),
            key: unique,
            ext: ext.filter((ex) => list.includes(ex)).join(","),
          };
        });
    },
    [ArraysHaveCommonItem]
  );

  const extensionsAllowedOnDropMap = useMemo(
    () => buildMapFromExtensionList(allowedExtensions),
    [allowedExtensions, buildMapFromExtensionList]
  );
  const unavailableExtensions = useMemo(
    () =>
      isAdvancedConverterEnabled
        ? []
        : convertibleByExternalService.filter(
            (extension) => !targetExtensions.includes(extension)
          ),
    [isAdvancedConverterEnabled, targetExtensions]
  );
  const extensionsUnavailableMap = useMemo(
    () => buildMapFromExtensionList(unavailableExtensions, true),
    [unavailableExtensions, buildMapFromExtensionList]
  );
  const extensionsTargetMap = useMemo(
    () => buildMapFromExtensionList(targetExtensions),
    [targetExtensions, buildMapFromExtensionList]
  );

  return {
    hasPDFTarget,
    isMergeEnabled,
    isStampEnabled,
    isUploadEnabled,
    extensionsAllowedOnDrop: allowedExtensions
      .map((ext) => `.${ext}`)
      .join(","),
    extensionsAllowedOnDropMap,
    extensionsUnavailableMap,
    extensionsTargetMap,
  };
};

export default usePDFActionsStatus;
