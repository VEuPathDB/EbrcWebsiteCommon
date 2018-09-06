export const CHANGE_SUBJECT = 'contact-us/change-subject';
export const CHANGE_REPORTER_EMAIL = 'contact-us/change-email';
export const CHANGE_CC_EMAILS = 'contact-us/change-cc-emails';
export const CHANGE_MESSAGE = 'contact-us/change-message';
export const SUBMIT_DETAILS = 'contact-us/submit-details';
export const FINISH_REQUEST = 'contact-us/finish-request';

const fieldToTypeMap = {
  subject: CHANGE_SUBJECT,
  reporterEmail: CHANGE_REPORTER_EMAIL,
  ccEmails: CHANGE_CC_EMAILS,
  message: CHANGE_MESSAGE
};

/**
 * Action creator factory for updating a field
 */
export const updateField = fieldName => contents => ({
  type: fieldToTypeMap[fieldName],
  payload: { [fieldName]: contents }
});

/**
 * Submit form details to our dedicated "Contact Us" REST endpoint
 */
export const submitDetails = () => ({
  type: SUBMIT_DETAILS,
  payload: {}
});
