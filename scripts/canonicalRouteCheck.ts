import assert from "node:assert/strict";
import { canonicalRouteHref, parseCanonicalRoute } from "@/features/navigation/canonicalRoute";

assert.equal(canonicalRouteHref({ kind: "hall" }), "/");
assert.equal(canonicalRouteHref({ kind: "room", roomId: "library" }), "/rooms/library");
assert.deepEqual(parseCanonicalRoute("/rooms/amphitheater"), { kind: "room", roomId: "amphitheater" });
assert.equal(canonicalRouteHref({ kind: "workspace", view: "notes" }), "/workspace?view=notes");
assert.deepEqual(parseCanonicalRoute("/workspace", "?view=saved"), { kind: "workspace", view: "saved" });
assert.equal(canonicalRouteHref({ kind: "funding", view: "private" }), "/funding?view=private");
assert.deepEqual(parseCanonicalRoute("/opportunities"), { kind: "opportunities" });
assert.deepEqual(parseCanonicalRoute("/messages"), { kind: "messages" });
assert.equal(
  canonicalRouteHref({ kind: "post", postId: "post/one", commentId: "comment one" }),
  "/posts/post%2Fone?comment=comment%20one"
);
assert.deepEqual(parseCanonicalRoute("/posts/post%2Fone", "?comment=comment%20one"), {
  kind: "post",
  postId: "post/one",
  commentId: "comment one"
});
assert.equal(canonicalRouteHref({ kind: "profile", handle: "@ada" }), "/profiles/ada");
assert.deepEqual(parseCanonicalRoute("/profiles/ada"), { kind: "profile", handle: "@ada" });
assert.deepEqual(parseCanonicalRoute("/communities/frontier-physics"), {
  kind: "community",
  communityId: "frontier-physics"
});
assert.equal(canonicalRouteHref({ kind: "communities" }), "/communities");
assert.deepEqual(parseCanonicalRoute("/communities"), { kind: "communities" });
assert.deepEqual(parseCanonicalRoute("/unknown/path"), { kind: "hall" });

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: [
        "room routes",
        "workspace and funding views",
        "opportunities and messages",
        "post and comment round-trip",
        "profile handle normalization",
        "community routes",
        "safe fallback"
      ]
    },
    null,
    2
  )
);
