import React from 'react';
import { useSelector } from 'react-redux';

import { get } from 'lodash';

import { RootState } from 'wdk-client/Core/State/Types';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { News } from 'ebrc-client/App/NewsSidebar';

import { combineClassNames } from './Utils';

const cx = makeClassNameHelper('ebrc-NewsPane');

import 'ebrc-client/App/Showcase/Showcase.scss';

import './NewsPane.scss';

type Props = {
  containerClassName?: string
};

export const NewsPane = ({ containerClassName }: Props) => {
  const twitterUrl = useSelector((state: RootState) => state.globalData.siteConfig && state.globalData.siteConfig.twitterUrl);
  const webAppUrl = useSelector((state: RootState) => state.globalData.siteConfig && state.globalData.siteConfig.webAppUrl);

  // FIXME: This is not typesafe
  const newsSidebarState = useSelector((state: RootState) => get(state, 'newsSidebar'));

  return (
    <aside className={combineClassNames(cx(), containerClassName)}>
      <div className="News-Section">
        <News
          twitterUrl={twitterUrl}
          webAppUrl={webAppUrl}
          {...newsSidebarState}
        />
      </div>
    </aside>
  );
};
