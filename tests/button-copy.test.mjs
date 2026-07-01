import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

assert.doesNotMatch(app, /Next Blank/i);
assert.match(app, />Next<\/button>/);
assert.match(app, />Quit<\/button>/);
assert.match(app, />Test again<\/button>/);
assert.match(app, />Back<\/button>/);

console.log("Button copy is correct.");
