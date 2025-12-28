import { pmIndexConstants } from "../../data/pmIndex.constants.js";
import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { ProjectDetails } from "../../types/index/projectDetails/projectDetails.js";
import { ProjectStructure } from "../../types/index/projectStructure/projectStructure.js";
import { PmIndex } from "../../types/pmIndex/pmIndex.js";
import { pmMessage } from "../../types/pmMessage.js";
import { getProjectStructure } from "./helpers/getProjectStructure.js";
import { updateProjectDetails } from "./helpers/updateProjectDetails.js";
import { uploadIndex } from "./uploadIndex.service.js";

export const updateCodeIndex = async (
  ctx: JobContext,
  pmMessage: pmMessage,
  codeIndex: CodeIndex
) => {
  const projectDetails: ProjectDetails = updateProjectDetails(pmMessage);

  const projectStructure: ProjectStructure = await getProjectStructure(ctx);

  const newCodeIndex = {
    projectDetails: projectDetails,
    projectConfig: codeIndex.projectConfig,
    projectConventions: codeIndex.projectConventions,
    projectStructure: projectStructure,
  };

  try {
    await uploadIndex(newCodeIndex, ctx, "codeIndex");
  } catch (err) {
    throw new Error(`Failed to update code index: ${err}`);
  }

  const newPmIndex: PmIndex = {
    projectDetails: projectDetails,
    capabilities: pmIndexConstants.capabilities,
    existingPages: projectStructure,
  };

  try {
    await uploadIndex(newPmIndex, ctx, "pmIndex");
  } catch (err) {
    throw new Error(`Failed to update pm index: ${err}`);
  }
};
