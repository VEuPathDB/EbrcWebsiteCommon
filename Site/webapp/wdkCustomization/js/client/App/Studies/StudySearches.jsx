import { constant } from 'lodash';
import React from 'react';
import { Mesa, Link } from 'wdk-client/Components';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';

import './StudySearches.scss';

const cx = makeClassNameHelper('StudySearchIconLinks');
const renderEmpty = constant(null);

export default function StudySearchIconLinks(props) {
  const {
    // Array of objects with question and recordClass
    entries = [],
    renderNotFound = renderEmpty,
  } = props;

  if (entries.length === 0) return renderNotFound();

  return (
    <div className={cx()}>
      {entries.map(({ question, recordClass }) => (
        <div key={question.fullName} className={cx('Item')}>
          <Mesa.AnchoredTooltip
            fadeOut
            content={<span>Search <strong>{recordClass.displayNamePlural}</strong></span>}
          >
            <Link to={`/search/${recordClass.urlSegment}/${question.urlSegment}`}>
              <i className={recordClass.iconName}/>
            </Link>
          </Mesa.AnchoredTooltip>
        </div>
      ))}
    </div>
  );
}
