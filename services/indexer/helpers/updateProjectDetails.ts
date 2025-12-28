import { ProjectDetails } from "../../../types/index/projectDetails/projectDetails.js";
import { pmMessage } from "../../../types/pmMessage.js";

export const updateProjectDetails = (pmMessage: pmMessage): ProjectDetails => {
  return pmMessage.newInfo;
};

