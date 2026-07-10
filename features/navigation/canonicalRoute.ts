export type CanonicalRoute =
  | { kind: "hall" }
  | { kind: "room"; roomId: CanonicalRoomId }
  | { kind: "workspace"; view?: "saved" | "notes" }
  | { kind: "funding"; view?: "civic" | "private" }
  | { kind: "opportunities" }
  | { kind: "messages" }
  | { kind: "post"; postId: string; commentId?: string }
  | { kind: "profile"; handle: string }
  | { kind: "communities" }
  | { kind: "community"; communityId: string };

export const canonicalRoomIds = ["symposium", "library", "amphitheater"] as const;
export type CanonicalRoomId = (typeof canonicalRoomIds)[number];

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
  if (route.kind === "room") return `/rooms/${route.roomId}`;
  if (route.kind === "workspace") return route.view ? `/workspace?view=${route.view}` : "/workspace";
  if (route.kind === "funding") return route.view ? `/funding?view=${route.view}` : "/funding";
  if (route.kind === "opportunities") return "/opportunities";
  if (route.kind === "messages") return "/messages";
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
  if (segments[0] === "rooms" && canonicalRoomIds.includes(segments[1] as CanonicalRoomId)) {
    return { kind: "room", roomId: segments[1] as CanonicalRoomId };
  }
  if (segments[0] === "workspace") {
    const view = new URLSearchParams(search).get("view");
    return { kind: "workspace", view: view === "saved" || view === "notes" ? view : undefined };
  }
  if (segments[0] === "funding") {
    const view = new URLSearchParams(search).get("view");
    return { kind: "funding", view: view === "civic" || view === "private" ? view : undefined };
  }
  if (segments[0] === "opportunities") return { kind: "opportunities" };
  if (segments[0] === "messages") return { kind: "messages" };
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
