// Renders the HTML document sources in docs/ to the PDFs in public/documents/.
// It uses the print-to-PDF mode of an installed Chrome or Edge.
//
// Usage: npm run docs:pdf            (all documents)
//        npm run docs:pdf -- field-guide   (one document)
//
// research.pdf has no HTML source. Its errata page (docs/research-errata.html)
// is rendered to docs/build/ and appended to research.pdf by hand.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DOCUMENTS = {
  "technical-reference": "public/documents/technical-reference.pdf",
  "field-guide": "public/documents/field-guide.pdf",
  "variable-relationships": "public/documents/variable-relationships.pdf",
  "research-errata": "docs/build/research-errata.pdf",
};

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const browser = BROWSERS.find((path) => existsSync(path));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH.");
  process.exit(1);
}

const only = process.argv[2];
const names = only ? [only] : Object.keys(DOCUMENTS);

for (const name of names) {
  const output = DOCUMENTS[name];
  if (!output) {
    console.error(`Unknown document: ${name}`);
    process.exit(1);
  }
  const source = join(root, "docs", `${name}.html`);
  const target = join(root, output);
  mkdirSync(dirname(target), { recursive: true });

  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    // Give web fonts time to load before the page is printed.
    "--virtual-time-budget=15000",
    `--print-to-pdf=${target}`,
    pathToFileURL(source).href,
  ]);
  console.log(`${name} -> ${output}`);
}
