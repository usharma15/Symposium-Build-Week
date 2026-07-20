import type { InquiryAttachmentContract } from "@/packages/contracts/src";

export const tabletAttachmentTextLimit = 8000;

export const buildTabletAttachmentContext = (attachment: InquiryAttachmentContract) => {
  const metadata = attachment.metadata ?? {};
  const previewText = typeof metadata.previewText === "string"
    ? metadata.previewText.trim().slice(0, tabletAttachmentTextLimit)
    : "";
  const structuredPreview = metadata.structuredPreview && typeof metadata.structuredPreview === "object"
    ? JSON.stringify(metadata.structuredPreview).slice(0, tabletAttachmentTextLimit)
    : "";
  const pageCount = typeof metadata.pageCount === "number" && Number.isFinite(metadata.pageCount)
    ? Math.max(1, Math.trunc(metadata.pageCount))
    : null;

  return [
    `Attachment: ${attachment.fileName}`,
    `Type: ${attachment.contentType} · Kind: ${attachment.kind}`,
    pageCount ? `Pages or preview segments: ${pageCount}` : "",
    previewText
      ? `Extracted attachment text:\n${previewText}`
      : structuredPreview
        ? `Extracted structured attachment preview:\n${structuredPreview}`
        : "Attachment contents are not extracted in the current tablet context."
  ].filter(Boolean).join("\n");
};
