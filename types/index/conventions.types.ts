export interface ProjectConventionsConfig {
  shadcn: ShadcnConventionsConfig;
  folderConventions: FolderConventionsConfig;
  importsConventions: ImportsConventionsConfig;
  routingConventions: RoutingConventionsConfig;
  namingConventions: NamingConventionsConfig;
  uiArchitecture: UIArchitectureConfig;
}

export interface ShadcnConventionsConfig {
  installed: readonly string[];
  location: string;
  notes: string;
}

export type FolderConventionsConfig = Record<string, string>;

export interface ImportsConventionsConfig {
  alias: string;
  order: readonly string[];
}

export interface RoutingConventionsConfig {
  required: readonly string[];
  requiredPerRoute: readonly string[];
  optionalPerRoute: readonly string[];
  routeGroups: string;
  dynamicSegments: string;
}

export interface NamingConventionsConfig {
  components: string;
  folders: string;
  hooks: string;
}

export interface UIArchitectureConfig {
  pattern: string;
  rule: readonly string[];
  configStructure: {
    root: string;
    elementTypes: Record<string, string>;
    rules: readonly string[];
  };
}
