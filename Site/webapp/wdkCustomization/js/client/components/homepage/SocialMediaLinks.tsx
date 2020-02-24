import React, { useCallback } from 'react';

import { noop } from 'lodash';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { twitterUrl, facebookUrl, youtubeUrl } from 'ebrc-client/config';
import { Announcements, Twitter, Facebook, YouTube } from './SocialMediaIcons';

import './SocialMediaLinks.scss';

const cx = makeClassNameHelper('ebrc-SocialMediaLinks');

interface Props {
  showAnnouncementsToggle?: boolean;
  onShowAnnouncements?: () => void;
}

export const SocialMediaLinks = ({
  showAnnouncementsToggle = false,
  onShowAnnouncements = noop
}: Props) => {
  const onClickAnnouncementsToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onShowAnnouncements();
  }, [ showAnnouncementsToggle ]);

  return (
    <div className={cx()}>
      {
        showAnnouncementsToggle &&
        <a href="#" onClick={onClickAnnouncementsToggle}>
          <Announcements />
        </a>
      }

      <a href={twitterUrl} target="_blank">
        <Twitter />
      </a>

      <a href={facebookUrl} target="_blank">
        <Facebook />
      </a>

      <a href={youtubeUrl} target="_blank">
        <YouTube />
      </a>
    </div>
  );
};
