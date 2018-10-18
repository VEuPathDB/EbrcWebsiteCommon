import { Fragment } from 'react';

import {
  ContactUsSubmissionHeader,
  ContactUsPreamble,
  ContactUsForm,
  SupportFormBody
} from '../../components';

const ContactUsSubmission = ({
  submitDisabled,
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
  changeFile,
  addFile,
  removeFile,
  reporterEmailValidity,
  ccEmailsValidity,
  messageValidity,
  validatedAttachmentMetadata,
  submitDetails
}) => (
  <Fragment>
    <ContactUsSubmissionHeader />
    <SupportFormBody>
      <ContactUsPreamble />
      <ContactUsForm
        submitDisabled={submitDisabled}
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
        changeFile={changeFile}
        addFile={addFile}
        removeFile={removeFile}
        reporterEmailValidity={reporterEmailValidity}
        ccEmailsValidity={ccEmailsValidity}
        messageValidity={messageValidity}
        validatedAttachmentMetadata={validatedAttachmentMetadata}
        submitDetails={submitDetails}
      />
    </SupportFormBody>
  </Fragment>
);

export default ContactUsSubmission;
