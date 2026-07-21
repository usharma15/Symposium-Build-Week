"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Languages, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { createClientMutationId, symposiumApi, SymposiumApiError } from "@/features/api/symposiumApiClient";
import type {
  DocumentTranslationResultContract,
  DocumentTranslationSourcePageContract
} from "@/packages/contracts/src";

export type DocumentTranslationSource = {
  pages: DocumentTranslationSourcePageContract[];
  complete: boolean;
};

type TranslationRequest = {
  attachmentId: string;
  sourceTitle: string;
  sourceKind: "docx" | "pdf";
  pageNumber: number;
  loadSource: () => Promise<DocumentTranslationSource>;
};

export const useDocumentTranslation = ({
  attachmentId,
  sourceTitle,
  sourceKind,
  pageNumber,
  loadSource
}: TranslationRequest) => {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DocumentTranslationResultContract | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const retryRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const pageNumberRef = useRef(pageNumber);
  pageNumberRef.current = pageNumber;

  useEffect(() => {
    setOpen(false);
    setInstruction("");
    setBusy(false);
    setError("");
    setResult(null);
    setShowTranslation(false);
    retryRef.current = null;
  }, [attachmentId]);

  useEffect(() => {
    setOpen(false);
    setError("");
    setShowTranslation(false);
  }, [pageNumber]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const languageInstruction = instruction.trim();
    if (!languageInstruction || busy) return;
    setBusy(true);
    setError("");
    const submittedPageNumber = pageNumber;
    try {
      const source = await loadSource();
      if (!source.pages.length || source.pages.every((page) => !page.body.trim() && !page.imageDataUrl)) {
        throw new Error("This page could not be prepared for translation.");
      }
      const input = {
        attachmentId,
        sourceTitle,
        sourceKind,
        sourcePages: source.pages,
        sourceComplete: source.complete,
        languageInstruction
      };
      const fingerprint = JSON.stringify(input);
      if (retryRef.current?.fingerprint !== fingerprint) {
        retryRef.current = { fingerprint, key: createClientMutationId("document-translation") };
      }
      const response = await symposiumApi.request<DocumentTranslationResultContract>(
        "/api/assistant/document-translations",
        {
          method: "POST",
          idempotencyKey: retryRef.current.key,
          body: input
        }
      );
      retryRef.current = null;
      setResult(response);
      window.dispatchEvent(new CustomEvent("symposium-ai-quota-change", { detail: response.quota }));
      if (response.status === "translated") {
        setShowTranslation(pageNumberRef.current === submittedPageNumber);
        setOpen(false);
      } else {
        setError(response.message);
      }
    } catch (caught) {
      setError(caught instanceof SymposiumApiError || caught instanceof Error
        ? caught.message
        : "The document could not be translated.");
    } finally {
      setBusy(false);
    }
  };

  const translatedOnCurrentPage = result?.status === "translated" &&
    result.pages.some((translatedPage) => translatedPage.pageNumber === pageNumber);

  return {
    open,
    setOpen,
    instruction,
    setInstruction,
    busy,
    error,
    result,
    pageNumber,
    translatedOnCurrentPage,
    showTranslation,
    setShowTranslation,
    submit
  };
};

export type DocumentTranslationState = ReturnType<typeof useDocumentTranslation>;

export function DocumentTranslationControl({ state }: { state: DocumentTranslationState }) {
  const languageInputId = useId();
  return (
    <div className="document-translation-control">
      {state.translatedOnCurrentPage ? (
        <div className="document-translation-view-toggle" aria-label="Document version">
          <button
            type="button"
            className={!state.showTranslation ? "active" : ""}
            aria-pressed={!state.showTranslation}
            onClick={(event) => {
              event.stopPropagation();
              state.setShowTranslation(false);
            }}
          >
            Original
          </button>
          <button
            type="button"
            className={state.showTranslation ? "active" : ""}
            aria-pressed={state.showTranslation}
            onClick={(event) => {
              event.stopPropagation();
              state.setShowTranslation(true);
            }}
          >
            Translation
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="document-translate-button"
        title={`Translate page ${state.pageNumber}`}
        aria-expanded={state.open}
        onClick={(event) => {
          event.stopPropagation();
          state.setOpen(!state.open);
        }}
      >
        <Languages size={14} />
        <span>Translate page</span>
      </button>
      {state.open ? (
        <form
          className="document-translation-popover"
          onSubmit={state.submit}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="document-translation-popover-title">
            <strong>Translate page {state.pageNumber}</strong>
            <button type="button" title="Close translation" onClick={() => state.setOpen(false)}><X size={14} /></button>
          </div>
          <label htmlFor={languageInputId}>Language</label>
          <input
            id={languageInputId}
            autoFocus
            value={state.instruction}
            maxLength={120}
            placeholder="e.g. Spanish"
            disabled={state.busy}
            onChange={(event) => state.setInstruction(event.target.value)}
          />
          <small className="document-translation-limit-warning">
            <TriangleAlert size={14} aria-hidden="true" />
            <span>Due to limited usage restriction this beta translates one page at a time</span>
          </small>
          <small>English, French, German, or Spanish.</small>
          {state.error ? <p role="alert">{state.error}</p> : null}
          <button type="submit" className="document-translation-submit" disabled={!state.instruction.trim() || state.busy}>
            {state.busy ? <LoaderCircle className="spin" size={14} /> : <Languages size={14} />}
            {state.busy ? "Translating…" : "Translate · uses 1"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
