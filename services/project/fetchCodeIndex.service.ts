import { projectConfigs } from "../../data/configs.constants.js";
import { ProjectRequestType } from "../../data/project.constants.js";
import { downloadContentsGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { ProjectStructure } from "../../types/index/projectStructure/projectStructure.js";
import { getProjectStructure } from "../indexer/helpers/getProjectStructure.js";

export const fetchCodeIndex = async (ctx: JobContext): Promise<CodeIndex> => {
  const bucketName = ctx.codeIndexBucket;
  const sessionId = ctx.sessionId;
  // const filePath = `indexes/${sessionId}.json`;
  const filePath = `indexes/code_index.json`;
  let codeIndex: CodeIndex;
  if (ctx.requestType == ProjectRequestType.NEW) {
    codeIndex = await newCodeIndex(ctx);
  } else {
    codeIndex = await downloadContentsGCS(filePath, bucketName);
  }

  return codeIndex;
};

const newCodeIndex = async (ctx: JobContext): Promise<CodeIndex> => {
  const projectStructure: ProjectStructure = await getProjectStructure(ctx);
  return {
    projectConfig: { framework: projectConfigs.frameworkConfig },
    projectConventions: {
      folderStructure: projectConfigs.folderStructure,
      routingConventions: projectConfigs.routingConventions,
      allowedShadcnComponents: projectConfigs.allowedShadcnComponents,
    },
    projectStructure: projectStructure,
  };
};
