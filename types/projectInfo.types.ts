interface Page {
  pageRoute: string;
  pageName: string;
  description: string;
}

export interface ProjectInfo {
  uiPages: Page[];
  lastUpdatedPlanVersion?: number;
}
