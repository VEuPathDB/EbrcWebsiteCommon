import React from 'react';
import CardList from 'ebrc-client/App/Showcase/CardList';

import ImageCard from './ImageCard';

export default function ImageCardList(props) {
  const { list, prefix, isLoading } = props;
  return (
    <CardList
      additionalClassName="ImageCardList"
      isLoading={isLoading}
      list={list}
      renderCard={(card, idx) =>
        <ImageCard card={card} prefix={prefix} key={idx} />
      }
    />
  );
}
