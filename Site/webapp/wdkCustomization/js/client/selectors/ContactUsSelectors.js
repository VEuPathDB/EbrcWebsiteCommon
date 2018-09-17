import { flow, get } from 'lodash';
import { SUBMISSION_FAILED, SUBMISSION_SUCCESSFUL } from '../stores/ContactUsStore';

// Source: emailregex.com (which implements the RFC 5322 standard)
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const propSelectorFactory = prop => state => state[prop];

export const submissionStatus = propSelectorFactory('submissionStatus');
export const responseMessage = propSelectorFactory('responseMessage');
export const subjectValue = propSelectorFactory('subject');
export const reporterEmailValue = propSelectorFactory('reporterEmail');
export const ccEmailsValue = propSelectorFactory('ccEmails');
export const messageValue = propSelectorFactory('message');
export const attachmentIdsValue = propSelectorFactory('attachmentIds');

export const submissionFailed = flow(
  submissionStatus,
  status => status === SUBMISSION_FAILED
);

export const submissionSuccessful = flow(
  submissionStatus,
  status => status === SUBMISSION_SUCCESSFUL
);

export const reporterEmailValidity = flow(
  reporterEmailValue,
  reporterEmail => reporterEmail.length > 0 && !EMAIL_REGEX.test(reporterEmail)
    ? 'Please provide a valid email address where we can reach you.' 
    : ''
);

export const messageValidity = flow(
  messageValue,
  message => message.length === 0
    ? 'Please provide a message for our team.' 
    : ''
);

export const parsedCcEmails = flow(
  ccEmailsValue,
  ccEmails => ccEmails
    .split(/[;,]/)
    .map(token => token.trim())
    .filter(token => token.length > 0)
);

export const ccEmailsValidity = flow(
  parsedCcEmails,
  ccEmails => {
    if (ccEmails.length > 10) {
      return 'Please provide at most 10 emails to cc.';
    } 
    
    const invalidEmails = ccEmails.filter(ccEmail => !EMAIL_REGEX.test(ccEmail));
    
    return invalidEmails.length 
      ? `Please correct the following email address(es): ${invalidEmails.join(', ')}`
      : '';
  }
);

export const displayName = state => get(
  state,
  'globalData.siteConfig.displayName',
  ''
);

export const title = flow(
  displayName,
  name => name
    ? `${name} :: Help`
    : 'Help'
);

export const parsedFormFields = state => ({
  subject: subjectValue(state),
  reporterEmail: reporterEmailValue(state),
  ccEmails: parsedCcEmails(state),
  message: messageValue(state),
  attachmentIds: attachmentIdsValue(state)
});
