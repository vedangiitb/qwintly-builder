import archiver from "archiver";
import fs, { createReadStream } from "fs";
import unzipper from "unzipper";

export async function zipFolder(
  sourceDir: string,
  outPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export async function extractZip(zipPath: string, dest: string) {
  return new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: dest }))
      .on("close", resolve)
      .on("error", reject);
  });
}
