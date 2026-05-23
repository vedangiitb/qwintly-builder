import { BuilderElement } from "./elements.js";
import { StyleConfig } from "./styleConfig.js";

export type PageConfig = {
  elements: BuilderElement[];
};

export type Snapshot = {
  routes: Record<string, PageConfig>;
  styleConfig: StyleConfig;
};
