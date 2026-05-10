import { BuilderElement } from "./elements.js";

export type PageConfig = {
  elements: BuilderElement[];
};

export type Snapshot = {
  routes: Record<string, PageConfig>;
};
