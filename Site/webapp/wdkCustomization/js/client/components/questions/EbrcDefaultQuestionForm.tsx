import React from 'react';

import { Loading } from 'wdk-client/Components';
import DefaultQuestionForm, { Props } from 'wdk-client/Views/Question/DefaultQuestionForm';

import { useEbrcDescription } from './EbrcDescription';

export const EbrcDefaultQuestionForm = (props: Props) => {
  const { descriptionLoading, DescriptionComponent } = useEbrcDescription(props.state.question);

  return descriptionLoading
    ? <Loading />
    : (
      <DefaultQuestionForm 
        {...props}
        DescriptionComponent={DescriptionComponent}
      />
    );
};
