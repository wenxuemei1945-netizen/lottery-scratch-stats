import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
// @ts-expect-error The deployment helper is an ESM build script exercised by Vitest.
import { prepareSitesBuild, sitesWorkerSource } from "../scripts/prepare-sites-build.mjs";

describe("Sites build preparation", () => {
  it("writes the worker entrypoint and hosting metadata expected by Sites", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "lottery-sites-build-"));
    await mkdir(join(rootDir, ".openai"));
    await writeFile(join(rootDir, ".openai", "hosting.json"), '{ "project_id": "test-project" }');

    await prepareSitesBuild(rootDir);

    await expect(readFile(join(rootDir, "dist", "server", "index.js"), "utf8")).resolves.toBe(sitesWorkerSource);
    await expect(readFile(join(rootDir, "dist", ".openai", "hosting.json"), "utf8")).resolves.toBe(
      '{ "project_id": "test-project" }'
    );
  });
});
