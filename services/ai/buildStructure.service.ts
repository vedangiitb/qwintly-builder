import { aiResponse } from "../../infra/ai/gemini.client.js";
import { JobContext } from "../../job/jobContext.js";
import { initProjectPrompt } from "../../prompts/initProject.js";
import { createProjectStructure } from "../../tools/implementations/createProjectStructure.js";
import { modifyFolderStructureTools } from "../../tools/toolsets/initProject.tools.js";

export async function genStructure(ctx: JobContext, request: string) {
  const workspace = ctx.workspace;
  if (!request) {
    throw new Error("request is required");
  }

  try {
    const planResponse = await aiResponse(
      initProjectPrompt(request),
      modifyFolderStructureTools
    );

    console.log(planResponse.text);

    if (planResponse.functionCalls && planResponse.functionCalls.length > 0) {
      const functionCall = planResponse.functionCalls[0];
      const { name, args } = functionCall;
      console.log(`Function to call: ${functionCall.name}`);
      console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);

      if (
        name === "create_project_structure" &&
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
