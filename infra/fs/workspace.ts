// infra/fs/workspace.ts
import fs from "fs/promises";

export async function createFolder(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function removeFolder(path: string) {
  await fs.rm(path, { recursive: true, force: true });
}

export async function createFile(path: string, content: string) {
  await fs.writeFile(path, content, "utf-8");
}

export async function removeFile(path: string) {
  await fs.rm(path, { force: true });
}

export async function copyFile(from: string, to: string) {
  await fs.copyFile(from, to);
}

export async function stat(path: string) {
  return await fs.stat(path);
}

export async function readDir(path: string) {
  return await fs.readdir(path, { withFileTypes: true });
}

export async function readFile(path: string) {
  return await fs.readFile(path, "utf-8");
}
