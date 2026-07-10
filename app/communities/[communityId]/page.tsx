import { SymposiumPage } from "@/app/SymposiumPage";

export default async function CommunityPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params;
  return <SymposiumPage initialRoute={{ kind: "community", communityId }} />;
}
