import type {
  BaseDocument,
  FileExtension,
  LooseAutocomplete,
} from "@packages/free/miscellaneous-types";

import { PageSizes } from "pdf-lib";

const createFile = async ({
  name,
  extension,
  dataURL: objectURL,
  type,
}: {
  name: string;
  extension: LooseAutocomplete<FileExtension>;
  dataURL: string;
  type: string;
}): Promise<File> => {
  const base64 = await createBase64.fromObjectURL(objectURL);
  const buffer = getArrayBuffer(base64);
  const blob = new Blob([buffer], { type });

  return new File([blob], `${name}.${extension}`, { type });
};

const createFiles = async (documents: BaseDocument[]): Promise<File[]> =>
  Promise.all(documents.map((document) => createFile(document)));

const createBase64 = {
  async fromObjectURL(objectURL: string) {
    try {
      const response = await fetch(objectURL);
      const blob = await response.blob();

      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result.split(",")[1]);
          } else {
            reject(new Error("Failed to convert data to base64."));
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read the data."));
        };
        reader.readAsDataURL(blob);
      });

      return base64String;
    } catch (error) {
      throw new Error("Failed to fetch and convert the object to base64.");
    }
  },
  async fromFile(file: File) {
    const objectURL = URL.createObjectURL(file);

    return await this.fromObjectURL(objectURL);
  },
};

const getArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
};

const getBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const createBaseDocument = (file: File): BaseDocument => {
  const { name: fullName, size, type, lastModified } = file;

  const [name, extensionWithDot] = fullName.split(/(?=\.[^.]+$)/);
  const extension = extensionWithDot.slice(1);

  return {
    dataURL: window.URL.createObjectURL(file),
    name,
    extension,
    size,
    type,
    lastModified,
  };
};

const createFileList = (files: File[]): FileList => {
  const dataTransfer = new DataTransfer();

  for (const file of files) {
    dataTransfer.items.add(file);
  }

  return dataTransfer.files;
};

const createBaseDocuments = (files: FileList | File[]) =>
  Array.from(files).map((file) => createBaseDocument(file));

const getFileNameAndExtension = (fileName: string): [string, string] => {
  const dotIndex = fileName.lastIndexOf(".");
  const name = fileName.substring(0, dotIndex);
  const extension = fileName.substring(dotIndex + 1);

  return [name, extension];
};
const base64ToFile = (base64String: string, filename: string) => {
  // Split the base64 string in case it includes metadata (like `data:image/png;base64,`)
  const [binaryHeader, base64Data] = base64String.split(",");

  const match = binaryHeader.match(/^data:(.+?);base64,/);
  const mimeTypeFromBase64 = match ? match[1] : null;

  const extension = filename.slice(filename.lastIndexOf("."));

  const mimeType =
    mimeTypeFromBase64 ||
    getMimeTypeFromExtension(extension) ||
    "application/octet-stream";

  // Decode the Base64 string
  const byteCharacters = atob(base64Data);

  // Create a Uint8Array to hold the binary data
  const byteNumbers = new Uint8Array(byteCharacters.length);

  // Fill the Uint8Array with the binary data
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  // Create a Blob from the Uint8Array
  const blob = new Blob([byteNumbers], { type: mimeType });

  // Create a File instance from the Blob
  const file = new File([blob], filename, { type: mimeType });

  return file;
};

const calculateNewSize = (
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
) => {
  let width = image.width;
  let height = image.height;

  // calculate the width and height, constraining the proportions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  return [width, height];
};

const resizeImages = async (files: File[]) => {
  const promises = files.map(
    (file) =>
      new Promise<File>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(image.src);
          const [newWidth, newHeight] = calculateNewSize(
            image,
            ...PageSizes.A4
          );
          const canvas = document.createElement("canvas");
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(image, 0, 0, newWidth, newHeight);
            canvas.toBlob(
              (blob) => {
                const filename = `${file.name.split(".").slice(0, -1)}.jpeg`;
                if (blob) {
                  resolve(new File([blob], filename, { type: "image/jpeg" }));
                } else {
                  reject("blob is undefined.");
                }
              },
              "image/jpeg",
              0.7
            );
          } else {
            reject("ctx is undefined.");
          }
        };

        image.src = url;
      })
  );

  return await Promise.all(promises);
};

const sortFilesToProcessOrRejectBasedOnTypeAndSize = (
  files: File[],
  maxSize?: number
) => {
  // biome-ignore lint/suspicious/noSparseArray: <explanation>
  if (!maxSize) return [, , files];

  const sorted = files.reduce(
    (acc, it) => {
      if (it.size > maxSize * 1000) {
        const index = it.type.split("/")[0] === "image" ? 0 : 1;
        acc[index].push(it);
      } else acc[2].push(it);

      return acc;
    },
    [[], [], []] as [File[], File[], File[]]
  );

  return sorted;
};

const getMimeTypeFromExtension = (extension: string) => {
  const mimeTypeMapping: { [key: string]: string } = {
    // Application Types
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".zip": "application/zip",
    ".rar": "application/vnd.rar",
    ".7z": "application/x-7z-compressed",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".bz2": "application/x-bzip2",
    ".json": "application/json",
    ".xml": "application/xml",
    ".csv": "text/csv",
    ".exe": "application/octet-stream",
    ".bin": "application/octet-stream",
    ".dll": "application/octet-stream",
    ".deb": "application/vnd.debian.binary-package",
    ".dmg": "application/x-apple-diskimage",
    ".iso": "application/x-iso9660-image",
    ".apk": "application/vnd.android.package-archive",
    ".msi": "application/x-msdownload",
    ".msg": "application/vnd.ms-outlook",

    // Image Types
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".webp": "image/webp",
    ".ico": "image/vnd.microsoft.icon",
    ".svg": "image/svg+xml",
    ".psd": "image/vnd.adobe.photoshop",

    // Audio Types
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".m4a": "audio/mp4",
    ".wma": "audio/x-ms-wma",
    ".aiff": "audio/aiff",
    ".mid": "audio/midi",
    ".midi": "audio/midi",

    // Video Types
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".3gp": "video/3gpp",
    ".3g2": "video/3gpp2",

    // Text Types
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".jsx": "application/javascript",
    ".tsx": "application/typescript",
    ".md": "text/markdown",
    ".rtf": "application/rtf",
    ".log": "text/plain",

    // Font Types
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".eot": "application/vnd.ms-fontobject",
  };

  return extension.startsWith(".")
    ? mimeTypeMapping[extension]
    : mimeTypeMapping[`.${extension}`];
};

export default {
  createFileList,
  createFile,
  createFiles,
  createBase64,
  getArrayBuffer,
  getBase64,
  base64ToFile,
  createBaseDocument,
  createBaseDocuments,
  getFileNameAndExtension,
  resizeImages,
  sortFilesToProcessOrRejectBasedOnTypeAndSize,
  getMimeTypeFromExtension,
};
