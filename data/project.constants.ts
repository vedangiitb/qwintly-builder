export const ProjectRequestType = {
  NEW: "new",
  UPDATE: "update",
} as const;

export const ProjectPathConstants = (sessionId: string) => {
  return {
    baseCodeIndex: "indexes/default-code_index.json",
    baseTemplate: "base-template.zip",
    codeIndex: `indexes/code_index-${sessionId}.json`,
    tmpZipPath: `/tmp/template_${sessionId}.zip`,
    snapShotPath: `projects/snapshot_${sessionId}.zip`,
  };
};
export type ProjectRequestType =
  (typeof ProjectRequestType)[keyof typeof ProjectRequestType];
