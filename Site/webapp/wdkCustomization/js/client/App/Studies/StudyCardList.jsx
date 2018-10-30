import React from 'react';
import CardList from 'ebrc-client/App/Showcase/CardList';
import StudyCard from './StudyCard';

export default function StudyCardList(props) {
  const { list, isLoading, ...otherProps } = props;
  return (
    <CardList
      additionalClassName="StudyCardList"
      list={list}
      isLoading={isLoading}
      renderCard={(study, idx) =>
        <StudyCard key={idx} study={study} {...otherProps} />
      }
    />
  );
}
