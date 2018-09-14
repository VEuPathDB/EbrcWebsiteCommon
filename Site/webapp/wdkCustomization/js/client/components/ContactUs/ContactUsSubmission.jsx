import { Fragment } from 'react';

import {
  ContactUsSubmissionHeader,
  ContactUsSubmissionBody,
  ContactUsPreamble,
  ContactUsForm
} from '../../components';

const ContactUsSubmission = ({
  submissionFailed,
  responseMessage,
  subjectValue,
  reporterEmailValue,
  ccEmailsValue,
  messageValue,
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
        submissionFailed={submissionFailed}
        responseMessage={responseMessage}
        subjectValue={subjectValue}
        reporterEmailValue={reporterEmailValue}
        ccEmailsValue={ccEmailsValue}
        messageValue={messageValue}
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
