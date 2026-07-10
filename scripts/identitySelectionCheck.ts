import assert from "node:assert/strict";
import { selectActiveProfile } from "@/features/identity/selectActiveProfile";

const profiles = {
  "@udayan": { handle: "@udayan", name: "Udayan" },
  "@usera": { handle: "@usera", name: "User A" }
};

assert.equal(
  selectActiveProfile({
    profiles,
    defaultProfile: profiles["@udayan"],
    authenticatedHandle: "@usera",
    preferredHandle: "@udayan"
  }).handle,
  "@usera"
);

assert.equal(
  selectActiveProfile({
    profiles: { "@udayan": profiles["@udayan"] },
    defaultProfile: profiles["@udayan"],
    authenticatedHandle: "@usera",
    authenticatedProfile: profiles["@usera"],
    preferredHandle: "@udayan"
  }).handle,
  "@usera"
);

assert.equal(
  selectActiveProfile({
    profiles,
    defaultProfile: profiles["@udayan"],
    preferredHandle: "@usera"
  }).handle,
  "@usera"
);

assert.equal(
  selectActiveProfile({
    profiles,
    defaultProfile: profiles["@udayan"],
    authenticatedHandle: "@missing",
    preferredHandle: "@missing"
  }).handle,
  "@udayan"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: [
        "authenticated identity precedence",
        "in-flight bootstrap identity preservation",
        "stored preference fallback",
        "default profile fallback"
      ]
    },
    null,
    2
  )
);

export {};
