import React from 'react';
import PropTypes from 'prop-types';
import { RealTimeSearchBox } from 'wdk-client/Components';

import PlaceholderCard from './PlaceholderCard';

const CLASS_NAME = 'CardList';

const EXPANDED_CLASS_NAME = `${CLASS_NAME}_Expanded`;
const LOADING_CLASS_NAME = `${CLASS_NAME}_Loading`;
const EMPTY_CLASS_NAME = `${CLASS_NAME}_Empty`;

const LIST_CLASS_NAME = `${CLASS_NAME}__Entries`;
const SPINNER_CLASS_NAME = `${CLASS_NAME}__Spinner`;
const EMPTY_INDICATOR_CLASS_NAME = `${CLASS_NAME}__EmptyIndicator`;
const EXPAND_BUTTON_CLASS_NAME = `${CLASS_NAME}__ExpandButton link`;
const FILTER_CLASS_NAME = `${CLASS_NAME}__FilterInput`;

export default function CardList(props) {
  const { additionalClassName, isLoading, list, renderCard, isExpandable, contentNamePlural, getSearchStringForItem = () => '' } = props;

  // state
  const [ isExpanded, setIsExpanded ] = React.useState(null);
  const [ filterString, setFilterString ] = React.useState(null);

  // save state to session storage
  React.useEffect(() => {
    const isExpandedStorageKey = `${additionalClassName}__isExpanded`;
    const filterStringStorageKey = `${additionalClassName}__filterString`;

    if (isExpanded == null) {
      const initialIsExpanded = sessionStorage.getItem(isExpandedStorageKey);
      setIsExpanded(initialIsExpanded === 'true');
    }
    else {
      sessionStorage.setItem(isExpandedStorageKey, isExpanded ? 'true' : 'false');
    }

    if (filterString == null) {
      const initialFilterString = sessionStorage.getItem(filterStringStorageKey);
      setFilterString(initialFilterString || '');
    }
    else {
      sessionStorage.setItem(filterStringStorageKey, filterString);
    }

  }, [ isExpanded, filterString, additionalClassName ]);

  if (filterString == null || isExpanded == null) return null;

  const isEmpty = list != null && list.length === 0;
  const className = `${CLASS_NAME} ${isLoading ? LOADING_CLASS_NAME : ''} ` +
    `${isEmpty ? EMPTY_CLASS_NAME : ''} ` +
    `${isExpandable && isExpanded ? EXPANDED_CLASS_NAME : ''} ${additionalClassName}`;

  const cardElements = list == null || isEmpty || isLoading
    ? Array(5).fill(null).map((_, index) => <PlaceholderCard key={index}/>)
    : list
    .filter(item => {
      if (!isExpandable || !isExpanded) return true;
      const searchString = getSearchStringForItem(item);
      return searchString.toLowerCase().includes(filterString.toLowerCase());
    })
    .map((item, index) => renderCard(item, index));

  const cardList = cardElements.length > 0
    ? <div className={LIST_CLASS_NAME}>{cardElements}</div>
    : (
      <React.Fragment>
        <h3>Nothing matched your search</h3>
        <div>Try another search or <button type="button" className="link" onClick={() => setFilterString('')}>view all {contentNamePlural}</button>.</div>
      </React.Fragment>
    );

  const loadingIndicator = isLoading &&
    <div className={SPINNER_CLASS_NAME}>
      <i className="fa fa-circle-o-notch fa-spin fa-fw"></i>
      <span className="sr-only">Loading...</span>
    </div>;

  const emptyIndicator = isEmpty &&
    <div className={EMPTY_INDICATOR_CLASS_NAME}>
      Data is not available for this section.
    </div>

  const buttonTitle = isExpanded
    ? `Hide expanded view and list all ${contentNamePlural} horizontally`
    : `Show expanded view and search for specific ${contentNamePlural}`
  const expandButton = isExpandable &&
    <button type="button" className={EXPAND_BUTTON_CLASS_NAME} onClick={() => setIsExpanded(!isExpanded)} title={buttonTitle}>
      {isExpanded
        ? <React.Fragment><i className="fa fa-ellipsis-h" aria-hidden="true"></i> Condensed view</React.Fragment>
        : <React.Fragment><i className="fa fa-th" aria-hidden="true"></i> Expanded view</React.Fragment>
      }
    </button>

  const filterInput = isExpandable &&
    <RealTimeSearchBox
      autoFocus
      className={FILTER_CLASS_NAME}
      searchTerm={filterString}
      onSearchTermChange={setFilterString}
      placeholderText={`Find ${contentNamePlural}`}
      helpText={`Find ${contentNamePlural} by searching the visible content.`}
    />

  return (
    <div className={className}>
      {filterInput}
      {expandButton}  
      {cardList}
      {loadingIndicator}
      {emptyIndicator}
    </div>
  );
}

CardList.propTypes = {
  renderCard: PropTypes.func.isRequired,
  additionalClassName: PropTypes.string,
  isLoading: PropTypes.bool,
  list: PropTypes.array,
  isExpandable: PropTypes.bool,
  isExpanded: PropTypes.bool,
  filterString: PropTypes.string,
  contentNamePlural: PropTypes.string,
  getSearchStringForItem: PropTypes.func
}
