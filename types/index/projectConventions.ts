export interface ProjectConventions {
  folderStructure: FolderStructureList;
  routingConventions: RoutingConventions;
  namingConventions: NamingConventions;
  componentConventions: ComponentConventions;
  stylingConventions: StylingConventions;
  importConventions: ImportConventions;
  frontendOnlyRules: FrontendOnlyRules;
  allowedShadcnComponents: AllowedShadcnComponents;
}

export interface FolderStructureList {
  folders: FolderStructure[];
}

export interface RoutingConventions {
  pagePattern: string;
  layoutPattern: string;
  defaultPage: string;
  templatePattern: string;
  loadingPattern: string;
  errorPattern: string;
  notFoundPattern: string;
  routeGroupPattern: string;
  dynamicSegmentPattern: string;
  catchAllSegmentPattern: string;
  optionalCatchAllSegmentPattern: string;
  apiRoutesAllowed: boolean;
}

export interface AllowedShadcnComponents {
  components: ShadcnComponent[];
}

export interface ShadcnComponent {
  name: string;
  use: string;
  path: string;
}

export interface FolderStructure {
  name: string;
  role: string;
  description: string;
  allowed_operations: string[];
  restrictions?: string[];
  typical_files?: string[];
}

export interface NamingConventions {
  components: string;
  hooks: string;
  files: string;
  folders: string;
  cssModules: string;
}

export interface ComponentConventions {
  componentFilePattern: string;
  preferredComponentType: string;
  propsTyping: string;
  clientDirectiveUsage: string;
}

export interface StylingConventions {
  approach: string;
  globalStyles: string;
  cssModulePattern: string;
  tailwindConfig: string;
}

export interface ImportConventions {
  pathAliases: Record<string, string>;
  importOrder: string[];
}

export interface FrontendOnlyRules {
  disallowedPatterns: string[];
  disallowedDirectories: string[];
  rationale: string;
}
