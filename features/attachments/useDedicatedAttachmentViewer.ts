"use client";

import { useEffect, useRef } from "react";
import type { InquiryItem } from "@/lib/mockData";

export type AttachmentViewerTarget = {
  itemId: string;
  commentId?: string;
  attachmentId: string;
};

export const useDedicatedAttachmentViewer = (
  items: InquiryItem[],
  setTarget: (target: AttachmentViewerTarget | null) => void
) => {
  const dedicated = useRef(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const attachmentId = parameters.get("attachment");
    if (parameters.get("viewer") !== "full" || !attachmentId) return;
    dedicated.current = true;

    for (const item of items) {
      if (item.attachments?.some((attachment) => attachment.id === attachmentId)) {
        setTarget({ itemId: item.id, attachmentId });
        return;
      }
      const stack = [...item.comments];
      while (stack.length) {
        const comment = stack.shift()!;
        if (comment.attachments?.some((attachment) => attachment.id === attachmentId) && comment.id) {
          setTarget({ itemId: item.id, commentId: comment.id, attachmentId });
          return;
        }
        stack.push(...(comment.replies ?? []));
      }
    }
  }, [items, setTarget]);

  return () => {
    if (dedicated.current) {
      window.location.assign("/");
      return;
    }
    setTarget(null);
  };
};
