export type AttachmentKind = "image" | "video" | "pdf" | "text" | "document";

export const maxPostAttachments = 10;
export const maxContentAttachments = 100;
export const maxPostAttachmentBytes = 50 * 1024 * 1024;
export const maxAttachmentPreviewTextLength = 50_000;

const extensionContentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".csv": "text/csv",
  ".c": "text/plain",
  ".cpp": "text/plain",
  ".css": "text/css",
  ".go": "text/plain",
  ".html": "text/html",
  ".h": "text/plain",
  ".java": "text/plain",
  ".js": "text/javascript",
  ".jsx": "text/javascript",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".py": "text/x-python",
  ".r": "text/plain",
  ".rs": "text/plain",
  ".sql": "application/sql",
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".xml": "application/xml",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".md": "text/markdown",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogg": "video/ogg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".txt": "text/plain",
  ".webm": "video/webm",
  ".webp": "image/webp"
};

export const allowedPostAttachmentTypes = new Set([
  "application/json",
  "application/pdf",
  "application/sql",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/xml",
  "application/yaml",
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/css",
  "text/html",
  "text/javascript",
  "text/markdown",
  "text/plain",
  "text/typescript",
  "text/x-python",
  "video/mp4",
  "video/ogg",
  "video/quicktime",
  "video/webm"
]);

export const postAttachmentAccept = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/css",
  "text/html",
  "text/javascript",
  "text/typescript",
  "text/x-python",
  "application/json",
  "application/sql",
  "application/xml",
  "application/yaml",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".r",
  ".rs",
  ".go",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".html",
  ".css",
  ".xml",
  ".yaml",
  ".yml",
  ".sql",
  ".xlsx",
  ".docx"
].join(",");

const extensionForFileName = (fileName: string) => {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
};

const normalizedContentType = (contentType: string) => {
  const normalized = contentType.trim().toLowerCase().split(";", 1)[0] ?? "";
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
};

export const attachmentContentTypesMatch = (left: string, right: string) =>
  normalizedContentType(left) === normalizedContentType(right);

export const validateAttachmentNameAndContentType = (fileName: string, contentType: string) => {
  const extension = extensionForFileName(fileName);
  const expected = extensionContentTypes[extension];
  if (expected && !attachmentContentTypesMatch(expected, contentType)) {
    return `The ${extension} file extension does not match the declared attachment type.`;
  }
  return null;
};

export const inferAttachmentContentType = (fileName: string, contentType?: string | null) => {
  const normalized = (contentType ?? "").trim().toLowerCase();
  if (normalized && normalized !== "application/octet-stream") return normalized;
  return extensionContentTypes[extensionForFileName(fileName)] ?? normalized;
};

export const attachmentKindForContentType = (contentType: string): AttachmentKind => {
  const normalized = contentType.toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("video/")) return "video";
  if (normalized === "application/pdf") return "pdf";
  if (normalized.startsWith("text/") || normalized === "application/json") return "text";
  return "document";
};

export const validatePostAttachmentDetails = (fileName: string, contentType: string, byteSize: number) => {
  if (!fileName.trim()) return "Attachment file name is required.";
  if (!allowedPostAttachmentTypes.has(contentType.toLowerCase())) {
    return "Attach an image, video, PDF, document, spreadsheet, text, Markdown, or source-code file.";
  }
  const nameTypeError = validateAttachmentNameAndContentType(fileName, contentType);
  if (nameTypeError) return nameTypeError;
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > maxPostAttachmentBytes) {
    return "Post attachments must be 50 MB or smaller.";
  }
  return null;
};

const startsWithBytes = (bytes: Uint8Array, expected: number[]) =>
  expected.every((value, index) => bytes[index] === value);

const asciiAt = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.slice(start, start + length));

const containsAscii = (bytes: Uint8Array, value: string, start = 0, end = bytes.byteLength) =>
  asciiAt(bytes, start, Math.max(0, Math.min(end, bytes.byteLength) - start)).includes(value);

export const validateAttachmentContentSignature = (contentType: string, bytes: Uint8Array) => {
  const normalized = normalizedContentType(contentType);
  if (!bytes.byteLength) return "The uploaded attachment is empty.";

  const valid = (() => {
    switch (normalized) {
      case "image/png":
        return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      case "image/jpeg":
        return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
      case "image/gif":
        return asciiAt(bytes, 0, 6) === "GIF87a" || asciiAt(bytes, 0, 6) === "GIF89a";
      case "image/webp":
        return asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP";
      case "image/avif":
        return asciiAt(bytes, 4, 4) === "ftyp" && (containsAscii(bytes, "avif", 8, 40) || containsAscii(bytes, "avis", 8, 40));
      case "application/pdf":
        return asciiAt(bytes, 0, 5) === "%PDF-";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]);
      case "video/mp4":
      case "video/quicktime":
        return asciiAt(bytes, 4, 4) === "ftyp";
      case "video/webm":
        return startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
      case "video/ogg":
        return asciiAt(bytes, 0, 4) === "OggS";
      case "text/plain":
      case "text/markdown":
      case "text/csv":
      case "application/json":
      case "application/sql":
      case "application/xml":
      case "application/yaml":
      case "text/css":
      case "text/html":
      case "text/javascript":
      case "text/typescript":
      case "text/x-python":
        return !bytes.includes(0);
      default:
        return false;
    }
  })();

  return valid ? null : "The uploaded file contents do not match the declared attachment type.";
};

export const formatAttachmentBytes = (byteSize: number) => {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(byteSize < 10 * 1024 ? 1 : 0)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(byteSize < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

export const splitPreviewTextIntoPages = (text: string, pageSize = 2200) => {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [""];
  const pages: string[] = [];
  for (let index = 0; index < clean.length; index += pageSize) {
    pages.push(clean.slice(index, index + pageSize));
  }
  return pages;
};
