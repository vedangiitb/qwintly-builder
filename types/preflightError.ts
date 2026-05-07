export type PreflightErrorList = PreflightError[];

export type PreflightError = {
  type: "typescript" | "next" | "heuristic" | "ui-config";
  filePath: string | null;
  message: string;
};
