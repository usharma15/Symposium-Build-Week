import type { ContentQuote, InquiryItem } from "@/lib/mockData";
import { resolveLocalContentQuote } from "@/lib/contentQuotes";
import { parseCanonicalRoute } from "@/features/navigation/canonicalRoute";
import type { AttachedQuote, QuoteOwner } from "@/features/quotes/quoteTypes";

export type { AttachedQuote, QuoteLinkResolver, QuoteOwner } from "@/features/quotes/quoteTypes";

const commentsSectionTargetId = "__symposium-comments-section__";

export const attachedQuoteFromSnapshot = (quote: ContentQuote): AttachedQuote => ({
  quote,
  selection: {
    sourceType: quote.sourceType,
    sourceId: quote.sourceId,
    sourcePostId: quote.sourcePostId
  }
});

export const resolveQuoteLink = (
  items: InquiryItem[],
  value: string,
  owner?: QuoteOwner
): AttachedQuote => {
  const cleanValue = value.trim();
  if (!cleanValue) throw new Error("Paste a Symposium post or comment link.");

  let url: URL;
  try {
    url = new URL(cleanValue, "https://symposium.invalid");
  } catch {
    throw new Error("That does not look like a valid Symposium link.");
  }

  const route = parseCanonicalRoute(url.pathname, url.search);
  if (route.kind !== "post") throw new Error("Paste a Symposium post or comment link.");
  const commentId = route.commentId === commentsSectionTargetId ? undefined : route.commentId;
  const source = commentId
    ? { sourceType: "comment" as const, sourceId: commentId }
    : { sourceType: "post" as const, sourceId: route.postId };
  const quote = resolveLocalContentQuote(items, source, owner);
  if (!quote || quote.sourcePostId !== route.postId) {
    throw new Error("That comment does not belong to the linked post.");
  }

  return {
    quote,
    selection: {
      ...source,
      sourcePostId: quote.sourcePostId
    }
  };
};
