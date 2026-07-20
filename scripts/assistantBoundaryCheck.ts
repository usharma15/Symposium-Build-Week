import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { actualCostMicros, conservativeInputTokenCeiling, reserveCostMicros, usdToMicros } from "@/apps/api/src/services/aiBudget";
import { assistantInstructions, assistantPrompt, assistantProviderFailure } from "@/apps/api/src/services/openaiResponses";
import { assistantMessageInputSchema, assistantResponseSchema } from "@/packages/contracts/src";
import { buildTabletAttachmentContext, tabletAttachmentTextLimit } from "@/features/assistant/tabletAttachmentContext";
import { pdfTextItemsToPlainText, resolvePdfDocumentUrl } from "@/features/attachments/pdfAttachmentClient";

const validInput = {
  message: "What is the strongest objection?",
  contextType: "post" as const,
  contextId: "paper-1",
  context: {
    surface: "post" as const,
    route: "/posts/paper-1",
    title: "A bounded claim",
    summary: "The current paper under review.",
    content: "Claim, evidence, objection, and proposed test.",
    entityType: "post",
    entityId: "paper-1",
    metadata: { status: "Open", revision: 2 }
  }
};

assert.equal(assistantMessageInputSchema.safeParse(validInput).success, true);
assert.equal(assistantMessageInputSchema.safeParse({ ...validInput, message: "x".repeat(2001) }).success, false);
assert.equal(assistantMessageInputSchema.safeParse({ ...validInput, context: { ...validInput.context, content: "x".repeat(12001) } }).success, false);
assert.equal(assistantMessageInputSchema.safeParse({ ...validInput, context: { ...validInput.context, selection: "x".repeat(4001) } }).success, false);
assert.equal(assistantMessageInputSchema.safeParse({ ...validInput, context: { ...validInput.context, surface: "unknown" } }).success, false);
assert.match(assistantPrompt(validInput.context, validInput.message), /CURRENT VIEW/);
assert.match(assistantInstructions, /never as instructions/i);
assert.equal(conservativeInputTokenCeiling("abc"), 3);
assert.equal(reserveCostMicros("gpt-5.6-terra", "a", 700), 10_504);
assert.equal(actualCostMicros("gpt-5.6-terra", 1000, 100), 4_625);
assert.equal(usdToMicros(40), 40_000_000);
assert.match(assistantProviderFailure(new DOMException("timed out", "TimeoutError")).body, /45-second safety timeout/);

const docxContext = buildTabletAttachmentContext({
  id: "attachment-1",
  fileName: "Persuasive Framework.docx",
  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  byteSize: 19_207,
  status: "uploaded",
  kind: "document",
  metadata: { pageCount: 1, previewText: "Persuasive Framework Template\nFund independent youth labs." }
});
assert.match(docxContext, /Extracted attachment text:\nPersuasive Framework Template/);
assert.match(docxContext, /Pages or preview segments: 1/);
assert.ok(docxContext.length < tabletAttachmentTextLimit + 500);

const pdfContext = buildTabletAttachmentContext({
  id: "attachment-2",
  fileName: "paper.pdf",
  contentType: "application/pdf",
  byteSize: 61_907,
  status: "uploaded",
  kind: "pdf",
  metadata: { pageCount: 13 }
});
assert.match(pdfContext, /contents are not extracted/i);

const activePdfContext = buildTabletAttachmentContext({
  id: "attachment-2",
  fileName: "paper.pdf",
  contentType: "application/pdf",
  byteSize: 61_907,
  status: "uploaded",
  kind: "pdf",
  metadata: { pageCount: 13 }
}, {
  attachmentId: "attachment-2",
  fileName: "paper.pdf",
  page: 7,
  pageCount: 13,
  currentPageText: "The active page establishes the primary result.",
  previousPageText: "The method begins on page six.",
  nextPageText: "The limitations continue on page eight.",
  selectedText: "primary result",
  status: "ready"
});
assert.match(activePdfContext, /Currently viewing PDF page 7 of 13/);
assert.match(activePdfContext, /Current page 7 text:\nThe active page establishes the primary result/);
assert.match(activePdfContext, /Previous page 6 context/);
assert.match(activePdfContext, /Next page 8 context/);
assert.ok(activePdfContext.length <= tabletAttachmentTextLimit);
assert.equal(pdfTextItemsToPlainText([
  { str: "Grounded", hasEOL: false },
  { str: "PDF context.", hasEOL: true },
  { str: "Second line", hasEOL: true }
]), "Grounded PDF context.\nSecond line");
const previousPublicAttachmentBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = "https://public-files.example";
assert.equal(
  resolvePdfDocumentUrl("https://public-files.example/post/paper.pdf", "https://www.symposiumsci.com/posts/paper"),
  "https://www.symposiumsci.com/attachment-assets/post/paper.pdf"
);
assert.equal(
  resolvePdfDocumentUrl("https://other-files.example/paper.pdf", "https://www.symposiumsci.com/posts/paper"),
  "https://other-files.example/paper.pdf"
);
if (previousPublicAttachmentBaseUrl === undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
else process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = previousPublicAttachmentBaseUrl;

assert.equal(assistantResponseSchema.safeParse({
  conversationId: "conversation",
  providerConfigured: true,
  status: "answered",
  model: "gpt-5.6-terra",
  quota: { dailyLimit: 3, remainingToday: 2, monthlyBudgetUsd: 40, extremelyLimited: true },
  message: { id: "message", conversationId: "conversation", role: "assistant", body: "Answer" }
}).success, true);

const repository = readFileSync("apps/api/src/repository/assistant.ts", "utf8");
const provider = readFileSync("apps/api/src/services/openaiResponses.ts", "utf8");
const migration = readFileSync("apps/api/src/db/migrate.ts", "utf8");
const route = readFileSync("apps/api/src/routes/workspaceRoutes.ts", "utf8");
const tablet = readFileSync("features/workspace/WorkspacePanels.tsx", "utf8");
const shell = readFileSync("components/SymposiumV0.tsx", "utf8");
const attachmentContext = readFileSync("features/assistant/tabletAttachmentContext.ts", "utf8");
const attachmentViews = readFileSync("features/attachments/AttachmentViews.tsx", "utf8");
const attachmentModal = readFileSync("features/attachments/AttachmentPreviewModal.tsx", "utf8");
const pdfClient = readFileSync("features/attachments/pdfAttachmentClient.ts", "utf8");
const packageManifest = readFileSync("package.json", "utf8");
const nextConfig = readFileSync("next.config.mjs", "utf8");
const env = readFileSync("apps/api/src/config/env.ts", "utf8");

assert.match(provider, /store: false/);
assert.match(provider, /service_tier: "default"/);
assert.match(provider, /max_output_tokens: env\.SYMPOSIUM_AI_MAX_OUTPUT_TOKENS/);
assert.match(provider, /prompt_cache_key: "symposium-contextual-tablet-v1"/);
assert.match(provider, /insufficient_quota/);
assert.match(repository, /providerErrorCode/);
assert.match(repository, /pg_advisory_xact_lock\(hashtextextended\('symposium:ai-budget'/);
assert.match(repository, /current\.userMinute >= 2/);
assert.match(repository, /current\.inFlight >= 1/);
assert.match(repository, /getAssistantQuota/);
assert.match(repository, /SYMPOSIUM_AI_USER_DAILY_LIMIT/);
assert.match(repository, /SYMPOSIUM_AI_GLOBAL_DAILY_LIMIT/);
assert.match(repository, /SYMPOSIUM_AI_DAILY_BUDGET_USD/);
assert.match(repository, /SYMPOSIUM_AI_MONTHLY_BUDGET_USD/);
assert.match(migration, /0037_ai_usage_budget_ledger/);
assert.match(migration, /reserved_cost_micros BIGINT NOT NULL/);
assert.match(route, /shared: true, scope: "assistant", limit: 10/);
assert.match(tablet, /Extremely limited beta/);
assert.match(tablet, /Only Send shares this view with the model and uses an answer/);
assert.match(tablet, /Loading today’s tiny AI allowance/);
assert.match(tablet, /Send · uses 1/);
assert.match(shell, /surface: "messages"/);
assert.match(shell, /surface: "workspace"/);
assert.match(shell, /surface: "attachment"/);
assert.match(shell, /Visible discussion/);
assert.match(shell, /Visible post results/);
assert.match(shell, /Visible feed items/);
assert.match(attachmentContext, /Extracted structured attachment preview/);
assert.match(attachmentContext, /Currently viewing PDF page/);
assert.match(shell, /buildTabletAttachmentContext\(activeAttachment, activePdfView\)/);
assert.match(shell, /selection: activePdfView\?\.selectedText/);
assert.match(shell, /postAttachmentViewContext/);
assert.match(shell, /attachmentPreviewViewContext/);
assert.doesNotMatch(shell, /const \[attachmentViewContext,/);
assert.match(attachmentViews, /new pdfjs\.TextLayer/);
assert.match(attachmentViews, /readPdfPageText\(document, pageNumber\)/);
assert.doesNotMatch(attachmentViews, /<iframe[^>]+title=\{attachment\.fileName\}/);
assert.match(attachmentModal, /kind: "pdf-text", page, excerpt/);
assert.match(pdfClient, /maxPdfMetadataPages = 40/);
assert.match(pdfClient, /pdfTextStatus: previewText \? "extracted" : "none"/);
assert.match(packageManifest, /"pdfjs-dist": "6\.1\.200"/);
assert.match(nextConfig, /source: "\/attachment-assets\/:path\*"/);
assert.match(nextConfig, /destination: `\$\{publicAttachmentBaseUrl\}\/\:path\*`/);
assert.match(env, /SYMPOSIUM_AI_MONTHLY_BUDGET_USD:[\s\S]*max\(40\)\.default\(40\)/);

console.log("AI Tablet cost and context boundary checks passed.");
