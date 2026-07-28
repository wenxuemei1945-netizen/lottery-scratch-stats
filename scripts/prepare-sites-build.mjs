import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const sitesWorkerSource = `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`;

export async function prepareSitesBuild(rootDir = dirname(dirname(fileURLToPath(import.meta.url)))) {
  const distDir = join(rootDir, "dist");

  await mkdir(join(distDir, "server"), { recursive: true });
  await mkdir(join(distDir, ".openai"), { recursive: true });
  await writeFile(join(distDir, "server", "index.js"), sitesWorkerSource, "utf8");
  await copyFile(join(rootDir, ".openai", "hosting.json"), join(distDir, ".openai", "hosting.json"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await prepareSitesBuild();
}
