"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Heading1,
  Heading2,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Minus,
  Paperclip,
  Pilcrow,
  Plus,
  Sigma,
  Trash2,
  Underline
} from "lucide-react";
import katex from "katex";
import type { InquiryAttachment, InquiryItem, ResearchProfile } from "@/lib/mockData";
import type { VersionedDocumentContract } from "@/packages/contracts/src";
import {
  documentForContent,
  documentPlainText,
  emptySymposiumDocument,
  newDocumentBlockId,
  normalizeDocumentAttachments,
  type EditorCapability,
  type SymposiumDocument,
  type SymposiumDocumentNode,
  type SymposiumTextRun
} from "@/lib/documentModel";
import { cleanHandle } from "@/lib/symposiumCore";
import {
  AttachmentCarousel,
  AttachmentComposerField,
  AttachmentPreviewModal,
  type AttachmentUploadHandler
} from "@/features/attachments/AttachmentViews";

type TextNode = Extract<SymposiumDocumentNode, { type: "paragraph" | "heading" | "quote" }>;
type TextMark = NonNullable<SymposiumTextRun["marks"]>[number];

const mergeRuns = (runs: SymposiumTextRun[]) => runs.reduce<SymposiumTextRun[]>((merged, run) => {
  if (!run.text) return merged;
  const previous = merged.at(-1);
  if (previous && JSON.stringify({ ...previous, text: "" }) === JSON.stringify({ ...run, text: "" })) {
    previous.text += run.text;
    return merged;
  }
  merged.push({ ...run, marks: run.marks?.length ? [...new Set(run.marks)] : undefined });
  return merged;
}, []);

const runStyle = (run: SymposiumTextRun): CSSProperties => ({
  ...(run.font ? { fontFamily: `var(--document-font-${run.font})` } : {}),
  ...(run.size ? { fontSize: `var(--document-size-${run.size})` } : {}),
  ...(run.color ? { color: `var(--document-color-${run.color})` } : {})
});

const runClassName = (run: SymposiumTextRun) =>
  [
    run.marks?.includes("bold") ? "document-mark-bold" : "",
    run.marks?.includes("italic") ? "document-mark-italic" : "",
    run.marks?.includes("underline") ? "document-mark-underline" : "",
    run.marks?.includes("code") ? "document-mark-code" : "",
    run.marks?.includes("strikethrough") ? "document-mark-strike" : ""
  ].filter(Boolean).join(" ");

const profileForMention = (profiles: Record<string, ResearchProfile>, rawHandle: string) => {
  const handle = cleanHandle(rawHandle);
  return profiles[handle] ?? Object.values(profiles).find((profile) => cleanHandle(profile.handle) === handle);
};

function MentionAwareText({ run, profiles }: { run: SymposiumTextRun; profiles: Record<string, ResearchProfile> }) {
  const pieces = run.mentionHandle ? [run.text] : run.text.split(/(@[a-zA-Z0-9_]{2,79})/g);
  return pieces.map((piece, index) => {
    const mention = piece.startsWith("@") ? profileForMention(profiles, run.mentionHandle ?? piece) : undefined;
    const content = mention ? (
      <a href={`/profiles/${encodeURIComponent(cleanHandle(mention.handle))}`} onClick={(event) => event.stopPropagation()}>
        {piece}
      </a>
    ) : run.link ? (
      <a href={run.link} target="_blank" rel="noopener noreferrer nofollow" onClick={(event) => event.stopPropagation()}>
        {piece}
      </a>
    ) : piece;
    return <span key={`${piece}-${index}`} className={runClassName(run)} style={runStyle(run)}>{content}</span>;
  });
}

function TextRuns({ content, profiles }: { content: SymposiumTextRun[]; profiles: Record<string, ResearchProfile> }) {
  return <>{content.map((run, index) => <MentionAwareText key={`${run.text}-${index}`} run={run} profiles={profiles} />)}</>;
}

function Equation({ source, display }: { source: string; display: boolean }) {
  const html = useMemo(() => katex.renderToString(source, {
    displayMode: display,
    throwOnError: false,
    strict: "warn",
    trust: false,
    output: "htmlAndMathml"
  }), [display, source]);
  return <div className={`document-equation ${display ? "display" : "inline"}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

const textNodeLength = (node: SymposiumDocumentNode) => {
  if (node.type === "paragraph" || node.type === "heading" || node.type === "quote") {
    return node.content.reduce((total, run) => total + run.text.length, 0);
  }
  if (node.type === "list") return node.items.flat().reduce((total, run) => total + run.text.length, 0);
  if (node.type === "code") return node.code.length;
  return 0;
};

const sliceRuns = (runs: SymposiumTextRun[], limit: number) => {
  let remaining = limit;
  return runs.flatMap((run) => {
    if (remaining <= 0) return [];
    const text = run.text.slice(0, remaining);
    remaining -= text.length;
    return text ? [{ ...run, text }] : [];
  });
};

export function SymposiumDocumentRenderer({
  document,
  body,
  attachments,
  profiles,
  mode = "detail",
  onOpenAttachment,
  onExpand
}: {
  document?: VersionedDocumentContract;
  body: string;
  attachments?: InquiryAttachment[];
  profiles: Record<string, ResearchProfile>;
  mode?: "feed" | "detail" | "comment" | "editor";
  onOpenAttachment?: (attachmentId: string) => void;
  onExpand?: () => void;
}) {
  const resolved = documentForContent(document, body);
  const attachmentById = new Map((attachments ?? []).map((attachment) => [attachment.id, attachment]));
  const compact = mode === "feed";
  const collapsedLength = 500;
  const totalTextLength = resolved.nodes.reduce((total, node) => total + textNodeLength(node), 0);
  const [expanded, setExpanded] = useState(false);
  let remaining = compact && !expanded ? collapsedLength : Number.POSITIVE_INFINITY;

  useEffect(() => setExpanded(false), [document, body]);

  return (
    <div className={`symposium-document symposium-document-${mode} document-width-${resolved.settings?.width ?? "standard"} document-margin-${resolved.settings?.margin ?? "normal"}`}>
      {resolved.nodes.map((node) => {
        if (remaining <= 0 && node.type !== "attachment") return null;
        if (node.type === "attachment") {
          if (compact) return null;
          const attachment = attachmentById.get(node.attachmentId);
          if (!attachment) return null;
          return (
            <figure key={node.id} className="document-attachment-block">
              <AttachmentCarousel
                attachments={[attachment]}
                label="Inline attachment"
                variant={mode === "comment" ? "comment" : "detail"}
                onOpenPreview={() => onOpenAttachment?.(attachment.id)}
              />
              {node.caption ? <figcaption>{node.caption}</figcaption> : null}
            </figure>
          );
        }
        if (node.type === "equation") return <Equation key={node.id} source={node.source} display={node.display} />;
        if (node.type === "code") {
          const code = node.code.slice(0, remaining);
          remaining -= code.length;
          return <pre key={node.id} className="document-code"><code>{code}</code></pre>;
        }
        if (node.type === "list") {
          const Tag = node.style === "decimal" || node.style.includes("alpha") ? "ol" : "ul";
          const items = node.items.map((item) => {
            const visible = sliceRuns(item, remaining);
            remaining -= visible.reduce((total, run) => total + run.text.length, 0);
            return visible;
          }).filter((item) => item.length);
          return <Tag key={node.id} className={`document-list document-list-${node.style}`} style={{ marginLeft: `${node.depth * 1.25}rem` }}>{items.map((item, index) => <li key={index}><TextRuns content={item} profiles={profiles} /></li>)}</Tag>;
        }
        if (node.type === "reference") return <a key={node.id} className="document-reference" href={`/${node.resource.type}s/${encodeURIComponent(node.resource.id)}`}>{node.resource.label ?? node.resource.id}</a>;
        if (node.type === "citation") return node.href ? <a key={node.id} className="document-citation" href={node.href} target="_blank" rel="noopener noreferrer nofollow">{node.label}</a> : <span key={node.id} className="document-citation">{node.label}</span>;

        const visible = sliceRuns(node.content, remaining);
        remaining -= visible.reduce((total, run) => total + run.text.length, 0);
        if (!visible.length) return null;
        const className = `document-text-block document-align-${node.type === "quote" ? "left" : node.align}${node.type === "paragraph" ? ` document-indent-${node.indent}` : ""}`;
        if (node.type === "heading") {
          const Heading = `h${Math.min(4, Math.max(1, node.level))}` as "h1" | "h2" | "h3" | "h4";
          return <Heading key={node.id} className={className}><TextRuns content={visible} profiles={profiles} /></Heading>;
        }
        if (node.type === "quote") return <blockquote key={node.id} className={className}><TextRuns content={visible} profiles={profiles} /></blockquote>;
        return <p key={node.id} className={className}><TextRuns content={visible} profiles={profiles} /></p>;
      })}
      {compact && totalTextLength > collapsedLength ? (
        <button
          type="button"
          className="inline-expand-button document-expand-button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
            if (!expanded) onExpand?.();
          }}
        >
          {expanded ? "show less" : "show more"}
        </button>
      ) : null}
    </div>
  );
}

type ParseState = Pick<SymposiumTextRun, "marks" | "font" | "size" | "color" | "link">;

const parseEditableRuns = (root: HTMLElement): SymposiumTextRun[] => {
  const runs: SymposiumTextRun[] = [];
  const visit = (node: Node, state: ParseState) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) runs.push({ text, ...state });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      runs.push({ text: "\n", ...state });
      return;
    }
    const marks = new Set<TextMark>(state.marks ?? []);
    if (["B", "STRONG"].includes(node.tagName) || node.style.fontWeight === "bold" || Number(node.style.fontWeight) >= 600) marks.add("bold");
    if (["I", "EM"].includes(node.tagName) || node.style.fontStyle === "italic") marks.add("italic");
    if (node.tagName === "U" || node.style.textDecoration.includes("underline")) marks.add("underline");
    const face = node.dataset.documentFont ?? node.getAttribute("face") ?? node.style.fontFamily;
    const font = ["system", "serif", "humanist", "mono"].includes(face) ? face as SymposiumTextRun["font"] : /mono/i.test(face) ? "mono" : /serif/i.test(face) ? "serif" : /Arial|humanist/i.test(face) ? "humanist" : state.font;
    const rawSize = node.dataset.documentSize ?? node.getAttribute("size") ?? node.style.fontSize;
    const size = ["small", "normal", "large", "lead"].includes(rawSize) ? rawSize as SymposiumTextRun["size"] : rawSize === "5" || /1\.25|20px/.test(rawSize) ? "lead" : rawSize === "4" || /1\.1|18px/.test(rawSize) ? "large" : rawSize === "2" || /0\.8|13px/.test(rawSize) ? "small" : state.size;
    const rawColor = (node.dataset.documentColor ?? node.getAttribute("color") ?? node.style.color).toLowerCase();
    const color = ["default", "muted", "blue", "crimson", "forest", "gold"].includes(rawColor) ? rawColor as SymposiumTextRun["color"] : rawColor.includes("173f5f") || rawColor.includes("23, 63, 95") ? "blue" : rawColor.includes("8d2f3c") || rawColor.includes("141, 47, 60") ? "crimson" : rawColor.includes("285943") || rawColor.includes("40, 89, 67") ? "forest" : rawColor.includes("9a6b16") || rawColor.includes("154, 107, 22") ? "gold" : state.color;
    const link = node instanceof HTMLAnchorElement && /^https?:\/\//.test(node.href) ? node.href : state.link;
    const next = { marks: [...marks], font, size, color, link } satisfies ParseState;
    node.childNodes.forEach((child) => visit(child, next));
  };
  root.childNodes.forEach((child) => visit(child, {}));
  return mergeRuns(runs);
};

const editableHtml = (runs: SymposiumTextRun[]) => runs.map((run) => {
  let text = run.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  if (run.marks?.includes("bold")) text = `<strong>${text}</strong>`;
  if (run.marks?.includes("italic")) text = `<em>${text}</em>`;
  if (run.marks?.includes("underline")) text = `<u>${text}</u>`;
  const style = [
    run.font ? `font-family:var(--document-font-${run.font})` : "",
    run.size ? `font-size:var(--document-size-${run.size})` : "",
    run.color ? `color:var(--document-color-${run.color})` : ""
  ].filter(Boolean).join(";");
  const data = [
    run.font ? `data-document-font="${run.font}"` : "",
    run.size ? `data-document-size="${run.size}"` : "",
    run.color ? `data-document-color="${run.color}"` : ""
  ].filter(Boolean).join(" ");
  if (style || data) text = `<span ${data} style="${style}">${text}</span>`;
  if (run.link) text = `<a href="${run.link.replace(/"/g, "&quot;")}">${text}</a>`;
  return text;
}).join("");

function EditableTextBlock({ node, active, placeholder, onActivate, onChange, onEnter, onRemove }: {
  node: TextNode;
  active: boolean;
  placeholder: string;
  onActivate: (element: HTMLElement) => void;
  onChange: (content: SymposiumTextRun[]) => void;
  onEnter: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || document.activeElement === element) return;
    const html = editableHtml(node.content);
    if (element.innerHTML !== html) element.innerHTML = html;
  }, [node.content]);
  return (
    <div
      ref={ref}
      className={`document-editable-text ${active ? "active" : ""} document-editable-${node.type}`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      role="textbox"
      aria-multiline="true"
      onFocus={(event) => onActivate(event.currentTarget)}
      onMouseUp={(event) => onActivate(event.currentTarget)}
      onKeyUp={(event) => onActivate(event.currentTarget)}
      onInput={(event) => onChange(parseEditableRuns(event.currentTarget))}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onChange(parseEditableRuns(event.currentTarget));
          onEnter();
        }
        if (event.key === "Backspace" && !event.currentTarget.textContent) {
          event.preventDefault();
          onRemove();
        }
      }}
    />
  );
}

const equationSymbols = [
  ["α", "\\alpha"], ["β", "\\beta"], ["γ", "\\gamma"], ["Δ", "\\Delta"],
  ["π", "\\pi"], ["Σ", "\\sum_{}^{}"], ["∫", "\\int_{}^{}"], ["√", "\\sqrt{}"],
  ["xⁿ", "^{}"], ["xₙ", "_{}"], ["a⁄b", "\\frac{}{}"], ["∞", "\\infty"],
  ["≤", "\\le"], ["≥", "\\ge"], ["≈", "\\approx"], ["→", "\\to"]
] as const;

function EquationEditor({ node, onChange }: {
  node: Extract<SymposiumDocumentNode, { type: "equation" }>;
  onChange: (node: Extract<SymposiumDocumentNode, { type: "equation" }>) => void;
}) {
  return (
    <div className="document-equation-editor">
      <Equation source={node.source || "x"} display={node.display} />
      <input value={node.source} onChange={(event) => onChange({ ...node, source: event.target.value || "x" })} aria-label="Equation source" />
      <div className="document-equation-symbols" aria-label="Equation symbols">
        {equationSymbols.map(([label, source]) => <button key={label} type="button" title={`Insert ${label}`} onClick={() => onChange({ ...node, source: `${node.source}${source}` })}>{label}</button>)}
      </div>
      <label><input type="checkbox" checked={node.display} onChange={(event) => onChange({ ...node, display: event.target.checked })} /> Display equation</label>
    </div>
  );
}

export function SymposiumDocumentEditor({
  value,
  bodyFallback = "",
  capability,
  attachments,
  profiles,
  disabled = false,
  placeholder,
  onChange,
  onAttachmentsChange,
  onBusyChange,
  onUploadAttachment
}: {
  value?: SymposiumDocument;
  bodyFallback?: string;
  capability: EditorCapability;
  attachments: InquiryAttachment[];
  profiles: Record<string, ResearchProfile>;
  disabled?: boolean;
  placeholder: string;
  onChange: (document: SymposiumDocument, plainText: string) => void;
  onAttachmentsChange: (attachments: InquiryAttachment[]) => void;
  onBusyChange?: (busy: boolean) => void;
  onUploadAttachment: AttachmentUploadHandler;
}) {
  const documentValue = useMemo(() => normalizeDocumentAttachments(value ?? (bodyFallback ? documentForContent(undefined, bodyFallback) : emptySymposiumDocument()), attachments), [value, bodyFallback, attachments]);
  const [activeId, setActiveId] = useState(documentValue.nodes[0]?.id ?? "");
  const activeEditor = useRef<HTMLElement | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const inlineIds = new Set(documentValue.nodes.filter((node) => node.type === "attachment").map((node) => node.attachmentId));
  const appendedAttachments = attachments.filter((attachment) => !inlineIds.has(attachment.id));

  const emit = (next: SymposiumDocument, nextAttachments = attachments) => {
    const normalized = normalizeDocumentAttachments(next, nextAttachments);
    onChange(normalized, documentPlainText(normalized));
  };
  const replaceNode = (id: string, replacement: SymposiumDocumentNode) => emit({ ...documentValue, nodes: documentValue.nodes.map((node) => node.id === id ? replacement : node) });
  const insertAfter = (id: string, node: SymposiumDocumentNode) => {
    const index = Math.max(0, documentValue.nodes.findIndex((item) => item.id === id));
    emit({ ...documentValue, nodes: [...documentValue.nodes.slice(0, index + 1), node, ...documentValue.nodes.slice(index + 1)] });
    setActiveId(node.id);
  };
  const removeNode = (id: string) => {
    const node = documentValue.nodes.find((item) => item.id === id);
    const nodes = documentValue.nodes.filter((item) => item.id !== id);
    const next = { ...documentValue, nodes: nodes.length ? nodes : emptySymposiumDocument().nodes };
    if (node?.type === "attachment") {
      const nextAttachments = attachments.filter((attachment) => attachment.id !== node.attachmentId);
      onAttachmentsChange(nextAttachments);
      emit(next, nextAttachments);
    } else emit(next);
    setActiveId(next.nodes[Math.max(0, documentValue.nodes.findIndex((item) => item.id === id) - 1)]?.id ?? next.nodes[0].id);
  };
  const addTextBlock = (type: "paragraph" | "heading", level = 2) => insertAfter(activeId, type === "heading"
    ? { id: newDocumentBlockId(), type, level, content: [], align: "left" }
    : { id: newDocumentBlockId(), type, content: [], align: "left", indent: 0 });
  const command = (name: string, argument?: string) => {
    activeEditor.current?.focus();
    if (savedSelection.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection.current);
    }
    document.execCommand(name, false, argument);
    if (activeEditor.current) {
      const active = documentValue.nodes.find((node) => node.id === activeId);
      if (active && (active.type === "paragraph" || active.type === "heading" || active.type === "quote")) replaceNode(active.id, { ...active, content: parseEditableRuns(activeEditor.current) });
    }
  };
  const insertEquation = () => insertAfter(activeId, { id: newDocumentBlockId("equation"), type: "equation", source: "E = mc^2", display: true });
  const insertList = (style: "bullet" | "decimal") => insertAfter(activeId, { id: newDocumentBlockId("list"), type: "list", style, depth: 0, items: [[{ text: "List item" }]] });

  const uploadInline = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setInlineUploading(true);
    onBusyChange?.(true);
    try {
      const uploaded: InquiryAttachment[] = [];
      for (const file of files.slice(0, Math.max(0, 100 - attachments.length))) uploaded.push(await onUploadAttachment(file));
      const nextAttachments = [...attachments, ...uploaded];
      onAttachmentsChange(nextAttachments);
      const index = Math.max(0, documentValue.nodes.findIndex((node) => node.id === activeId));
      const blocks = uploaded.map((attachment) => ({ id: newDocumentBlockId("asset"), type: "attachment" as const, attachmentId: attachment.id, placement: "inline" as const }));
      const trailing = { id: newDocumentBlockId(), type: "paragraph" as const, content: [], align: "left" as const, indent: 0 };
      const next = { ...documentValue, nodes: [...documentValue.nodes.slice(0, index + 1), ...blocks, trailing, ...documentValue.nodes.slice(index + 1)] };
      emit(next, nextAttachments);
      setActiveId(trailing.id);
    } finally {
      setInlineUploading(false);
      onBusyChange?.(false);
    }
  };

  const fakePreviewItem = previewAttachmentId ? ({
    id: "composer-preview",
    kind: capability === "paper" ? "paper" : "thought",
    title: "Attachment preview",
    body: documentPlainText(documentValue),
    attachments,
    comments: []
  } as unknown as InquiryItem) : null;

  return (
    <section className={`symposium-document-editor capability-${capability}${disabled ? " disabled" : ""}`} aria-label="Document editor">
      <div className="document-editor-toolbar" role="toolbar" aria-label="Text and document formatting">
        <div>
          <button type="button" title="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")}><Bold size={16} /></button>
          <button type="button" title="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")}><Italic size={16} /></button>
          <button type="button" title="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => command("underline")}><Underline size={16} /></button>
        </div>
        {capability === "paper" ? <>
          <div>
            <button type="button" title="Paragraph" onClick={() => addTextBlock("paragraph")}><Pilcrow size={16} /></button>
            <button type="button" title="Heading 1" onClick={() => addTextBlock("heading", 1)}><Heading1 size={16} /></button>
            <button type="button" title="Heading 2" onClick={() => addTextBlock("heading", 2)}><Heading2 size={16} /></button>
            <button type="button" title="Bulleted list" onClick={() => insertList("bullet")}><List size={16} /></button>
            <button type="button" title="Numbered list" onClick={() => insertList("decimal")}><ListOrdered size={16} /></button>
          </div>
          <select title="Font" defaultValue="" onChange={(event) => { if (event.target.value) command("fontName", event.target.value); event.target.value = ""; }}>
            <option value="">Font</option><option value="system-ui">System</option><option value="Georgia, serif">Serif</option><option value="Arial, sans-serif">Humanist</option><option value="ui-monospace, monospace">Mono</option>
          </select>
          <select title="Text size" defaultValue="" onChange={(event) => { if (event.target.value) command("fontSize", event.target.value); event.target.value = ""; }}>
            <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Lead</option>
          </select>
          <select title="Page width" value={documentValue.settings?.width ?? "standard"} onChange={(event) => emit({ ...documentValue, settings: { margin: documentValue.settings?.margin ?? "normal", width: event.target.value as "standard" | "wide" } })}>
            <option value="standard">Standard width</option><option value="wide">Wide page</option>
          </select>
          <select title="Page margins" value={documentValue.settings?.margin ?? "normal"} onChange={(event) => emit({ ...documentValue, settings: { width: documentValue.settings?.width ?? "standard", margin: event.target.value as "compact" | "normal" | "generous" } })}>
            <option value="compact">Compact margins</option><option value="normal">Normal margins</option><option value="generous">Generous margins</option>
          </select>
          <div className="document-color-controls">
            {["#17211f", "#173f5f", "#8d2f3c", "#285943", "#9a6b16"].map((color) => <button key={color} type="button" title={`Text colour ${color}`} style={{ "--swatch": color } as CSSProperties} onMouseDown={(event) => event.preventDefault()} onClick={() => command("foreColor", color)} />)}
          </div>
        </> : null}
        <div>
          <button type="button" title="Insert equation" onClick={insertEquation}><Sigma size={17} /></button>
          <button type="button" title="Insert attachment here" onClick={() => inlineInputRef.current?.click()} disabled={inlineUploading || attachments.length >= 100}><FilePlus2 size={17} /></button>
          <input ref={inlineInputRef} className="document-hidden-input" type="file" multiple disabled={inlineUploading || disabled} onChange={uploadInline} />
        </div>
      </div>

      <div className={`document-editor-canvas document-width-${documentValue.settings?.width ?? "standard"} document-margin-${documentValue.settings?.margin ?? "normal"}`}>
        {documentValue.nodes.map((node, index) => (
          <div key={node.id} className={`document-editor-block ${activeId === node.id ? "active" : ""}`} onClick={() => setActiveId(node.id)}>
            <div className="document-block-rail" aria-label="Block controls">
              <button type="button" title="Move block up" disabled={index === 0} onClick={() => { const nodes = [...documentValue.nodes]; [nodes[index - 1], nodes[index]] = [nodes[index], nodes[index - 1]]; emit({ ...documentValue, nodes }); }}><ChevronUp size={14} /></button>
              <button type="button" title="Move block down" disabled={index === documentValue.nodes.length - 1} onClick={() => { const nodes = [...documentValue.nodes]; [nodes[index], nodes[index + 1]] = [nodes[index + 1], nodes[index]]; emit({ ...documentValue, nodes }); }}><ChevronDown size={14} /></button>
              <button type="button" title="Remove block" onClick={() => removeNode(node.id)}><Trash2 size={14} /></button>
            </div>
            {(node.type === "paragraph" || node.type === "heading" || node.type === "quote") ? (
              <>
                {capability === "paper" && node.type !== "quote" ? <div className="document-block-format">
                  <button type="button" title="Align left" onClick={() => replaceNode(node.id, { ...node, align: "left" })}><AlignLeft size={14} /></button>
                  <button type="button" title="Align center" onClick={() => replaceNode(node.id, { ...node, align: "center" })}><AlignCenter size={14} /></button>
                  <button type="button" title="Align right" onClick={() => replaceNode(node.id, { ...node, align: "right" })}><AlignRight size={14} /></button>
                  {node.type === "paragraph" ? <><button type="button" title="Decrease indentation" onClick={() => replaceNode(node.id, { ...node, indent: Math.max(0, node.indent - 1) })}><IndentDecrease size={14} /></button><button type="button" title="Increase indentation" onClick={() => replaceNode(node.id, { ...node, indent: Math.min(8, node.indent + 1) })}><IndentIncrease size={14} /></button></> : null}
                </div> : null}
                <EditableTextBlock
                  node={node}
                  active={activeId === node.id}
                  placeholder={index === 0 ? placeholder : "Continue writing…"}
                  onActivate={(element) => {
                    setActiveId(node.id);
                    activeEditor.current = element;
                    const selection = window.getSelection();
                    if (selection?.rangeCount && element.contains(selection.anchorNode)) savedSelection.current = selection.getRangeAt(0).cloneRange();
                  }}
                  onChange={(content) => replaceNode(node.id, { ...node, content })}
                  onEnter={() => insertAfter(node.id, { id: newDocumentBlockId(), type: "paragraph", content: [], align: "left", indent: node.type === "paragraph" ? node.indent : 0 })}
                  onRemove={() => removeNode(node.id)}
                />
              </>
            ) : node.type === "equation" ? <EquationEditor node={node} onChange={(next) => replaceNode(node.id, next)} />
              : node.type === "attachment" ? (() => { const attachment = attachments.find((item) => item.id === node.attachmentId); return attachment ? <div className="document-inline-attachment-editor"><AttachmentCarousel attachments={[attachment]} label="Inline attachment" variant="detail" onOpenPreview={() => setPreviewAttachmentId(attachment.id)} /><input value={node.caption ?? ""} placeholder="Add a caption (optional)" onChange={(event) => replaceNode(node.id, { ...node, caption: event.target.value })} /></div> : <p className="document-missing-attachment">This attachment is no longer available.</p>; })()
              : node.type === "list" ? <div className="document-list-editor"><textarea value={node.items.map((item) => item.map((run) => run.text).join("")).join("\n")} onChange={(event) => replaceNode(node.id, { ...node, items: event.target.value.split("\n").map((text) => [{ text }]) })} /><div><select value={node.style} onChange={(event) => replaceNode(node.id, { ...node, style: event.target.value as typeof node.style })}><option value="bullet">Bullets</option><option value="dash">Dashes</option><option value="decimal">Numbers</option><option value="lower-alpha">Letters a–z</option><option value="upper-alpha">Letters A–Z</option></select><button type="button" title="Decrease list level" onClick={() => replaceNode(node.id, { ...node, depth: Math.max(0, node.depth - 1) })}><Minus size={14} /></button><span>Level {node.depth + 1}</span><button type="button" title="Increase list level" onClick={() => replaceNode(node.id, { ...node, depth: Math.min(8, node.depth + 1) })}><Plus size={14} /></button></div></div>
              : node.type === "code" ? <textarea className="document-code-editor" value={node.code} onChange={(event) => replaceNode(node.id, { ...node, code: event.target.value })} />
              : <SymposiumDocumentRenderer document={{ version: 1, nodes: [node] }} body="" attachments={attachments} profiles={profiles} mode="editor" />}
          </div>
        ))}
      </div>

      <div className="document-appended-attachments">
        <div className="document-appended-label"><Paperclip size={16} /><span>Attachments after the text</span><small>These are shown first in feed previews.</small></div>
        <AttachmentComposerField
          attachments={appendedAttachments}
          maxAttachments={100 - inlineIds.size}
          disabled={disabled}
          onAttachmentsChange={(nextAppended) => {
            const inline = attachments.filter((attachment) => inlineIds.has(attachment.id));
            const next = [...inline, ...nextAppended];
            onAttachmentsChange(next);
            emit(documentValue, next);
          }}
          onBusyChange={onBusyChange}
          onUploadAttachment={onUploadAttachment}
        />
      </div>
      {fakePreviewItem && previewAttachmentId ? <AttachmentPreviewModal item={fakePreviewItem} attachmentId={previewAttachmentId} onClose={() => setPreviewAttachmentId(null)} /> : null}
    </section>
  );
}
