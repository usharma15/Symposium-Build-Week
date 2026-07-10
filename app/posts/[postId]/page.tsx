import { SymposiumPage } from "@/app/SymposiumPage";

export default async function PostPage({
  params,
  searchParams
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ comment?: string | string[] }>;
}) {
  const [{ postId }, query] = await Promise.all([params, searchParams]);
  const commentId = Array.isArray(query.comment) ? query.comment[0] : query.comment;
  return <SymposiumPage initialRoute={{ kind: "post", postId, commentId }} />;
}
