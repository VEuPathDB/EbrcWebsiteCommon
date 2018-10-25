import React from 'react';
import CardList from 'ebrc-client/App/Showcase/CardList';

import SearchCard from './SearchCard';

export default function SearchCardList(props) {
  const { list, prefix, studies, isLoading } = props;
  return (
    <CardList
      additionalClassName="SearchCardList"
      isLoading={isLoading}
      list={list}
      renderCard={(search, idx) =>
        <SearchCard search={search} prefix={prefix} studies={studies} key={idx} />
      }
    />
  );
}
