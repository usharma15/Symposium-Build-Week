import { SymposiumPage } from "@/app/SymposiumPage";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <SymposiumPage initialRoute={{ kind: "profile", handle: `@${handle.replace(/^@/, "")}` }} />;
}
