export interface ProjectIndex {
  folderTree: TreeEntry[];
  legend: ProjectStructureLegend;
}
export interface FileEntry {
  name: string;
  path: string;
  ext?: string;
  kind?: string;
}

export interface TreeEntry extends FileEntry {
  isDir: boolean;
  depth: number;
  tags?: string[];
  exports?: string[];
  dependencies?: string[];
  summary?: string;
  route?: string;
}

export interface ProjectStructureLegend {
  isDir: string;
  depth: string;
  path: string;
  ext: string;
  summary: string;
  dependencies: string;
  exports: string;
  tags: string;
  route: string;
  kind: Record<string, string>;
}
