import { aiResponse } from "../../infra/ai/gemini.client.js";
import { codegenPrompt } from "../../prompts/codegenPrompt.js";
import { readFileImpl } from "../../tools/implementations/readFileImpl.js";
import { writeCode } from "../../tools/implementations/writeCodeImpl.js";
import { writeCodeSchema } from "../../tools/schemas/writeCode.schema.js";
import { codegenTools } from "../../tools/toolsets/codegenTools.js";
import { CodegenContextInterface } from "../../types/codegenContext/codegenContext.js";

export const generateCode = async (
  codegen_context: CodegenContextInterface
) => {
  let agentContext = codegenPrompt(codegen_context);
  const MAX_ITERATIONS = 10;

  for (let step = 0; step < MAX_ITERATIONS; step++) {
    const response = await aiResponse(agentContext, {
      tools: codegenTools(),
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      throw new Error("No function call found in the response.");
    }

    const { name, args } = response.functionCalls[0];

    // -----------------------------
    // READ FILE
    // -----------------------------
    if (name === "read_file") {
      const { path } = args as { path: string };
      console.log("Reading file" + path);

      const fileContent = await readFileImpl(path);

      agentContext += `

==============================
FILE READ: ${path}
==============================
\`\`\`ts
${fileContent}
\`\`\`

`;

      continue;
    }

    // -----------------------------
    // INSPECT COMPONENT PROPS
    // -----------------------------

//     if (name === "inspect_component_props") {
//       const { path } = args;

//       const result = inspectComponentPropsImpl(path);

//       agentContext += `
  
// ==============================
// COMPONENT PROPS INSPECTION
// File: ${path}
// ==============================
// Component: ${result.component}

// Props:
// ${JSON.stringify(result.props, null, 2)}

// `;

//       continue;
//     }

    // -----------------------------
    // WRITE CODE (TERMINAL)
    // -----------------------------
    if (name === writeCodeSchema.name) {
      console.log("Writing code for file", args?.path?.toString());
      if (!args?.path || !args?.code || !args?.description) {
        throw new Error("Invalid write_code arguments.");
      }

      await writeCode(
        args.path.toString(),
        args.code.toString(),
        args.description.toString()
      );

      return;
    }

    throw new Error(`Unknown function call: ${name}`);
  }

  throw new Error("Codegen agent exceeded max iterations.");
};
