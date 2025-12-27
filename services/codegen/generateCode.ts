import { aiResponse } from "../../infra/ai/gemini.client.js";
import { codegenPrompt } from "../../prompts/codegenPrompt.js";
import { writeCode } from "../../tools/implementations/writeCodeImpl.js";
import { writeCodeSchema } from "../../tools/schemas/writeCode.schema.js";
import { codegenTools } from "../../tools/toolsets/codegenTools.js";
export const generateCode = async (codegen_context: any) => {
  try {
    const response = await aiResponse(codegenPrompt(codegen_context), {
      tools: codegenTools(),
    });

    console.log(response);

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (!functionCall)
        throw new Error("No function call found in the response.");
      const { name, args } = functionCall;
      console.log(`Function to call: ${functionCall.name}`);
      console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);

      if (
        name === writeCodeSchema.name &&
        args &&
        args.path &&
        args.code &&
        args.description
      ) {
        await writeCode(
          args.path.toString(),
          args.code.toString(),
          args.description.toString()
        );
      }
    } else {
      throw new Error("No function call found in the response.");
    }
  } catch (err) {
    console.error(err);
  }
};
