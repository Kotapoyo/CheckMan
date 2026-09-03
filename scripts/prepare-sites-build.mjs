import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectDirectory, ".output");
const sitesDirectory = path.join(projectDirectory, "dist");

await rm(sitesDirectory, { recursive: true, force: true });
await mkdir(path.join(sitesDirectory, "server"), { recursive: true });

await cp(path.join(outputDirectory, "server"), path.join(sitesDirectory, "server"), {
  recursive: true,
});
await cp(path.join(outputDirectory, "public"), path.join(sitesDirectory, "client"), {
  recursive: true,
});

await copyFile(
  path.join(outputDirectory, "server", "index.mjs"),
  path.join(sitesDirectory, "server", "index.js"),
);

await mkdir(path.join(sitesDirectory, ".openai"), { recursive: true });
await copyFile(
  path.join(projectDirectory, ".openai", "hosting.json"),
  path.join(sitesDirectory, ".openai", "hosting.json"),
);
