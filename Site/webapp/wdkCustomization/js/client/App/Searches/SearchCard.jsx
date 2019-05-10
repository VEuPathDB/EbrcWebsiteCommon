import React from 'react';

import './SearchCard.scss';

import { IconAlt as Icon } from 'wdk-client/Components';
import { getBodyClassByType } from './SearchUtils';

class SearchCard extends React.Component {

  render () {
    const { card, prefix = '' } = this.props;
    const { icon, name, studyName, recordClassDisplayName, url, appUrl, description, disabled } = card;

    const href = typeof appUrl === 'string'
      ? prefix + appUrl
      : url;

    const bodyClass = getBodyClassByType(recordClassDisplayName);

    return (
      <div className={'Card LinkCard SearchCard ' + bodyClass + (disabled ? ' disabled' : '')}>
        <div className="box SearchCard-Header">
          <div className="box SearchCard-Icon">
            <i className={icon} />
          </div>
          <h2>{name}</h2>
          <h3>{recordClassDisplayName}</h3>
        </div>
        <div className="box SearchCard-Body">
          <p>{description}</p>
        </div>
        <a href={href} className="SearchCard-Footer">
          Explore Results <Icon fa={'chevron-circle-right'} />
        </a>
      </div>
    );
  }
}

export default SearchCard;
