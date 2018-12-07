import React from 'react';
import { getSearchIconByType, getSearchNameByType } from 'ebrc-client/App/Searches/SearchUtils';
import { IconAlt as Icon, Link, Mesa } from 'wdk-client/Components';

import './StudyMenu.scss';

class StudyMenuItem extends React.Component {
  constructor (props) {
    super(props);
    this.makeAppUrl = this.makeAppUrl.bind(this);
    this.renderSearchLink = this.renderSearchLink.bind(this);
  }

  makeAppUrl (url) {
    const { config } = this.props;
    const { webAppUrl } = config;
    return (webAppUrl ? webAppUrl : '') + (!url.indexOf('/') ? '' : '/') + url;
  }

  renderSearchLink ({ displayName, icon, name }) {
    const { study, config } = this.props;

    const url = `${config.webAppUrl}/showQuestion.do?questionFullName=${name}`;

    const tooltip = (<span>Search <b>{displayName}</b> in the {study.name} Study</span>);
    return (
      <Mesa.AnchoredTooltip
        fadeOut={true}
        content={tooltip}
        style={{ pointerEvents: 'none' }}>
        <a name={`Search ${displayName}`} href={url} key={name}>
          <i className={icon} />
        </a>
      </Mesa.AnchoredTooltip>
    );
  }

  render () {
    const { study } = this.props;
    const { name, disabled, route, searches } = study;
    const SearchLink = this.renderSearchLink;

    return (
      <div className={'row StudyMenuItem' + (disabled ? ' StudyMenuItem--disabled' : '')}>
        <div className="box StudyMenuItem-Name">
          <Link to={route} className="StudyMenuItem-RecordLink">
            {name}
            <Icon fa="angle-double-right" />
          </Link>
        </div>
        <div className="row StudyMenuItem-Links">
          {searches.map(({ name, displayName, icon }) => <SearchLink key={name} name={name} displayName={displayName} icon={icon} />)}
        </div>
      </div>
    )
  }
}

export default StudyMenuItem;
