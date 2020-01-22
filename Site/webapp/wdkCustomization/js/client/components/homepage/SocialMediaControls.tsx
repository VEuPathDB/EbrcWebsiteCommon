import React from 'react';

import { IconAlt } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import { SocialMediaLinks } from 'ebrc-client/components/homepage/Footer';
import { combineClassNames } from 'ebrc-client/components/homepage/Utils';

import './SocialMediaControls.scss';

type Props = {
  isNewsExpanded: boolean,
  toggleNews: () => void
};

const cx = makeClassNameHelper('ebrc-SocialMediaControls');

export const SocialMediaControls = ({ isNewsExpanded, toggleNews }: Props) => {
  const newsToggleClassName = combineClassNames(
    cx('NewsToggle'),
    'link'
  );

  return (
    <div className={cx('', isNewsExpanded ? 'news-expanded' : 'news-collapsed')}>
      {
        isNewsExpanded &&
        <button type="button" className={newsToggleClassName} onClick={toggleNews}>
          <span>News</span>
          <IconAlt 
            fa="angle-double-right"
          />
        </button>
      }
      <SocialMediaLinks showNewsIcon={!isNewsExpanded} onNewsIconClick={toggleNews} />
    </div>
  );
};
