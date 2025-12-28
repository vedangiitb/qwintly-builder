export interface ProjectConventions {
  folderStructure: FolderStructureList;
  routingConventions: RoutingConventions;
  allowedShadcnComponents: AllowedShadcnComponents;
}

// Never change this
export interface FolderStructureList {
  folders: FolderStructure[];
}


// Never change this
export interface RoutingConventions {
  pagePattern: string;
  layoutPattern: string;
  defaultPage: string;
}

// Never change this
export interface AllowedShadcnComponents {
  components: ShadcnComponent[];
}

// Never change this
export interface ShadcnComponent {
  name: string;
  use: string;
  path: string;
}

// Never change this
export interface FolderStructure {
  name: string;
  role: string;
  description: string;
  allowed_operations: string[];
}
