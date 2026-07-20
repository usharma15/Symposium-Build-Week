import { maxAttachmentPreviewTextLength } from "@/lib/attachmentRules";

const maxPdfMetadataPages = 40;
const maxPdfMetadataTextLength = Math.min(maxAttachmentPreviewTextLength, 48_000);

type PdfTextItem = {
  str: string;
  hasEOL?: boolean;
};

export type PdfAttachmentViewContext = {
  attachmentId: string;
  fileName: string;
  page: number;
  pageCount: number;
  currentPageText: string;
  previousPageText?: string;
  nextPageText?: string;
  selectedText?: string;
  status: "loading" | "ready" | "unavailable";
};

let pdfModulePromise: Promise<typeof import("pdfjs-dist")> | null = null;

export const resolvePdfDocumentUrl = (source: string, currentUrl: string) => {
  const resolved = new URL(source, currentUrl);
  const current = new URL(currentUrl);
  if (resolved.origin === current.origin) return resolved.toString();

  const configuredBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!configuredBase) return resolved.toString();

  try {
    const base = new URL(configuredBase);
    const basePath = base.pathname.replace(/\/$/, "");
    const sourceBelongsToPublicStore = resolved.origin === base.origin && (
      !basePath || resolved.pathname === basePath || resolved.pathname.startsWith(`${basePath}/`)
    );
    if (!sourceBelongsToPublicStore) return resolved.toString();

    const objectPath = resolved.pathname.slice(basePath.length).replace(/^\/+/, "");
    if (!objectPath) return resolved.toString();
    return `${current.origin}/attachment-assets/${objectPath}${resolved.search}`;
  } catch {
    return resolved.toString();
  }
};

export const loadPdfModule = () => {
  if (!pdfModulePromise) {
    pdfModulePromise = import("pdfjs-dist").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
      }
      return pdfjs;
    });
  }
  return pdfModulePromise;
};

const isPdfTextItem = (value: unknown): value is PdfTextItem =>
  Boolean(value && typeof value === "object" && "str" in value && typeof value.str === "string");

export const pdfTextItemsToPlainText = (items: unknown[]) => {
  const lines: string[] = [];
  let line = "";

  for (const item of items) {
    if (!isPdfTextItem(item)) continue;
    const text = item.str.replace(/\s+/g, " ").trim();
    if (text) {
      const separator = line && !/\s$/.test(line) && !/^[,.;:!?%\])}]/.test(text) ? " " : "";
      line += `${separator}${text}`;
    }
    if (item.hasEOL) {
      if (line.trim()) lines.push(line.trim());
      line = "";
    }
  }

  if (line.trim()) lines.push(line.trim());
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

export const readPdfPageText = async (
  document: import("pdfjs-dist").PDFDocumentProxy,
  pageNumber: number
) => {
  const page = await document.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return pdfTextItemsToPlainText(textContent.items);
};

const fallbackPdfPageCount = (bytes: ArrayBuffer) => {
  const text = new TextDecoder("latin1").decode(bytes);
  return text.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
};

export const extractPdfAttachmentMetadata = async (file: File): Promise<Record<string, unknown>> => {
  const bytes = await file.arrayBuffer();
  let loadingTask: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;

  try {
    const pdfjs = await loadPdfModule();
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bytes.slice(0)),
      enableXfa: false,
      stopAtErrors: false
    });
    const document = await loadingTask.promise;
    const pageSections: string[] = [];
    let previewLength = 0;
    const pagesToScan = Math.min(document.numPages, maxPdfMetadataPages);

    for (let pageNumber = 1; pageNumber <= pagesToScan && previewLength < maxPdfMetadataTextLength; pageNumber += 1) {
      const pageText = await readPdfPageText(document, pageNumber);
      if (!pageText) continue;
      const marker = `[PDF page ${pageNumber}]\n`;
      const remaining = maxPdfMetadataTextLength - previewLength - marker.length;
      if (remaining <= 0) break;
      const section = `${marker}${pageText.slice(0, remaining)}`;
      pageSections.push(section);
      previewLength += section.length + 2;
    }

    const previewText = pageSections.join("\n\n").slice(0, maxPdfMetadataTextLength);
    return {
      pageCount: document.numPages,
      pdfTextStatus: previewText ? "extracted" : "none",
      pdfTextPagesScanned: pagesToScan,
      pdfTextComplete: pagesToScan === document.numPages && previewLength < maxPdfMetadataTextLength,
      ...(previewText ? { previewText } : {})
    };
  } catch {
    const pageCount = fallbackPdfPageCount(bytes);
    return {
      ...(pageCount ? { pageCount } : {}),
      pdfTextStatus: "unavailable"
    };
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
  }
};
