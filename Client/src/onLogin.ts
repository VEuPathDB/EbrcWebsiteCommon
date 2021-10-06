import { WdkDependencies } from '@veupathdb/wdk-client/lib/Hooks/WdkDependenciesEffect';
import { Task } from '@veupathdb/wdk-client/lib/Utils/Task';

import { AnalysisClient } from '@veupathdb/eda/lib/core';

import { useEda } from './config';
import { edaServiceUrl } from './routes';

export const onLogin = !useEda
  ? undefined
  : function({ wdkService }: WdkDependencies, guestUserId: number) {
      return Task.fromPromise(
        () => AnalysisClient
          .getClient(edaServiceUrl, wdkService)
          .transferGuestAnalyses(guestUserId)
      );
    };
