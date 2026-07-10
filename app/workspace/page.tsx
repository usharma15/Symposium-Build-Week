import { SymposiumPage } from "@/app/SymposiumPage";

export default async function WorkspacePage({
  searchParams
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view = rawView === "saved" || rawView === "notes" ? rawView : undefined;
  return <SymposiumPage initialRoute={{ kind: "workspace", view }} />;
}
