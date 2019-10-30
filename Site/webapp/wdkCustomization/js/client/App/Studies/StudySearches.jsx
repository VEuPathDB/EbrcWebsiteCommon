import './StudySearches.scss';

import { constant } from 'lodash';
import React from 'react';
import { Mesa } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/ComponentUtils';

const cx = makeClassNameHelper('StudySearchIconLinks');
const renderEmpty = constant(null);

export default function StudySearchIconLinks(props) {
  const {
    study,
    renderNotFound = renderEmpty,
    webAppUrl
  } = props;

  if (study == null) return renderNotFound();

  return (
    <div className={cx()}>
      {study.searches.map(({ icon, displayName, name }) => (
        <div key={name} className={cx('Item')}>
          <Mesa.AnchoredTooltip
            fadeOut
            content={<span>Search <strong>{displayName}</strong></span>}
          >
            <a href={`${webAppUrl}/showQuestion.do?questionFullName=${name}`}>
              <i className={icon}/>
            </a>
          </Mesa.AnchoredTooltip>
        </div>
      ))}
    </div>
  );
}
