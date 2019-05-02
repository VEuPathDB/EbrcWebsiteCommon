import React, { Fragment } from 'react';

import {
  ContactUsFinishedHeader,
  ContactUsSubmittedBody
} from '../../components';

const ContactUsFinished = ({ message }) => (
  <Fragment>
    <ContactUsFinishedHeader />
    <ContactUsSubmittedBody message={message} />
  </Fragment>
);

export default ContactUsFinished;
