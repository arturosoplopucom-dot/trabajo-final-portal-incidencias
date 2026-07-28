export interface GlobalExecutionMetadata {
  executionId: string;
  date: string;
  sequence: string;
  rootPath: string;
  startedAt: string;
  environment: string;
}

export interface ScenarioExecutionPaths {
  root: string;
  screenshotsSteps: string;
  screenshotsFinal: string;
  screenshotsFailed: string;
  videos: string;
  downloads: string;
  logs: string;
  data: string;
  tempVideo: string;
}
