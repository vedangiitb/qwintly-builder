import { createStructureTool } from "../../function_declarations/createProjectStructure.js";
import { writeFileTool } from "../../function_declarations/writeFile.js";
export const tools = [
  {
    functionDeclarations: [createStructureTool, writeFileTool],
  },
];
