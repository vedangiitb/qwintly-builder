import { projectSpecifications } from "../codeIndex/projectSpecifications.js";

export interface codegenContextInterface {
  specifications: projectSpecifications;
  isNewFile: boolean;
  pagePath: string;
  requirements: string;
  content: string;
  code: string;
}