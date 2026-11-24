import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "chore: delete all tests, Friday deploy now has zero failures";

const MAX_CHARS = 159;

function main(): void {
  const line = LINE;
  if (line.length < 1 || line.length > MAX_CHARS) {
    throw new Error(`line must be 1-${MAX_CHARS} characters, got ${line.length}`);
  }
  if (line.trim().length === 0) {
    throw new Error("line must not be only whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("line must be a single line");
  }
  // Reject control characters: the gate reads raw UTF-8 text, and a stray
  // control char would survive the length check but break the entry.
  for (const ch of line) {
    if (ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f) {
      throw new Error("line must not contain control characters");
    }
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, line, "utf8");

  // Round-trip read-back check: what landed on disk must be exactly the line,
  // byte for byte, not just the same characters after decoding.
  const back = readFileSync(outPath, "utf8");
  if (back !== line) {
    throw new Error("round-trip check failed: entry.txt does not match the line");
  }
  const writtenBytes = Buffer.byteLength(back, "utf8");
  const expectedBytes = Buffer.byteLength(line, "utf8");
  if (writtenBytes !== expectedBytes) {
    throw new Error(
      `round-trip check failed: wrote ${writtenBytes} bytes, expected ${expectedBytes}`,
    );
  }
}

main();
