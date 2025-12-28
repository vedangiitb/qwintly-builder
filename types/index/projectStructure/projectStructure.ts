export interface ProjectStructure {
  pages: Page[];
  components: Page[];
  hooks: Page[];
  infra: Page[];
  lib: Page[];
  services: Page[];
  utils: Page[];
}

export interface Page {
  name: string;
  path: string;
  description: string;
}
