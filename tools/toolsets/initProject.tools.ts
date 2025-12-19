import { createStructureTool } from "../../tools/schemas/createFolderStructure.schema.js";
import { writeFileTool } from "../../tools/schemas/writeFile.schema.js";
export const modifyFolderStructureTools = [
  {
    functionDeclarations: [createStructureTool, writeFileTool],
  },
];

