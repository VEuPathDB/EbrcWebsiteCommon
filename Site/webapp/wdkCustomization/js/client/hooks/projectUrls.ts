import { useWdkService } from "wdk-client/Hooks/WdkServiceHook";

export type ProjectUrls = {
  [K in string]?: string;
}

export function useProjectUrls() {
  return useWdkService(async wdkService => {
    const config = await wdkService.getConfig();
    const projectUrls = ((config as any).projectUrls || {}) as ProjectUrls;
    return projectUrls;
  })
}