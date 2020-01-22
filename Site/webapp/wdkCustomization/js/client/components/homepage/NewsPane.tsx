import React, { useEffect, useState } from 'react';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { News } from 'ebrc-client/App/NewsSidebar';
import { communitySite, projectId, twitterUrl, webAppUrl } from 'ebrc-client/config';

import { SocialMediaControls } from './SocialMediaControls';
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
  containerClassName?: string,
  isNewsExpanded: boolean,
  toggleNews: () => void
};

export const NewsPane = ({ containerClassName, isNewsExpanded, toggleNews }: Props) => {
  const [ newsSidebarState, setNewsSidebarState ] = useState<NewsState>({ status: 'idle', news: null, error: null });

  useEffect(() => {
    let cancelLoading = false;

    setNewsSidebarState({ status: 'loading', ...newsSidebarState });

    fetch(`https://${communitySite}/${projectId}/news.json`, { mode: 'cors' }).then(res=> res.json()).then(
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
      <SocialMediaControls isNewsExpanded={isNewsExpanded} toggleNews={toggleNews} />
      {
        isNewsExpanded &&
        <div className="News-Section">
          <News
            twitterUrl={twitterUrl}
            webAppUrl={webAppUrl}
            {...newsSidebarState}
          />
        </div>
      }
    </aside>
  );
};
