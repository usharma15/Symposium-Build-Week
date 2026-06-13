import { createPost, getSnapshot, type CreatePostInput } from "@/lib/dataStore";
import type { ContentKind, RoomId } from "@/lib/mockData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentKinds: ContentKind[] = ["paper", "thought", "draft", "note", "code"];
const postRooms: Array<Exclude<RoomId, "hall">> = ["office", "symposium", "library", "amphitheater"];

export async function GET() {
  const snapshot = await getSnapshot();
  return Response.json({ items: snapshot.items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreatePostInput> & { authorHandle?: string };
  const kind = String(body.kind ?? "");
  const room = String(body.room ?? "");
  const input: CreatePostInput = {
    title: String(body.title ?? "").trim(),
    body: String(body.body ?? "").trim(),
    kind: contentKinds.includes(kind as ContentKind) ? (kind as ContentKind) : "thought",
    room: postRooms.includes(room as Exclude<RoomId, "hall">)
      ? (room as Exclude<RoomId, "hall">)
      : "symposium"
  };

  if (!input.title || !input.body) {
    return Response.json({ error: "Title and body are required." }, { status: 400 });
  }

  const item = await createPost(input, String(body.authorHandle ?? ""));
  return Response.json({ item });
}
