import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);

const sourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (ignoredDirectories.has(entry.name)) return [];
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(fullPath);
      return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
    })
  );
  return nested.flat();
};

const root = process.cwd();
const relative = (file: string) => path.relative(root, file).replaceAll(path.sep, "/");
const imports = async (file: string) => {
  const source = await readFile(file, "utf8");
  return [...source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map((match) => match[2]);
};

const main = async () => {
  const files = await sourceFiles(root);
  const symposiumImporters: string[] = [];
  for (const file of files) {
    const fileName = relative(file);
    const fileImports = await imports(file);

    if (fileImports.some((specifier) => specifier.includes("components/SymposiumV0"))) {
      symposiumImporters.push(fileName);
    }

    if (fileName.startsWith("apps/api/src/")) {
      assert.equal(
        fileImports.some((specifier) => specifier.includes("components/") || specifier.includes("app/api/")),
        false,
        `${fileName} must not depend on frontend components or Next bridge routes.`
      );
    }

    if (fileName.startsWith("features/")) {
      assert.equal(
        fileImports.some((specifier) => specifier.includes("components/SymposiumV0") || specifier.includes("app/")),
        false,
        `${fileName} must not depend on the legacy application shell.`
      );
    }
  }

  assert.deepEqual(symposiumImporters.sort(), ["app/page.tsx"]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        checked: [
          "single legacy shell entrypoint",
          "backend to frontend dependency isolation",
          "feature module independence"
        ]
      },
      null,
      2
    )
  );
};

void main();
