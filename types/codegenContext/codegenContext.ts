import { CodeIndex } from "../index/codeIndex.js";

export interface CodegenContextInterface {
  specifications: CodeIndex;
  isNewFile: boolean;
  pagePath: string;
  requirements: string;
  content: string;
  fileCode: string;
  dependsCode: DependsCode[];
}

export interface DependsCode {
  file: string;
  code: string;
}

// TODO: Modify instead of sending projectStructure, only send relevant structure
