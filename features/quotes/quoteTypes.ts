import type { ContentQuote, ContentQuoteSource } from "@/lib/mockData";

export type QuoteSelection = ContentQuoteSource & { sourcePostId: string };
export type QuoteOwner = { ownerId: string; ownerType: "post" | "comment" };
export type AttachedQuote = { quote: ContentQuote; selection: QuoteSelection };
export type QuoteLinkResolver = (link: string, owner?: QuoteOwner) => AttachedQuote;
