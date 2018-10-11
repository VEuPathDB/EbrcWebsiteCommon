import {
  ContactUsFooter,
  SupportFormField,
  ValidatedInput,
  ValidatedTextArea
} from '../../components';

const ContactUsForm = ({
  submissionFailed,
  responseMessage,
  subjectValue,
  reporterEmailValue,
  ccEmailsValue,
  messageValue,
  reporterEmailValidity,
  ccEmailsValidity,
  messageValidity,
  updateSubject,
  updateReporterEmail,
  updateCcEmails,
  updateMessage,
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
                size={81} 
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
                size={81} 
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
                size={81} 
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
                cols={75}
              />
            }
          />
          <ContactUsFooter 
            submissionFailed={submissionFailed}
            responseMessage={responseMessage}
          />
      </tbody>
    </table>
  </form>
);

export default ContactUsForm;
