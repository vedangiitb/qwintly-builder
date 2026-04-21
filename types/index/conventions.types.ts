export interface ProjectConventionsConfig {
  shadcn: ShadcnConventionsConfig;
  folderConventions: FolderConventionsConfig;
  importsConventions: ImportsConventionsConfig;
  routingConventions: RoutingConventionsConfig;
  namingConventions: NamingConventionsConfig;
  componentConventions: ComponentConventionsConfig;
  stylingConventions: StylingConventionsConfig;
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

export interface ComponentConventionsConfig {
  type: string;
  exports: string;
  propsTyping: string;
  usage: string;
}

export interface StylingConventionsConfig {
  default: string;
  globals: string;
  helper: string;
}

export interface UIArchitectureConfig {
  pattern: string;
  rule: readonly string[];
  configStructure: {
    root: string;
    elementTypes: {
      text: string;
      container: string;
    };
    rules: readonly string[];
  };
}
