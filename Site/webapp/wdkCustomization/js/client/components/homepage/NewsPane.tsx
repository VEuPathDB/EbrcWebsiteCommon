import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { useWdkEffect } from 'wdk-client/Service/WdkService';
import { RootState } from 'wdk-client/Core/State/Types';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { News } from 'ebrc-client/App/NewsSidebar';
import { communitySite } from 'ebrc-client/config';

import { SocialMediaLinks } from './Footer';
import { combineClassNames } from './Utils';

import 'ebrc-client/App/Showcase/Showcase.scss';

import './NewsPane.scss';

const cx = makeClassNameHelper('ebrc-NewsPane');

type NewsState =
  | {
      status: 'idle',
      news: any,
      error: any
    }
  | {
      status: 'loading',
      news: any,
      error: any
    };

type Props = {
  containerClassName?: string
};

export const NewsPane = ({ containerClassName }: Props) => {
  const twitterUrl = useSelector((state: RootState) => state.globalData.siteConfig && state.globalData.siteConfig.twitterUrl);
  const webAppUrl = useSelector((state: RootState) => state.globalData.siteConfig && state.globalData.siteConfig.webAppUrl);

  const [ newsSidebarState, setNewsSidebarState ] = useState<NewsState>({ status: 'idle', news: null, error: null });

  useWdkEffect(wdkService => {
    let cancelLoading = false;

    setNewsSidebarState({ status: 'loading', ...newsSidebarState });

    fetch(`${communitySite}/${projectId}/news.json`, { mode: 'cors' }).then(res=> res.json()).then(
      news => {
        if (!cancelLoading) {
          setNewsSidebarState({ status: 'idle', news, error: null });
        }
      },
      error => {
        if (!cancelLoading) {
          setNewsSidebarState({ status: 'idle', news: null, error });
        }
      }
    );

    return () => {
      cancelLoading = true;
    };
  }, []);

  return (
    <aside className={combineClassNames(cx(), containerClassName)}>
      <div className={cx('SocialMediaLinksContainer')}>
        <SocialMediaLinks />
      </div>
      <div className="News-Section">
        {/* FIXME: Pass the Jekyll newsUrl */}
        <News
          twitterUrl={twitterUrl}
          webAppUrl={webAppUrl}
          {...newsSidebarState}
        />
      </div>
    </aside>
  );
};
