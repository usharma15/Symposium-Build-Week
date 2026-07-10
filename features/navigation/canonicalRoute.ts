export type CanonicalRoute =
  | { kind: "hall" }
  | { kind: "post"; postId: string; commentId?: string }
  | { kind: "profile"; handle: string }
  | { kind: "communities" }
  | { kind: "community"; communityId: string };

const cleanSegment = (value: string | undefined) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
};

const encoded = (value: string) => encodeURIComponent(value.trim());

export const canonicalRouteHref = (route: CanonicalRoute) => {
  if (route.kind === "post") {
    const base = `/posts/${encoded(route.postId)}`;
    return route.commentId ? `${base}?comment=${encoded(route.commentId)}` : base;
  }
  if (route.kind === "profile") {
    return `/profiles/${encoded(route.handle.replace(/^@/, ""))}`;
  }
  if (route.kind === "communities") return "/communities";
  if (route.kind === "community") return `/communities/${encoded(route.communityId)}`;
  return "/";
};

export const parseCanonicalRoute = (pathname: string, search = ""): CanonicalRoute => {
  const segments = pathname.split("/").filter(Boolean).map(cleanSegment);
  if (segments[0] === "posts" && segments[1]) {
    const commentId = new URLSearchParams(search).get("comment")?.trim() || undefined;
    return { kind: "post", postId: segments[1], commentId };
  }
  if (segments[0] === "profiles" && segments[1]) {
    return { kind: "profile", handle: `@${segments[1].replace(/^@/, "")}` };
  }
  if (segments[0] === "communities" && segments[1]) {
    return { kind: "community", communityId: segments[1] };
  }
  if (segments[0] === "communities") return { kind: "communities" };
  return { kind: "hall" };
};
