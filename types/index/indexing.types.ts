export type FileExtension = `.${string}`;

export interface IndexingConfig {
  includeExtensions: readonly FileExtension[];
  excludeDirectories: readonly string[];
  maxFileBytes: number;
  chunkSize: number;
  chunkOverlap: number;
}
