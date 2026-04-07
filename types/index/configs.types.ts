export interface ProjectConfigsConfig {
  frameworkConfig: ProjectConfigsFrameworkConfig;
  runtimeConfig: ProjectConfigsRuntimeConfig;
  toolingConfig: ProjectConfigsToolingConfig;
}

export interface ProjectConfigsFrameworkConfig {
  name: string;
  router: string;
  language: string;
  styling: string;
  ui: string;
  stateManagement: string;
}

export interface ProjectConfigsRuntimeConfig {
  target: string;
  rendering: string;
  serverActions: string;
  apiRoutes: string;
  dataFetching: string;
}

export interface ProjectConfigsToolingConfig {
  packageManager: string;
  linting: string;
  formatting: string;
  typecheck: string;
  testing: string;
}
