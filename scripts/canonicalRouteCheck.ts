import assert from "node:assert/strict";
import { canonicalRouteHref, parseCanonicalRoute } from "@/features/navigation/canonicalRoute";

assert.equal(canonicalRouteHref({ kind: "hall" }), "/");
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
      checked: ["post and comment round-trip", "profile handle normalization", "community route", "safe fallback"]
    },
    null,
    2
  )
);
