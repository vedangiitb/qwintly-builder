interface PageSection {
  sectionName: string;
  description: string;
}

interface Page {
  pageRoute: string;
  pageName: string;
  description: string;
  requiresAuth?: boolean;
  rolesAllowed?: string[];
  sections?: PageSection[];
}

export interface ProjectInfo {
  uiPages: Page[];
  globalFeatures?: {
    authenticationEnabled: boolean;
    paymentsEnabled: boolean;
    seoEnabled: boolean;
    integrations: string[];
  };
  lastUpdatedPlanVersion?: number;
}

// TODO: Change this with real ProjectInfo for the boilerplate project once generation of projectInfo is handled in backend
export const defaultProjectInfo: ProjectInfo = {
  uiPages: [
    {
      pageRoute: "/",
      pageName: "Home",
      description: "Starter homepage scaffold with placeholder content blocks.",
      sections: [
        {
          sectionName: "Hero",
          description: "Basic value proposition and primary call-to-action.",
        },
        {
          sectionName: "Content",
          description: "Placeholder section for product or business details.",
        },
        {
          sectionName: "Footer",
          description:
            "Simple footer with placeholder navigation and legal links.",
        },
      ],
    },
  ],
  globalFeatures: {
    authenticationEnabled: false,
    paymentsEnabled: false,
    seoEnabled: false,
    integrations: [],
  },
  lastUpdatedPlanVersion: 0,
};
