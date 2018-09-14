import { invoke } from 'lodash';

import { Component, createRef } from 'react';

import {
  ContactUsField,
  ContactUsFooter
} from '../../components';

class ContactUsForm extends Component {
  constructor(...args) {
    super(...args);

    this.reporterEmailRef = createRef();
    this.ccEmailsRef = createRef();
    this.messageRef = createRef();
  }

  componentDidMount() {
    this.updateValidities();
  }

  componentDidUpdate() {
    this.updateValidities();
  }

  updateValidities() {
    const {
      reporterEmailValidity,
      ccEmailsValidity,
      messageValidity
    } = this.props;

    invoke(this.reporterEmailRef, 'current.setCustomValidity', reporterEmailValidity);
    invoke(this.ccEmailsRef, 'current.setCustomValidity', ccEmailsValidity);
    invoke(this.messageRef, 'current.setCustomValidity', messageValidity);
  }

  render() {
    const {
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
      submitDetails
    } = this.props;

    return (
      <form onSubmit={event => {
        event.preventDefault();
        submitDetails();
      }}>
        <table>
          <tbody>
              <ContactUsField
                label="Subject:"
                inputElement={
                  <input 
                    type="text" 
                    value={subjectValue}
                    onChange={updateSubject} 
                    size={81} 
                  />
                }
              />
              <ContactUsField
                label="Your email address:"
                inputElement={
                  <input 
                    ref={this.reporterEmailRef} 
                    type="text" 
                    value={reporterEmailValue}
                    onChange={updateReporterEmail} 
                    size={81} 
                  />
                }
              />
              <ContactUsField
                label="Cc addresses:"
                inputElement={
                  <input 
                    ref={this.ccEmailsRef} 
                    type="text" 
                    value={ccEmailsValue}
                    onChange={updateCcEmails} 
                    size={81} 
                  />
                }
              />
              <ContactUsField
                label="Message:"
                inputElement={
                  <textarea 
                    ref={this.messageRef} 
                    onChange={updateMessage} 
                    rows={8} 
                    cols={75}
                    value={messageValue}
                  >
                  </textarea>
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
  }
}

export default ContactUsForm;
