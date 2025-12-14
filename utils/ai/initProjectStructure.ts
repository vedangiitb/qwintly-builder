import { ai } from "./ai.js";
import { tools } from "./tools.js";
import { initProjectPrompt } from "../../data/prompts/initProject.js";
import { projectConstants } from "../../data/constants.js";
import { createProjectStructure } from "../../function_impl/createProjectStructure.js";

export const initProjectStructure = async (
  requestType: string,
  request: string,
  workspace: string
) => {
  if (!requestType || !request) {
    throw new Error("Request type and request are required");
  }
  if (requestType != projectConstants.projectRequestTypes.new) {
    return;
  }

  try {
    const planResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: initProjectPrompt(request),
      config: {
        tools: tools,
      },
    });

    console.log(planResponse.text);

    if (planResponse.functionCalls && planResponse.functionCalls.length > 0) {
      const functionCall = planResponse.functionCalls[0]; // Assuming one function call
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
};
