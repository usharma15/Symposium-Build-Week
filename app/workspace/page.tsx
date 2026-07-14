import { SymposiumPage } from "@/app/SymposiumPage";

export default async function WorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ view?: string | string[]; note?: string | string[]; comment?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view = rawView === "saved" || rawView === "notes" ? rawView : undefined;
  const noteId = (Array.isArray(query.note) ? query.note[0] : query.note)?.trim() || undefined;
  const commentId = (Array.isArray(query.comment) ? query.comment[0] : query.comment)?.trim() || undefined;
  return <SymposiumPage initialRoute={{ kind: "workspace", view, noteId, commentId }} />;
}
