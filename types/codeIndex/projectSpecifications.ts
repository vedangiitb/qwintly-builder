export interface projectSpecifications {
  projectInfo: projectInfo;
  projectType: projectType;
  technicalDetails: technicalDetails;
  routingConventions: routingConventions;
  uiComponents: uiComponents
}

interface projectInfo {
  name: string;
  description: string;
  targetUsers: string;
}

interface projectType {
  category: string;
  rendering: string;
  interactivityLevel: string;
}

interface technicalDetails {
  framework: string;
  router: string;
  language: string;
  styling: string;
  uiLibrary: string;
  stateManagement: string;
}

interface routingConventions {
  pagePattern: string;
  layoutPattern: string;
  defaultPage: string;
}

interface uiComponents {
  [key: string]: allowedUiComponent;
}

// shadcn components
interface allowedUiComponent {
  source: string;
  file: string;
}
