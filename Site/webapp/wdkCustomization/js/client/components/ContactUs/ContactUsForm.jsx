import React from 'react';
import ContactUsAttachments from './ContactUsAttachments';
import ContactUsFooter from './ContactUsFooter';
import SupportFormField from '../SupportForm/SupportFormField';
import ValidatedInput from '../ValidatedInput';
import ValidatedTextArea from '../ValidatedTextArea';

const ContactUsForm = ({
  submitDisabled,
  submissionFailed,
  responseMessage,
  subjectValue,
  reporterEmailValue,
  ccEmailsValue,
  messageValue,
  reporterEmailValidity,
  ccEmailsValidity,
  messageValidity,
  validatedAttachmentMetadata,
  updateSubject,
  updateReporterEmail,
  updateCcEmails,
  updateMessage,
  changeFile,
  addFile,
  removeFile,
  submitDetails
}) => (
  <form onSubmit={event => {
    event.preventDefault();
    submitDetails();
  }}>
    <table>
      <tbody>
          <SupportFormField
            label="Subject:"
            inputElement={
              <ValidatedInput
                type="text"
                value={subjectValue}
                onChange={updateSubject} 
                size={80} 
              />
            }
          />
          <SupportFormField
            label="Your email address:"
            inputElement={
              <ValidatedInput
                type="text"
                value={reporterEmailValue}
                validity={reporterEmailValidity}
                onChange={updateReporterEmail} 
                size={80} 
              />
            }
          />
          <SupportFormField
            label="Cc addresses:"
            inputElement={
              <ValidatedInput
                type="text"
                value={ccEmailsValue}
                validity={ccEmailsValidity}
                onChange={updateCcEmails} 
                size={80} 
              />
            }
          />
          <SupportFormField
            label="Attachments:"
            inputElement={
              <ContactUsAttachments
                changeFile={changeFile}
                addFile={addFile}
                removeFile={removeFile}
                validatedAttachmentMetadata={validatedAttachmentMetadata}
              />
            }
          />
          <SupportFormField
            label="Message:"
            inputElement={
              <ValidatedTextArea
                value={messageValue}
                validity={messageValidity}
                onChange={updateMessage} 
                rows={8} 
                cols={80}
            />
            }
          />
  {/*     <SupportFormField
            label="Attachments:"
            inputElement={
              <ContactUsAttachments
                changeFile={changeFile}
                addFile={addFile}
                removeFile={removeFile}
                validatedAttachmentMetadata={validatedAttachmentMetadata}
              />
            }
          />
    */}       <ContactUsFooter 
            submitDisabled={submitDisabled}
            submissionFailed={submissionFailed}
            responseMessage={responseMessage}
          />
      </tbody>
    </table>
  </form>
);

export default ContactUsForm;
