export type PreflightErrorList = PreflightError[];

export type PreflightError = {
  type: "typescript" | "next" | "heuristic";
  filePath: string | null;
  message: string;
};
