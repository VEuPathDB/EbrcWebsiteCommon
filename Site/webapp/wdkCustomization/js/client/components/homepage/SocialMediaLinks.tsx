import React from 'react';

import { Link, IconAlt } from 'wdk-client/Components';

import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { twitterUrl, facebookUrl, youtubeUrl } from 'ebrc-client/config';
import { Twitter, Facebook, YouTube, ContactUs } from './SocialMediaIcons';

import './SocialMediaLinks.scss';

const cx = makeClassNameHelper('ebrc-SocialMediaLinks');

type SocialMediaLinksProps = {
  showNewsIcon?: boolean,
  onNewsIconClick?: () => void
};

export const SocialMediaLinks = ({
  showNewsIcon = false,
  onNewsIconClick
}: SocialMediaLinksProps) =>
  <div className={cx()}>
    {
      showNewsIcon &&
      <button onClick={onNewsIconClick} className="link">
        <IconAlt fa="newspaper-o" />
        <span>News</span>
        <span>Tweets</span>
      </button>
    }

    <Link to="/contact-us" target="_blank">
      <ContactUs />
    </Link>

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