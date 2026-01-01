import { aiResponse } from "../../infra/ai/gemini.client.js";
import { JobContext } from "../../job/jobContext.js";
import { codegenPrompt } from "../../prompts/codegenPrompt.js";
import { readFileImpl } from "../../tools/implementations/readFileImpl.js";
import { writeCode } from "../../tools/implementations/writeCodeImpl.js";
import { ReadFileSchema } from "../../tools/schemas/readFile.schema.js";
import { writeCodeSchema } from "../../tools/schemas/writeCode.schema.js";
import { codegenTools } from "../../tools/toolsets/codegenTools.js";
import { CodegenContextInterface } from "../../types/codegenContext/codegenContext.js";

export const generateCode = async (
  ctx: JobContext,
  codegen_context: CodegenContextInterface
) => {
  // let agentContext = codegenPrompt(codegen_context);
  const contents: any[] = [
    {
      role: "user",
      parts: [
        {
          text: codegenPrompt(codegen_context),
        },
      ],
    },
  ];
  const MAX_ITERATIONS = 10;

  const readFiles = new Map<string, string>();

  for (let step = 0; step < MAX_ITERATIONS; step++) {
    const response = await aiResponse(contents, {
      tools: codegenTools(),
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      throw new Error("No function call found in the response.");
    }

    const { name, args } = response.functionCalls[0];

    contents.push({
      role: "assistant",
      parts: [
        {
          functionCall: {
            name,
            args,
          },
        },
      ],
    });

    // -----------------------------
    // READ FILE
    // -----------------------------
    if (name === ReadFileSchema.name) {
      try {
        const { path } = args as { path: string };
        console.log("Generate code agent: Reading file", path);

        let content: string;
        if (readFiles.has(path)) {
          content = readFiles.get(path)!;
        } else {
          content = await readFileImpl(ctx, path);
          readFiles.set(path, content);
        }

        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: true,
                  data: { path, content },
                },
              },
            },
          ],
        });

        continue;
      } catch (err: any) {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: false,
                  error: {
                    type: "READ_FILE_FAILED",
                    message: err?.message ?? String(err),
                    retryable: false,
                  },
                },
              },
            },
          ],
        });

        continue;
      }
    }

    // -----------------------------
    // WRITE CODE (TERMINAL)
    // -----------------------------
    if (name === writeCodeSchema.name) {
      console.log("calling write code function")
      try {
        if (!args?.path || !args?.code || !args?.description) {
          throw new Error("Missing required arguments");
        }

        await writeCode(
          ctx,
          args.path.toString(),
          args.code.toString(),
          args.description.toString()
        );

        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: true,
                },
              },
            },
          ],
        });

        return;
      } catch (err: any) {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  ok: false,
                  error: {
                    type: "WRITE_CODE_FAILED",
                    message: err?.message ?? String(err),
                    retryable: false,
                  },
                },
              },
            },
          ],
        });

        return;
      }
    }

    throw new Error(`Unknown function call: ${name}`);
  }

  throw new Error("Codegen agent exceeded max iterations.");
};
