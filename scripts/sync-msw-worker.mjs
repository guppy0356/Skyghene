// Copy MSW's worker script into every playground listed in the root package.json.
//
// MSW ships this as a postinstall of its own, keyed off `msw.workerDirectory` in the
// package.json at INIT_CWD. pnpm does not give dependency lifecycle scripts an INIT_CWD,
// so that hook throws on `path.resolve(undefined, ...)` and MSW's own catch discards it —
// silently, which is how thirteen playgrounds drifted without anyone noticing. Running the
// copy from the root project's own postinstall does not depend on INIT_CWD at all.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const { msw } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const directories = msw?.workerDirectory ?? [];

if (directories.length === 0) {
  console.warn("[msw] package.json has no msw.workerDirectory — nothing to sync.");
  process.exit(0);
}

// Resolve msw from a playground rather than the root, which does not depend on it.
const firstPackage = path.join(root, path.dirname(directories[0]), "package.json");
let source;
try {
  const require = createRequire(firstPackage);
  source = path.join(path.dirname(require.resolve("msw/package.json")), "lib/mockServiceWorker.js");
  fs.accessSync(source);
} catch (error) {
  // Loudly, unlike the hook this replaces: a skipped sync must not look like a clean one.
  console.warn(`[msw] Could not resolve the worker script, so it was not synced.\n${error}`);
  process.exit(0);
}

const script = fs.readFileSync(source);
const updated = [];

for (const directory of directories) {
  const destination = path.join(root, directory, "mockServiceWorker.js");
  if (!fs.existsSync(path.dirname(destination))) {
    console.warn(`[msw] ${directory} does not exist — skipped.`);
    continue;
  }
  if (fs.existsSync(destination) && fs.readFileSync(destination).equals(script)) continue;
  fs.writeFileSync(destination, script);
  updated.push(directory);
}

if (updated.length > 0) {
  console.log(`[msw] Worker script updated in ${updated.length} playground(s):`);
  for (const directory of updated) console.log(`  ${directory}`);
}
