import { Fragment } from 'react';

import {
  ContactUsFinishedHeader,
  ContactUsSubmittedBody
} from '../../components';

const ContactUsFinished = ({ responseMessage }) => (
  <Fragment>
    <ContactUsFinishedHeader />
    <ContactUsSubmittedBody responseMessage={responseMessage} />
  </Fragment>
);

export default ContactUsFinished;
