export const PROJECT_TYPE = {
  LANDING_PAGE: "landing_page",
  SAAS: "saas",
  PORTFOLIO: "portfolio",
  ECOMMERCE: "ecommerce",
  HOBBY: "hobby",
};

export type ProjectType = (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE];

export const BUSINESS_MODEL = {
  SUBSCRIPTION: "subscription",
  ONE_TIME: "one-time",
  LEAD_GEN: "lead-gen",
  FREE: "free",
};

export type BusinessModel =
  (typeof BUSINESS_MODEL)[keyof typeof BUSINESS_MODEL];

export const TONE = {
  MODERN: "modern",
  MINIMAL: "minimal",
  PLAYFUL: "playful",
  TECHNICAL: "technical",
  CASUAL: "casual",
  VINTAGE: "vintage",
};

export type Tone = (typeof TONE)[keyof typeof TONE];

export interface ProjectIdentity {
  projectName: string;
  projectType: ProjectType;
  description: string;
}

export interface TargetBusinessContext {
  targetAudience: string;
  businessModel: BusinessModel;
  industry: string;
  geography: string;
}

export interface Branding {
  tone: Tone;
  brandKeywords: string[];
  colorPreference: string[];
  designStyle: string;
}

export interface FunctionalRequirements {
  authenticationRequired: boolean;
  roles: string[];
  paymentRequired: boolean;
  integrations: string[];
  dashboardRequired: boolean;
}

export interface Constraints {
  budgetConstraints: string;
  timeline: string;
  performanceRequirements: string;
  seoRequired: boolean;
}

export interface CollectedContext {
  projectIdentity: ProjectIdentity;
  targetBusinessContext: TargetBusinessContext;
  branding: Branding;
  functionalRequirements: FunctionalRequirements;
  constraints: Constraints;
  otherInfo: string[];
}

export const defaultCollectedContext: CollectedContext = {
  projectIdentity: {
    projectName: "",
    projectType: "landing_page",
    description: "",
  },
  targetBusinessContext: {
    targetAudience: "",
    businessModel: "free",
    industry: "",
    geography: "",
  },
  branding: {
    tone: "modern",
    brandKeywords: [],
    colorPreference: [],
    designStyle: "",
  },
  functionalRequirements: {
    authenticationRequired: false,
    roles: [],
    paymentRequired: false,
    integrations: [],
    dashboardRequired: false,
  },
  constraints: {
    budgetConstraints: "",
    timeline: "",
    performanceRequirements: "",
    seoRequired: false,
  },
  otherInfo: [],
};
