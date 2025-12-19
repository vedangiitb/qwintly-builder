export const ProjectRequestType = {
  NEW: "new",
  UPDATE: "update",
} as const;

export type ProjectRequestType =
  (typeof ProjectRequestType)[keyof typeof ProjectRequestType];
