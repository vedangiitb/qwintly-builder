interface PageSection {
  sectionName: string;
  description: string;
}

interface Page {
  pageRoute: string;
  pageName: string;
  description: string;
  sections?: PageSection[];
}

export interface ProjectInfo {
  uiPages: Page[];
  lastUpdatedPlanVersion?: number;
}
