import { flow } from 'lodash';

import { connect } from 'react-redux';

import { PageController } from 'wdk-client/Controllers';

import { 
  updateField, 
  submitDetails 
} from  '../actioncreators/ContactUsActionCreators';

import {
  ContactUsFinished,
  ContactUsSubmission,
  SupportFormBase
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

class ContactUsController extends PageController {
  getTitle() { 
    return this.props.stateProps.title;
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
    } = this.props.stateProps;


    const {
      updateSubject,
      updateReporterEmail,
      updateCcEmails,
      updateMessage,
      submitDetails
    } = this.props.dispatchProps;

    return (
      <SupportFormBase>
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
      </SupportFormBase>
    );
  }
}

const targetValue = ({ target: { value } }) => value;

const mapStateToProps = flow(
  ({ contactUs }) => contactUs,
  state => ({
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
    messageValidity: messageValidity(state),
    title: title(state)
  })
);

const mapDispatchToProps = {
  updateSubject: flow(targetValue, updateField('subject')),
  updateReporterEmail: flow(targetValue, updateField('reporterEmail')),
  updateCcEmails: flow(targetValue, updateField('ccEmails')),
  updateMessage: flow(targetValue, updateField('message')),
  submitDetails
};

const mergeProps = (stateProps, dispatchProps) => ({
  stateProps,
  dispatchProps
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ContactUsController);
