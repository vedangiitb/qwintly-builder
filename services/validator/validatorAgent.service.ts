import { GenerateContentResponse } from "@google/genai";
import { aiResponse } from "../../infra/ai/gemini.client.js";
import { validatorPrompt } from "../../prompts/validatorPrompt.js";
import { validatorTools } from "../../tools/toolsets/validatorTools.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { PreflightErrorList } from "../../types/preflightError.js";
import { ValidatorAgentHistory } from "../../types/validatorAgentHistory.js";
import { readFileImpl } from "../../tools/implementations/readFileImpl.js";
import { ReadFileSchema } from "../../tools/schemas/readFile.schema.js";
import { writeCodeSchema } from "../../tools/schemas/writeCode.schema.js";
import { writeCode } from "../../tools/implementations/writeCodeImpl.js";
import { FinishTaskSchema } from "../../tools/schemas/finishTask.schema.js";
import { getJobContext } from "../../job/jobContext.js";
import { logger } from "../logger/logger.service.js";

export const validatorAgent = async (
  errors: PreflightErrorList,
  history: ValidatorAgentHistory,
  codeIndex: CodeIndex
): Promise<ValidatorAgentHistory> => {
  const ctx = getJobContext();
  const MAX_STEPS = 6;
  let steps = 0;
  let newHistory: ValidatorAgentHistory = [...history];

  const contents: any[] = [
    {
      role: "user",
      parts: [
        {
          text: validatorPrompt(errors, history, codeIndex),
        },
      ],
    },
  ];

  const readFiles = new Map<string, string>();

  while (steps < MAX_STEPS) {
    steps++;
    const response: GenerateContentResponse = await aiResponse(contents, {
      tools: validatorTools(),
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      throw new Error("No function call found in the response.");
    }

    const { name, args } = response.functionCalls[0];
    logger.info(`Validator agent tool call: ${name}`);

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
      const { path } = args as { path: string };
      logger.info(`Validator agent reading file "${path}"`);
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
                path,
                content,
              },
            },
          },
        ],
      });

      continue;
    }

    // -----------------------------
    // WRITE CODE (TERMINAL)
    // -----------------------------
    if (name === writeCodeSchema.name) {
      const targetPath = args?.path?.toString();
      logger.info(`Validator agent writing code to "${targetPath}"`);
      if (!args?.path || !args?.code || !args?.description) {
        throw new Error("Invalid write_code arguments.");
      }
      logger.info(
        `Validator agent write description: ${args.description
          .toString()
          .slice(0, 500)}`,
      );

      newHistory.push({
        file: args.path.toString(),
        fix: args.description.toString(),
      });

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
              response: { ok: true },
            },
          },
        ],
      });
    }

    // -----------------------------
    // END OF CONVERSATION
    // -----------------------------
    if (name === FinishTaskSchema.name) {
      logger.info("Validation finished");
      break;
    }
  }

  return newHistory;
};
