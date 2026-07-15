"use client";

import { PenLine } from "lucide-react";
import type { InquiryAttachment } from "@/lib/mockData";

export function AttachmentScribbleButton({
  attachment,
  onAdd
}: {
  attachment: InquiryAttachment;
  onAdd: (attachment: InquiryAttachment) => void;
}) {
  return (
    <button
      type="button"
      className="attachment-scribble-action"
      title="Add attachment to Scribble"
      aria-label="Add attachment to Scribble"
      onClick={(event) => {
        event.stopPropagation();
        onAdd(attachment);
      }}
    >
      <PenLine size={15} />
    </button>
  );
}
