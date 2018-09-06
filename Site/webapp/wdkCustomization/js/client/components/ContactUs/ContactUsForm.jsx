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

    this.reporterEmailRef.current.setCustomValidity(reporterEmailValidity);
    this.ccEmailsRef.current.setCustomValidity(ccEmailsValidity);
    this.messageRef.current.setCustomValidity(messageValidity);
  }

  render() {
    const {
      submissionStatus,
      responseMessage,
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
                inputElement={<input type="text" onInput={updateSubject} size={81} />}
              />
              <ContactUsField
                label="Your email address:"
                inputElement={<input ref={this.reporterEmailRef} type="text" onInput={updateReporterEmail} size={81} />}
              />
              <ContactUsField
                label="Cc addresses:"
                inputElement={<input ref={this.ccEmailsRef} type="text" onInput={updateCcEmails} size={81} />}
              />
              <ContactUsField
                label="Message:"
                inputElement={<textarea ref={this.messageRef} onInput={updateMessage} rows={8} cols={75}></textarea>}
              />
              <ContactUsFooter 
                submissionStatus={submissionStatus}
                responseMessage={responseMessage}
              />
          </tbody>
        </table>
      </form>
    );
  }
}

export default ContactUsForm;
