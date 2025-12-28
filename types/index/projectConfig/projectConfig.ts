export interface ProjectConfig {
  framework: FrameWorkConfig;
}

interface FrameWorkConfig {
  framework: string;
  styling: string;
  uiLibrary: string;
  stateManagement: string;
}
