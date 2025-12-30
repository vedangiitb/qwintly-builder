export type PreflightErrorList = PreflightError[];

export type PreflightError = {
  type: "typescript" | "eslint" | "next" | "heuristic";
  filePath: string | null;
  message: string;
};
