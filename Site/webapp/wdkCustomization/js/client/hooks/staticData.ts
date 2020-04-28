import { useSelector } from 'react-redux';
import { RootState } from 'wdk-client/Core/State/Types';

export function useCommunitySiteUrl(): string | undefined {
  const communitySiteUrl = useSelector(
    (state: RootState) => state.globalData.siteConfig?.communitySite
  );

  return communitySiteUrl;
};

export function useDisplayName(): string | undefined {
  const displayName = useSelector(
    (state: RootState) => state.globalData.config?.displayName
  );

  return displayName;
};
