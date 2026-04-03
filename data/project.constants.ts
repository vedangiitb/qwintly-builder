export const ProjectRequestType = {
  NEW: "new",
  UPDATE: "update",
} as const;

export const ProjectPathConstants = (chatId: string) => {
  return {
    baseCodeIndex: "indexes/default-code_index.json",
    baseTemplate: "base-template.zip",
    codeIndex: `indexes/code_index-${chatId}.json`,
    tmpZipPath: `/tmp/template_${chatId}.zip`,
    snapShotPath: `projects/snapshot_${chatId}.zip`,
  };
};
export type ProjectRequestType =
  (typeof ProjectRequestType)[keyof typeof ProjectRequestType];
