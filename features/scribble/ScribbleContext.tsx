"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from "react";
import Link from "next/link";
import { Check, ChevronDown, FileInput, PenLine, RotateCcw, Trash2, X } from "lucide-react";
import {
  SymposiumDocumentEditor,
  type SymposiumDocumentEditorHandle
} from "@/features/content/SymposiumDocument";
import { createClientMutationId, symposiumApi, SymposiumApiError } from "@/features/api/symposiumApiClient";
import { useCrossTabItemTransport } from "@/features/live-sync/useCrossTabItemTransport";
import { canonicalRouteHref } from "@/features/navigation/canonicalRoute";
import { documentPlainText, emptySymposiumDocument, newDocumentBlockId, type SymposiumDocumentNode } from "@/lib/documentModel";
import type { InquiryAttachment, InquiryComment, InquiryItem, ResearchProfile } from "@/lib/mockData";
import type {
  DocumentCitationLocatorContract,
  DocumentSourceSnapshotContract,
  VersionedDocumentContract
} from "@/packages/contracts/src";
import type { FiledScribble, ScribbleNotebook, ScribbleSnapshot, WorkspaceScribble } from "@/lib/workspaceTypes";

type ScribbleSyncMessage = {
  type: "scribble-change";
  actorHandle: string;
  sourceId: string;
  revision: number;
  changedAt: string;
};

const isScribbleSyncMessage = (value: unknown): value is ScribbleSyncMessage => {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ScribbleSyncMessage>;
  return message.type === "scribble-change"
    && typeof message.actorHandle === "string"
    && typeof message.sourceId === "string"
    && typeof message.revision === "number";
};

type ScribbleContextValue = {
  open: boolean;
  toggle: () => void;
  openPanel: () => void;
  closePanel: () => void;
  addReference: (source: DocumentSourceSnapshotContract) => void;
  addCitation: (source: DocumentSourceSnapshotContract, excerpt: string, locator?: DocumentCitationLocatorContract) => void;
};

const ScribbleContext = createContext<ScribbleContextValue | null>(null);

const defaultValue: ScribbleContextValue = {
  open: false,
  toggle: () => undefined,
  openPanel: () => undefined,
  closePanel: () => undefined,
  addReference: () => undefined,
  addCitation: () => undefined
};

export const useScribble = () => useContext(ScribbleContext) ?? defaultValue;

export const postScribbleSource = (item: InquiryItem): DocumentSourceSnapshotContract => ({
  kind: "post",
  sourceId: item.id,
  sourcePostId: item.id,
  ...(item.revision ? { sourceRevision: item.revision } : {}),
  author: item.author,
  ...(item.authorHandle ? { authorHandle: item.authorHandle } : {}),
  title: item.title,
  body: item.body.slice(0, 4000),
  ...(item.createdAt ? { createdAt: item.createdAt } : {}),
  canonicalPath: canonicalRouteHref({ kind: "post", postId: item.id })
});

export const commentScribbleSource = (comment: InquiryComment, sourcePostId: string): DocumentSourceSnapshotContract => ({
  kind: "comment",
  sourceId: comment.id ?? `${sourcePostId}:comment`,
  sourcePostId,
  ...(comment.id ? { sourceCommentId: comment.id } : {}),
  ...(comment.revision ? { sourceRevision: comment.revision } : {}),
  author: comment.author,
  ...(comment.authorHandle ? { authorHandle: comment.authorHandle } : {}),
  title: `Comment by ${comment.author}`,
  body: comment.body.slice(0, 4000),
  ...(comment.createdAt ? { createdAt: comment.createdAt } : {}),
  canonicalPath: canonicalRouteHref({ kind: "post", postId: sourcePostId, commentId: comment.id })
});

export const attachmentScribbleSource = (
  attachment: InquiryAttachment,
  parent: DocumentSourceSnapshotContract
): DocumentSourceSnapshotContract => ({
  kind: "attachment",
  sourceId: attachment.id,
  sourcePostId: parent.sourcePostId,
  ...(parent.sourceCommentId ? { sourceCommentId: parent.sourceCommentId } : {}),
  ...(parent.sourceRevision ? { sourceRevision: parent.sourceRevision } : {}),
  ...(parent.author ? { author: parent.author } : {}),
  ...(parent.authorHandle ? { authorHandle: parent.authorHandle } : {}),
  title: attachment.fileName,
  body: parent.title ? `Attached to ${parent.title}` : "Referenced attachment",
  ...(parent.createdAt ? { createdAt: parent.createdAt } : {}),
  canonicalPath: `${parent.canonicalPath}${parent.canonicalPath.includes("?") ? "&" : "?"}attachment=${encodeURIComponent(attachment.id)}`,
  attachment: {
    id: attachment.id,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    kind: attachment.kind,
    byteSize: attachment.byteSize
  }
});

const cacheKey = (handle: string) => `symposium-scribble-v1:${handle}`;
const fingerprint = (body: string, document: VersionedDocumentContract) => JSON.stringify([body, document]);
const hasContent = (body: string, document: VersionedDocumentContract) =>
  Boolean(body.trim()) || document.nodes.some((node) => node.type !== "paragraph" || node.content.some((run) => run.text.trim()));

type ScribbleCache = { scribble: WorkspaceScribble; dirty: boolean; baseRevision: number };

const readCache = (handle: string): ScribbleCache | null => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(cacheKey(handle)) ?? "null") as Partial<ScribbleCache & WorkspaceScribble> | null;
    if (parsed?.scribble?.id && parsed.scribble.document?.version === 1) {
      return {
        scribble: parsed.scribble,
        dirty: parsed.dirty === true,
        baseRevision: typeof parsed.baseRevision === "number" ? parsed.baseRevision : parsed.scribble.revision
      };
    }
    if (parsed?.id && parsed.document?.version === 1 && typeof parsed.revision === "number") {
      return { scribble: parsed as WorkspaceScribble, dirty: false, baseRevision: parsed.revision };
    }
    return null;
  } catch {
    return null;
  }
};

const writeCache = (handle: string, scribble: WorkspaceScribble, dirty = false, baseRevision = scribble.revision) => {
  try {
    window.localStorage.setItem(cacheKey(handle), JSON.stringify({ scribble, dirty, baseRevision } satisfies ScribbleCache));
  } catch {
    // The server remains authoritative when browser storage is unavailable or full.
  }
};

export function ScribbleProvider({
  actorHandle,
  profiles,
  children
}: {
  actorHandle: string;
  profiles: Record<string, ResearchProfile>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scribble, setScribble] = useState<WorkspaceScribble | null>(null);
  const [documentValue, setDocumentValue] = useState<VersionedDocumentContract>(() => emptySymposiumDocument());
  const [body, setBody] = useState("");
  const [notebooks, setNotebooks] = useState<ScribbleNotebook[]>([]);
  const [status, setStatus] = useState("Open Scribble to begin");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [destination, setDestination] = useState("");
  const [newNotebookName, setNewNotebookName] = useState("");
  const [busy, setBusy] = useState(false);
  const [undoDiscardRevision, setUndoDiscardRevision] = useState<number | null>(null);
  const [filed, setFiled] = useState<FiledScribble | null>(null);
  const [pendingNodes, setPendingNodes] = useState<SymposiumDocumentNode[]>([]);
  const editorHandleRef = useRef<SymposiumDocumentEditorHandle>(null);
  const sourceIdRef = useRef(createClientMutationId("scribble-tab"));
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef<Promise<boolean> | null>(null);
  const currentRef = useRef({ body, document: documentValue });
  const serverRevisionRef = useRef(0);
  currentRef.current = { body, document: documentValue };

  const applyServerScribble = useCallback((next: WorkspaceScribble, options: { preserveLocal?: boolean } = {}) => {
    serverRevisionRef.current = next.revision;
    setScribble(next);
    if (!options.preserveLocal) {
      dirtyRef.current = false;
      setBody(next.body);
      setDocumentValue(next.document);
      currentRef.current = { body: next.body, document: next.document };
    }
    writeCache(
      actorHandle,
      options.preserveLocal ? { ...next, ...currentRef.current } : next,
      options.preserveLocal && dirtyRef.current,
      next.revision
    );
  }, [actorHandle]);

  const refresh = useCallback(async (force = false) => {
    if (dirtyRef.current && !force) {
      setConflict(true);
      setStatus("A newer Scribble exists elsewhere");
      return;
    }
    const snapshot = await symposiumApi.request<ScribbleSnapshot>(
      `/api/workspace/scribble?actorHandle=${encodeURIComponent(actorHandle)}`,
      { cache: "no-store" }
    );
    applyServerScribble(snapshot.scribble);
    setNotebooks(snapshot.notebooks);
    setLoaded(true);
    setConflict(false);
    setError(null);
    setStatus("Scribble current");
  }, [actorHandle, applyServerScribble]);

  const ensureLoaded = useCallback(() => {
    if (loaded) return Promise.resolve();
    if (loadingPromiseRef.current) return loadingPromiseRef.current;
    setLoading(true);
    const cached = readCache(actorHandle);
    if (cached) {
      serverRevisionRef.current = cached.baseRevision;
      setScribble(cached.scribble);
      setBody(cached.scribble.body);
      setDocumentValue(cached.scribble.document);
      currentRef.current = { body: cached.scribble.body, document: cached.scribble.document };
      dirtyRef.current = cached.dirty;
      setStatus("Checking Scribble…");
    }
    const operation = symposiumApi.request<ScribbleSnapshot>(
      `/api/workspace/scribble?actorHandle=${encodeURIComponent(actorHandle)}`,
      { cache: "no-store" }
    )
      .then((snapshot) => {
        setNotebooks(snapshot.notebooks);
        setLoaded(true);
        setError(null);
        if (!cached?.dirty || fingerprint(cached.scribble.body, cached.scribble.document) === fingerprint(snapshot.scribble.body, snapshot.scribble.document)) {
          applyServerScribble(snapshot.scribble);
          setConflict(false);
          setStatus("Scribble current");
          return;
        }
        dirtyRef.current = true;
        applyServerScribble(snapshot.scribble, { preserveLocal: true });
        if (snapshot.scribble.revision === cached.baseRevision) {
          setConflict(false);
          setStatus("Recovering unsaved Scribble…");
        } else {
          setConflict(true);
          setStatus("A newer Scribble exists elsewhere");
        }
      })
      .catch((caught) => {
        if (!cached) setError(caught instanceof Error ? caught.message : "Scribble could not be opened.");
        setStatus(cached ? cached.dirty ? "Offline copy open · unsaved changes retained" : "Offline copy open" : "Scribble unavailable");
        if (cached) setLoaded(true);
      })
      .finally(() => {
        setLoading(false);
        loadingPromiseRef.current = null;
      });
    loadingPromiseRef.current = operation;
    return operation;
  }, [actorHandle, applyServerScribble, loaded]);

  const publishSync = useCrossTabItemTransport<ScribbleSyncMessage>({
    channelName: "symposium-scribble-sync-v1",
    storageKey: "symposium-cross-tab-scribble",
    isMessage: isScribbleSyncMessage,
    onMessage: (message) => {
      if (message.actorHandle !== actorHandle || message.sourceId === sourceIdRef.current) return;
      if (message.revision <= serverRevisionRef.current) return;
      void refresh().catch(() => undefined);
    }
  });

  const announce = useCallback((revision: number) => publishSync({
    type: "scribble-change",
    actorHandle,
    sourceId: sourceIdRef.current,
    revision,
    changedAt: new Date().toISOString()
  }), [actorHandle, publishSync]);

  const saveNow = useCallback(async () => {
    if (!scribble || !dirtyRef.current || conflict) return !conflict;
    if (savingRef.current) return savingRef.current;
    const operation = (async () => {
      let successful = true;
      for (let attempt = 0; attempt < 4 && dirtyRef.current; attempt += 1) {
        const candidate = currentRef.current;
        const candidateFingerprint = fingerprint(candidate.body, candidate.document);
        dirtyRef.current = false;
        setStatus("Autosaving…");
        try {
          const result = await symposiumApi.request<{ scribble: WorkspaceScribble }>("/api/workspace/scribble", {
            method: "PATCH",
            idempotencyKey: createClientMutationId("scribble-autosave"),
            body: {
              actorHandle,
              body: candidate.body,
              document: candidate.document,
              expectedRevision: serverRevisionRef.current
            }
          });
          const changedDuringSave = fingerprint(currentRef.current.body, currentRef.current.document) !== candidateFingerprint;
          if (changedDuringSave) dirtyRef.current = true;
          applyServerScribble(result.scribble, { preserveLocal: changedDuringSave });
          announce(result.scribble.revision);
          setError(null);
          setStatus(changedDuringSave ? "Saving latest changes…" : "Saved everywhere");
        } catch (caught) {
          dirtyRef.current = true;
          successful = false;
          const message = caught instanceof Error ? caught.message : "Scribble could not be saved.";
          setError(message);
          if (caught instanceof SymposiumApiError && caught.status === 409) {
            setConflict(true);
            setStatus("Changed on another device");
          } else setStatus("Save needs attention");
          break;
        }
      }
      return successful;
    })();
    savingRef.current = operation;
    try {
      return await operation;
    } finally {
      if (savingRef.current === operation) savingRef.current = null;
    }
  }, [actorHandle, announce, applyServerScribble, conflict, scribble]);

  useEffect(() => {
    if (!dirtyRef.current || conflict) return;
    const timer = window.setTimeout(() => void saveNow(), 900);
    return () => window.clearTimeout(timer);
  }, [body, conflict, documentValue, saveNow]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void saveNow();
    };
    const handleLiveChange = (event: Event) => {
      const revision = Number((event as CustomEvent<{ revision?: number }>).detail?.revision ?? 0);
      if (revision && revision <= serverRevisionRef.current) return;
      void refresh().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("symposium-scribble-change", handleLiveChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("symposium-scribble-change", handleLiveChange);
    };
  }, [refresh, saveNow]);

  useEffect(() => {
    if (!editorHandleRef.current || !pendingNodes.length) return;
    const [next, ...rest] = pendingNodes;
    if (!next) return;
    const timer = window.setTimeout(() => {
      if (!editorHandleRef.current?.insertNode(next)) return;
      setPendingNodes((current) => current[0]?.id === next.id ? rest : current);
      setStatus(next.type === "citation" ? "Citation added" : "Source added");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loaded, open, pendingNodes]);

  const queueNode = useCallback((node: SymposiumDocumentNode) => {
    setOpen(true);
    setPendingNodes((current) => [...current, node]);
    void ensureLoaded();
  }, [ensureLoaded]);

  const addReference = useCallback((source: DocumentSourceSnapshotContract) => queueNode({
    id: newDocumentBlockId("reference"),
    type: "reference",
    resource: {
      type: source.kind === "attachment" ? "attachment" : source.kind,
      id: source.sourceId,
      label: source.title ?? source.author ?? "Source"
    },
    source
  }), [queueNode]);

  const addCitation = useCallback((source: DocumentSourceSnapshotContract, excerpt: string, locator?: DocumentCitationLocatorContract) => {
    const cleanExcerpt = excerpt.trim().slice(0, 4000);
    if (!cleanExcerpt) return;
    queueNode({
      id: newDocumentBlockId("citation"),
      type: "citation",
      label: cleanExcerpt,
      excerpt: cleanExcerpt,
      source,
      locator: locator ?? { kind: "text" }
    });
  }, [queueNode]);

  const updateContent = (next: VersionedDocumentContract, plainText: string) => {
    if (fingerprint(plainText, next) === fingerprint(currentRef.current.body, currentRef.current.document)) return;
    const nextScribble = scribble ? { ...scribble, body: plainText, document: next, updatedAt: new Date().toISOString() } : null;
    setDocumentValue(next);
    setBody(plainText);
    currentRef.current = { body: plainText, document: next };
    dirtyRef.current = true;
    setFiled(null);
    setUndoDiscardRevision(null);
    setStatus("Saving…");
    if (nextScribble) writeCache(actorHandle, nextScribble, true, serverRevisionRef.current);
  };

  const keepLocalAfterConflict = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const snapshot = await symposiumApi.request<ScribbleSnapshot>(
        `/api/workspace/scribble?actorHandle=${encodeURIComponent(actorHandle)}`,
        { cache: "no-store" }
      );
      dirtyRef.current = true;
      applyServerScribble(snapshot.scribble, { preserveLocal: true });
      setNotebooks(snapshot.notebooks);
      setConflict(false);
      setError(null);
      setStatus("Saving this copy over the newer revision…");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The newer Scribble could not be checked.");
    } finally {
      setBusy(false);
    }
  };

  const createNotebook = async () => {
    const name = newNotebookName.trim();
    if (!name) return null;
    const result = await symposiumApi.request<{ notebook: ScribbleNotebook }>("/api/workspace/notebooks", {
      method: "POST",
      idempotencyKey: createClientMutationId("scribble-notebook-create"),
      body: { actorHandle, name }
    });
    setNotebooks((current) => [result.notebook, ...current]);
    setNewNotebookName("");
    window.dispatchEvent(new Event("symposium-workspace-change"));
    return result.notebook.id;
  };

  const fileCurrent = async () => {
    if (!scribble || busy || conflict || !hasContent(body, documentValue)) return;
    setBusy(true);
    setError(null);
    try {
      if (!(await saveNow())) return;
      let notebookId: string | null = destination || null;
      if (destination === "new") notebookId = await createNotebook();
      if (destination === "new" && !notebookId) return;
      const result = await symposiumApi.request<{ scribble: WorkspaceScribble; filed: FiledScribble }>("/api/workspace/scribble/file", {
        method: "POST",
        idempotencyKey: createClientMutationId("scribble-file"),
        body: { actorHandle, expectedRevision: serverRevisionRef.current, notebookId }
      });
      applyServerScribble(result.scribble);
      announce(result.scribble.revision);
      setFiled(result.filed);
      setDestination("");
      setStatus("Filed as a Quick Note");
      window.dispatchEvent(new Event("symposium-workspace-change"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Scribble could not be filed.");
      setStatus("Filing needs attention");
    } finally {
      setBusy(false);
    }
  };

  const discardCurrent = async () => {
    if (!scribble || busy || !hasContent(body, documentValue)) return;
    if (!window.confirm("Discard this Scribble and start fresh? You can undo immediately afterwards.")) return;
    setBusy(true);
    try {
      if (!(await saveNow())) return;
      const result = await symposiumApi.request<{ scribble: WorkspaceScribble; discardedRevision: number }>("/api/workspace/scribble/discard", {
        method: "POST",
        idempotencyKey: createClientMutationId("scribble-discard"),
        body: { actorHandle, expectedRevision: serverRevisionRef.current }
      });
      applyServerScribble(result.scribble);
      announce(result.scribble.revision);
      setUndoDiscardRevision(result.discardedRevision);
      setStatus("Scribble discarded");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Scribble could not be discarded.");
    } finally {
      setBusy(false);
    }
  };

  const restoreDiscard = async () => {
    if (!scribble || !undoDiscardRevision || busy) return;
    setBusy(true);
    try {
      const result = await symposiumApi.request<{ scribble: WorkspaceScribble }>("/api/workspace/scribble/restore", {
        method: "POST",
        idempotencyKey: createClientMutationId("scribble-restore"),
        body: { actorHandle, expectedRevision: serverRevisionRef.current, discardedRevision: undoDiscardRevision }
      });
      applyServerScribble(result.scribble);
      announce(result.scribble.revision);
      setUndoDiscardRevision(null);
      setStatus("Scribble restored");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Scribble could not be restored.");
    } finally {
      setBusy(false);
    }
  };

  const sources = useMemo(() => documentValue.nodes
    .filter((node): node is Extract<SymposiumDocumentNode, { type: "reference" | "citation" }> => node.type === "reference" || node.type === "citation")
    .flatMap((node) => node.source ? [node.source] : [])
    .filter((source, index, all) => all.findIndex((candidate) => candidate.kind === source.kind && candidate.sourceId === source.sourceId) === index), [documentValue]);

  const value = useMemo<ScribbleContextValue>(() => ({
    open,
    toggle: () => {
      setOpen((current) => {
        const next = !current;
        if (next) void ensureLoaded();
        else void saveNow();
        return next;
      });
    },
    openPanel: () => { setOpen(true); void ensureLoaded(); },
    closePanel: () => { setOpen(false); void saveNow(); },
    addReference,
    addCitation
  }), [addCitation, addReference, ensureLoaded, open, saveNow]);

  return (
    <ScribbleContext.Provider value={value}>
      {children}
      {open ? (
        <aside className="scribble-panel" aria-label="Scribble">
          <header className="scribble-header">
            <div><span>Scribble</span><small>{status}</small></div>
            <div>
              <button type="button" title="Discard Scribble" disabled={busy || !hasContent(body, documentValue)} onClick={() => void discardCurrent()}><Trash2 size={16} /></button>
              <button type="button" title="Close Scribble" onClick={() => { setOpen(false); void saveNow(); }}><X size={17} /></button>
            </div>
          </header>
          {sources.length ? <div className="scribble-source-shelf" aria-label="Scribble sources">{sources.slice(-4).map((source) => <Link key={`${source.kind}:${source.sourceId}`} href={source.canonicalPath}><small>{source.kind}</small><strong>{source.title ?? source.author ?? "Source"}</strong></Link>)}</div> : null}
          <div className="scribble-editor-scroll">
            {loading && !loaded ? <div className="scribble-loading">Opening your Scribble…</div> : null}
            {loaded && scribble ? (
              <SymposiumDocumentEditor
                ref={editorHandleRef}
                value={documentValue}
                capability="scribble"
                attachments={[]}
                profiles={profiles}
                disabled={busy}
                placeholder="Scribble anything…"
                onChange={updateContent}
                onAttachmentsChange={() => undefined}
                onUploadAttachment={async () => { throw new Error("Scribbles do not accept file uploads in this pass."); }}
              />
            ) : null}
          </div>
          {conflict ? <div className="scribble-conflict" role="alert"><span>Your local words are preserved. Another device saved a newer revision.</span><div><button type="button" disabled={busy} onClick={() => void refresh(true)}>Use newer</button><button type="button" disabled={busy} onClick={() => void keepLocalAfterConflict()}>Keep this copy</button></div></div> : null}
          {error ? <div className="scribble-error" role="alert">{error}</div> : null}
          {undoDiscardRevision ? <div className="scribble-recovery"><span>Scribble discarded.</span><button type="button" disabled={busy} onClick={() => void restoreDiscard()}><RotateCcw size={15} />Undo discard</button></div> : null}
          {filed ? <div className="scribble-filed"><Check size={15} /><span>Filed as “{filed.title}”{filed.notebookName ? ` in ${filed.notebookName}` : " in All"}.</span></div> : null}
          <footer className="scribble-footer">
            <div className="scribble-file-destination">
              <FileInput size={16} />
              <select aria-label="File Scribble in" value={destination} onChange={(event) => setDestination(event.target.value)}>
                <option value="">All · Quick Notes</option>
                {notebooks.map((notebook) => <option key={notebook.id} value={notebook.id}>{notebook.name}{notebook.collaboratorCount ? ` · shared with ${notebook.collaboratorCount}` : ""}</option>)}
                <option value="new">New notebook…</option>
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
            {destination === "new" ? <input value={newNotebookName} maxLength={120} onChange={(event) => setNewNotebookName(event.target.value)} placeholder="Notebook name" aria-label="New notebook name" /> : null}
            <button type="button" className="primary" disabled={busy || conflict || !hasContent(body, documentValue) || (destination === "new" && !newNotebookName.trim())} onClick={() => void fileCurrent()}>{busy ? "Working…" : "File Scribble"}</button>
          </footer>
        </aside>
      ) : null}
    </ScribbleContext.Provider>
  );
}

export function ScribbleLauncher() {
  const scribble = useScribble();
  return (
    <button
      className={`pocket pocket-left bottom-action bottom-action-notebook scribble-launcher${scribble.open ? " active" : ""}`}
      type="button"
      title={scribble.open ? "Close Scribble" : "Open Scribble"}
      aria-expanded={scribble.open}
      onClick={scribble.toggle}
    >
      <PenLine size={18} />
      <span>Scribble</span>
    </button>
  );
}

export function ScribbleActionButton({
  source,
  disabled = false,
  label = "source"
}: {
  source: DocumentSourceSnapshotContract;
  disabled?: boolean;
  label?: string;
}) {
  const scribble = useScribble();
  return (
    <button
      type="button"
      className="scribble-source-action"
      title={`Add ${label} to Scribble`}
      aria-label={`Add ${label} to Scribble`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        scribble.addReference(source);
      }}
    >
      <PenLine size={15} />
    </button>
  );
}

const textOffsetWithin = (element: Element, node: Node, offset: number) => {
  try {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.setEnd(node, offset);
    return range.toString().length;
  } catch {
    return undefined;
  }
};

export function ScribbleCitable({
  source,
  children,
  className = ""
}: {
  source: DocumentSourceSnapshotContract;
  children: ReactNode;
  className?: string;
}) {
  const scribble = useScribble();
  const rootRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{
    excerpt: string;
    left: number;
    top: number;
    locator: DocumentCitationLocatorContract;
  } | null>(null);

  const inspectSelection = () => {
    const selected = window.getSelection();
    const range = selected?.rangeCount ? selected.getRangeAt(0) : null;
    const root = rootRef.current;
    if (!selected || !range || !root || selected.isCollapsed || !root.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    const excerpt = selected.toString().replace(/\s+/g, " ").trim().slice(0, 4000);
    if (!excerpt) {
      setSelection(null);
      return;
    }
    const bounds = range.getBoundingClientRect();
    const startElement = (range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement)?.closest("[data-document-block-id]");
    const endElement = (range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer as Element : range.endContainer.parentElement)?.closest("[data-document-block-id]");
    setSelection({
      excerpt,
      left: Math.max(12, Math.min(window.innerWidth - 150, bounds.left + bounds.width / 2 - 70)),
      top: Math.max(82, bounds.top - 46),
      locator: {
        kind: "text",
        ...(startElement?.getAttribute("data-document-block-id") ? { startBlockId: startElement.getAttribute("data-document-block-id")! } : {}),
        ...(endElement?.getAttribute("data-document-block-id") ? { endBlockId: endElement.getAttribute("data-document-block-id")! } : {}),
        ...(startElement ? { startOffset: textOffsetWithin(startElement, range.startContainer, range.startOffset) } : {}),
        ...(endElement ? { endOffset: textOffsetWithin(endElement, range.endContainer, range.endOffset) } : {})
      }
    });
  };

  const cite = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selection) return;
    scribble.addCitation(source, selection.excerpt, selection.locator);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  return (
    <div ref={rootRef} className={`scribble-citable ${className}`} onMouseUp={inspectSelection} onKeyUp={inspectSelection}>
      {children}
      {selection ? (
        <button
          type="button"
          className="scribble-selection-action"
          style={{ left: selection.left, top: selection.top }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={cite}
        >
          <PenLine size={14} />Cite in Scribble
        </button>
      ) : null}
    </div>
  );
}
