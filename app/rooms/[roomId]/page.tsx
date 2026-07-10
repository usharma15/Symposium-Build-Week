import { SymposiumPage } from "@/app/SymposiumPage";
import { canonicalRoomIds, type CanonicalRoomId } from "@/features/navigation/canonicalRoute";
import { notFound } from "next/navigation";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!canonicalRoomIds.includes(roomId as CanonicalRoomId)) notFound();
  return <SymposiumPage initialRoute={{ kind: "room", roomId: roomId as CanonicalRoomId }} />;
}
