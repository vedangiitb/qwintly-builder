import { CodeIndex } from "../index/codeIndex.js";

export interface CodegenContextInterface {
  specifications: CodeIndex;
  isNewFile: boolean;
  pagePath: string;
  requirements: string;
  content: string;
  code: string;
}

// TODO: Modify instead of sending projectStructure, only send relevant structure
