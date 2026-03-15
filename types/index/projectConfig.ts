export interface ProjectConfig {
  framework: FrameworkConfig;
  runtime: RuntimeConfig;
  tooling: ToolingConfig;
}

export interface FrameworkConfig {
  name: string;
  router: string;
  language: string;
  styling: string;
  uiLibrary: string;
  stateManagement: string;
}

export interface RuntimeConfig {
  target: string;
  rendering: string;
  serverActions: string;
  apiRoutes: string;
  dataFetching: string;
}

export interface ToolingConfig {
  packageManager: string;
  linting: string;
  formatting: string;
  testing: string;
}
