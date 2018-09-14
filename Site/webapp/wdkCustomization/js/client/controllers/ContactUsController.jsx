import { flow } from 'lodash';

import { WdkPageController } from 'wdk-client/Controllers';

import { 
  updateField, 
  submitDetails 
} from  '../actioncreators/ContactUsActionCreators';

import {
  ContactUsBase,
  ContactUsSubmission,
  ContactUsFinished
} from '../components';

import {
  submissionFailed,
  submissionSuccessful, 
  responseMessage, 
  subjectValue,
  reporterEmailValue,
  ccEmailsValue,
  messageValue,
  messageValidity,
  reporterEmailValidity,
  ccEmailsValidity,
  displayName,
  title
} from '../selectors/ContactUsSelectors';

import ContactUsStore from '../stores/ContactUsStore';

export default class ContactUsController extends WdkPageController {
  getStoreClass() {
    return ContactUsStore;
  }

  getActionCreators() {
    return {
      updateSubject: flow(targetValue, updateField('subject')),
      updateReporterEmail: flow(targetValue, updateField('reporterEmail')),
      updateCcEmails: flow(targetValue, updateField('ccEmails')),
      updateMessage: flow(targetValue, updateField('message')),
      submitDetails
    };
  }

  getStateFromStore() {
    const state = this.store.getState();

    return {
      displayName: displayName(state),
      submissionFailed: submissionFailed(state),
      submissionSuccessful: submissionSuccessful(state),
      responseMessage: responseMessage(state),
      subjectValue: subjectValue(state),
      reporterEmailValue: reporterEmailValue(state),
      ccEmailsValue: ccEmailsValue(state),
      messageValue: messageValue(state),
      reporterEmailValidity: reporterEmailValidity(state),
      ccEmailsValidity: ccEmailsValidity(state),
      messageValidity: messageValidity(state)
    };
  }

  getTitle() { 
    return title(this.store.getState());
  }

  renderView() {
    const {
      displayName,
      submissionFailed,
      submissionSuccessful,
      responseMessage,
      subjectValue,
      reporterEmailValue,
      ccEmailsValue,
      messageValue,
      reporterEmailValidity,
      ccEmailsValidity,
      messageValidity
    } = this.state;

    const {
      updateSubject,
      updateReporterEmail,
      updateCcEmails,
      updateMessage,
      submitDetails
    } = this.eventHandlers;

    return (
      <ContactUsBase>
        {
          submissionSuccessful
            ? <ContactUsFinished
                message={
                  `Your message has been sent to the ${displayName} team.
                  For your records, a copy has been sent to your email.`
                } 
              />
            : <ContactUsSubmission
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
        }
      </ContactUsBase>
    );
  }
}

const targetValue = ({ target: { value } }) => value;
