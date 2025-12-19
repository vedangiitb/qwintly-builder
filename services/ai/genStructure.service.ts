import { aiResponse } from "../../infra/ai/gemini.client.js";
import { JobContext } from "../../job/jobContext.js";
import { genStructurePrompt } from "../../prompts/genStructure.js";
import { createProjectStructure } from "../../tools/implementations/createProjectStructure.js";
import { createStructureTool } from "../../tools/schemas/createFolderStructure.schema.js";
import { modifyFolderStructureTools } from "../../tools/toolsets/initProject.tools.js";
import { readStructure } from "../../utils/readStructure.js";

export async function genStructure(ctx: JobContext, request: JSON) {
  const workspace = ctx.workspace;
  const requestJson = JSON.stringify(request);

  if (!request) {
    throw new Error("request is required");
  }
  const existingStructure = (await readStructure(workspace)).join("\n");

  try {
    const planResponse = await aiResponse(
      genStructurePrompt(requestJson, existingStructure),
      modifyFolderStructureTools
    );

    console.log(planResponse.text);

    if (planResponse.functionCalls && planResponse.functionCalls.length > 0) {
      const functionCall = planResponse.functionCalls[0];
      const { name, args } = functionCall;
      console.log(`Function to call: ${functionCall.name}`);
      console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);

      if (
        name === createStructureTool.name &&
        args &&
        Array.isArray(args.folders) &&
        Array.isArray(args.files)
      ) {
        await createProjectStructure({
          root: workspace,
          folders: args.folders || [],
          files: args.files || [],
        });
      }
    } else {
      console.log("No function call found in the response.");
    }
  } catch (err: any) {
    console.error("Error initializing project structure:", err);
    throw new Error("Failed to initialize project structure");
  }
}
