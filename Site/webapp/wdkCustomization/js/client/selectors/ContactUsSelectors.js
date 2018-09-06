import { find, get, pick } from 'lodash';

// Source: emailregex.com (which implements the RFC 5322 standard)
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const propSelectorFactory = prop => state => state[prop];

export const submissionStatus = propSelectorFactory('submissionStatus');
export const responseMessage = propSelectorFactory('responseMessage');

// TODO: cache the validities, "title", and "formFields" using reselect?
export const messageValidity = ({ message }) => message.length === 0 
  ? 'Please provide a message for our team.' 
  : '';

export const reporterEmailValidity = ({ reporterEmail }) => reporterEmail.length > 0 && !EMAIL_REGEX.test(reporterEmail) 
  ? 'Please provide a valid email address where we can reach you.' 
  : '';
  
export const ccEmailsValidity = ({ ccEmails }) => {
  if (ccEmails.length > 10) {
    return 'Please provide at most 10 emails to cc.';
  } 
  
  const firstInvalidEmail = find(ccEmails, ccEmail => !EMAIL_REGEX.test(ccEmail));
  
  if (firstInvalidEmail) {
    return `'${firstInvalidEmail}' is not a valid email address.`;
  } 

  return '';
}

export const title = state => {
  const displayName = get(
    state,
    'globalData.siteConfig.displayName',
    ''
  );

  return displayName
    ? `${displayName} :: Help`
    : 'Help';
};

export const formFields = state => pick(
  state,
  [
    'subject',
    'reporterEmail',
    'ccEmails',
    'message',
    'attachmentIds'
  ]
);
