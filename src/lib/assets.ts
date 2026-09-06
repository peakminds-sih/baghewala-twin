import { existsSync } from "node:fs";
import { join } from "node:path";

// Server-only. Checks whether a file under /public exists.
// Used to disable document cards and to swap team photos for initials.
export function publicFileExists(publicPath: string): boolean {
  const relative = publicPath.replace(/^\//, "");
  return existsSync(join(process.cwd(), "public", relative));
}
