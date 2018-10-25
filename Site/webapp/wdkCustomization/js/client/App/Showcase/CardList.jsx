import React from 'react';
import PropTypes from 'prop-types';

import PlaceholderCard from './PlaceholderCard';

const CLASS_NAME = 'CardList';
const LOADING_CLASS_NAME = `${CLASS_NAME}_Loading`;
const EMPTY_CLASS_NAME = `${CLASS_NAME}_Empty`;
const SPINNER_CLASS_NAME = `${CLASS_NAME}__Spinner`;
const EMPTY_INDICATOR_CLASS_NAME = `${CLASS_NAME}__EmptyIndicator`;

export default function CardList(props) {
  const { additionalClassName, isLoading, list, renderCard } = props;
  const isEmpty = list != null && list.length === 0;
  const className = `${CLASS_NAME} ${isLoading ? LOADING_CLASS_NAME : ''} ${isEmpty ? EMPTY_CLASS_NAME : ''} ${additionalClassName}`;

  const cardList = list == null || isEmpty || isLoading
    ? Array(5).fill(null).map((_, index) => <PlaceholderCard key={index}/>)
    : list.map((item, index) => renderCard(item, index));

  const loadingIndicator = isLoading &&
    <div className={SPINNER_CLASS_NAME}>
      <i className="fa fa-circle-o-notch fa-spin fa-fw"></i>
      <span className="sr-only">Loading...</span>
    </div>;

  const emptyIndicator = isEmpty &&
    <div className={EMPTY_INDICATOR_CLASS_NAME}>
      Data is not available for this section.
    </div>

  return (
    <div className={className}>
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
}
