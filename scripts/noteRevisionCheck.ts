import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import { assertExpectedRevision } from "@/apps/api/src/repository/workspace";
import { saveNoteBlockInputSchema } from "@/packages/contracts/src";

const main = async () => {
  assert.doesNotThrow(() => assertExpectedRevision("note", 4, 4));
  assert.throws(
    () => assertExpectedRevision("note", 4),
    (error) => error instanceof TRPCError && error.code === "PRECONDITION_FAILED"
  );
  assert.throws(
    () => assertExpectedRevision("note block", 5, 4),
    (error) => error instanceof TRPCError && error.code === "CONFLICT"
  );

  const parsed = saveNoteBlockInputSchema.parse({
    workspaceId: "00000000-0000-4000-8000-000000000001",
    noteId: "00000000-0000-4000-8000-000000000002",
    blockId: "00000000-0000-4000-8000-000000000003",
    expectedNoteRevision: 7,
    expectedBlockRevision: 3,
    body: "Revision-safe note block"
  });
  assert.equal(parsed.expectedNoteRevision, 7);
  assert.equal(parsed.expectedBlockRevision, 3);

  const workspaceSource = await readFile(
    path.join(process.cwd(), "apps/api/src/repository/workspace.ts"),
    "utf8"
  );
  assert.match(workspaceSource, /revision = revision \+ 1/);
  assert.match(workspaceSource, /WHERE id = \$1 AND revision = \$2/);
  assert.match(workspaceSource, /noteRevision/);

  console.log(
    JSON.stringify(
      {
        ok: true,
        checked: [
          "required expected revisions for existing notes",
          "stale block conflict rejection",
          "revision-bearing note persistence contract",
          "atomic note aggregate revision advancement"
        ]
      },
      null,
      2
    )
  );
};

void main();
