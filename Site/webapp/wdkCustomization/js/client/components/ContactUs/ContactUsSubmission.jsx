import { Fragment } from 'react';

import {
  ContactUsSubmissionHeader,
  ContactUsSubmissionBody,
  ContactUsPreamble,
  ContactUsForm
} from '../../components';

const ContactUsSubmission = ({
  submissionStatus,
  responseMessage,
  updateSubject,
  updateReporterEmail,
  updateCcEmails,
  updateMessage,
  reporterEmailValidity,
  ccEmailsValidity,
  messageValidity,
  submitDetails
}) => (
  <Fragment>
    <ContactUsSubmissionHeader />
    <ContactUsSubmissionBody>
      <ContactUsPreamble />
      <ContactUsForm
        submissionStatus={submissionStatus}
        responseMessage={responseMessage}
        updateSubject={updateSubject}
        updateReporterEmail={updateReporterEmail}
        updateCcEmails={updateCcEmails}
        updateMessage={updateMessage}
        reporterEmailValidity={reporterEmailValidity}
        ccEmailsValidity={ccEmailsValidity}
        messageValidity={messageValidity}
        submitDetails={submitDetails}
      />
    </ContactUsSubmissionBody>
  </Fragment>
);

export default ContactUsSubmission;
