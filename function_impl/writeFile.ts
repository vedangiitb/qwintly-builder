import fs from "fs/promises";

export async function writeFile({ path: filePath, content }: any) {
  await fs.writeFile(filePath, content, "utf-8");
  return { ok: true };
}
