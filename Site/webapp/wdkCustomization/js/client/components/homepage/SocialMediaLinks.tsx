import React from 'react';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { twitterUrl, facebookUrl, youtubeUrl } from 'ebrc-client/config';
import { Twitter, Facebook, YouTube } from './SocialMediaIcons';

import './SocialMediaLinks.scss';

const cx = makeClassNameHelper('ebrc-SocialMediaLinks');

export const SocialMediaLinks = () =>
  <div className={cx()}>
    <a href={twitterUrl} target="_blank">
      <Twitter />
    </a>

    <a href={facebookUrl} target="_blank">
      <Facebook />
    </a>

    <a href={youtubeUrl} target="_blank">
      <YouTube />
    </a>
  </div>;