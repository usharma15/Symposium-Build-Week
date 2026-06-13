import { addComment, type CreateCommentInput } from "@/lib/dataStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = (await request.json()) as Partial<CreateCommentInput> & { authorHandle?: string };
  const input: CreateCommentInput = {
    body: String(body.body ?? "").trim(),
    stance: String(body.stance ?? "Comment").trim(),
    parentId: body.parentId ? String(body.parentId) : null
  };

  if (!input.body) {
    return Response.json({ error: "Comment body is required." }, { status: 400 });
  }

  const comment = await addComment(id, input, String(body.authorHandle ?? ""));
  return Response.json({ comment });
}
