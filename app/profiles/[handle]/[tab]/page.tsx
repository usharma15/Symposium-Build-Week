import { notFound } from "next/navigation";
import { SymposiumPage } from "@/app/SymposiumPage";
import {
  canonicalProfileTabs,
  type ProfileTab
} from "@/features/navigation/canonicalRoute";

export default async function ProfileTabPage({
  params
}: {
  params: Promise<{ handle: string; tab: string }>;
}) {
  const { handle, tab } = await params;
  if (tab === "all" || !canonicalProfileTabs.includes(tab as ProfileTab)) notFound();
  return (
    <SymposiumPage
      initialRoute={{
        kind: "profile",
        handle: `@${handle.replace(/^@/, "")}`,
        tab: tab as ProfileTab
      }}
    />
  );
}
