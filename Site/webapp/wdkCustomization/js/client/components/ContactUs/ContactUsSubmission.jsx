import { Fragment } from 'react';

import {
  ContactUsSubmissionHeader,
  ContactUsPreamble,
  ContactUsForm,
  SupportFormBody
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
    <SupportFormBody>
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
    </SupportFormBody>
  </Fragment>
);

export default ContactUsSubmission;
