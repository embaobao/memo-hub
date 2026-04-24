import { describe, expect, test } from "bun:test";
import { parseDiffTreeNameStatus } from "./git-utils.js";

describe("Librarian - git-utils", () => {
  test("parseDiffTreeNameStatus 支持 M/A 与重命名", () => {
    const stdout = [
      "M\tsrc/a.ts",
      "A\tREADME.md",
      "R100\told.ts\tnew.ts",
      "",
    ].join("\n");

    const files = parseDiffTreeNameStatus(stdout);
    expect(files).toEqual([
      { status: "M", filePath: "src/a.ts" },
      { status: "A", filePath: "README.md" },
      { status: "R100", filePath: "new.ts" },
    ]);
  });
});

