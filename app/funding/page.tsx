import { SymposiumPage } from "@/app/SymposiumPage";

export default async function FundingPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view = rawView === "civic" || rawView === "private" ? rawView : undefined;
  return <SymposiumPage initialRoute={{ kind: "funding", view }} />;
}
