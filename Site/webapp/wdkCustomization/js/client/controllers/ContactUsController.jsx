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
  submissionStatus, 
  responseMessage, 
  messageValidity,
  reporterEmailValidity,
  ccEmailsValidity,
  title
} from '../selectors/ContactUsSelectors';

import ContactUsStore, {
  SUBMISSION_SUCCESSFUL
} from '../stores/ContactUsStore';

export default class ContactUsController extends WdkPageController {
  getStoreClass() {
    return ContactUsStore;
  }

  getActionCreators() {
    return {
      updateSubject: flow(targetValue, updateField('subject')),
      updateReporterEmail: flow(targetValue, updateField('reporterEmail')),
      updateCcEmails: flow(targetValue, parseCcField, updateField('ccEmails')),
      updateMessage: flow(targetValue, updateField('message')),
      submitDetails
    };
  }

  getStateFromStore() {
    const state = this.store.getState();

    return {
      submissionStatus: submissionStatus(state),
      responseMessage: responseMessage(state),
      messageValidity: messageValidity(state),
      reporterEmailValidity: reporterEmailValidity(state),
      ccEmailsValidity: ccEmailsValidity(state)
    };
  }

  getTitle() { 
    return title(this.store.getState());
  }

  renderView() {
    const {
      showInstructions,
      submissionStatus,
      responseMessage,
      reporterEmailValidity,
      ccEmailsValidity,
      messageValidity
    } = this.state;

    const { 
      toggleInstructions,
      updateSubject,
      updateReporterEmail,
      updateCcEmails,
      updateMessage,
      submitDetails
    } = this.eventHandlers;

    return (
      <ContactUsBase>
        {
          submissionStatus === SUBMISSION_SUCCESSFUL
            ? <ContactUsFinished
                responseMessage={responseMessage} 
              />
            : <ContactUsSubmission
                submissionStatus={submissionStatus}
                responseMessage={responseMessage}
                showInstructions={showInstructions}
                toggleInstructions={toggleInstructions}
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

const parseCcField = ccField => ccField
  .split(/[;,]/)
  .map(token => token.trim())
  .filter(token => token.length > 0);

const targetValue = ({ target: { value } }) => value;
