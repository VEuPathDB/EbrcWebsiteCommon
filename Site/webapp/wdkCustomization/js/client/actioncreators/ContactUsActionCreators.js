export const CHANGE_SUBJECT = 'contact-us/change-subject';
export const CHANGE_REPORTER_EMAIL = 'contact-us/change-email';
export const CHANGE_CC_EMAILS = 'contact-us/change-cc-emails';
export const CHANGE_MESSAGE = 'contact-us/change-message';
export const CHANGE_ATTACHMENT_METADATA = 'contact-us/change-attachment-metadata';
export const ADD_ATTACHMENT_METADATA = 'contact-us/add-attachment-metadata';
export const REMOVE_ATTACHMENT_METADATA = 'contact-us/remove-attachment-metadata';
export const UPDATE_SUBMITTING_STATUS = 'contact-us/update-submitting-status';
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
  payload: { 
    [fieldName]: contents 
  }
});

/**
 * Update the metadata for an attachment
 */
export const changeAttachmentMetadata = (index, metadata) => ({
  type: CHANGE_ATTACHMENT_METADATA,
  payload: {
    index,
    metadata
  }
});

/**
 * Add metadata for an attachment
 */
export const addAttachmentMetadata = metadata => ({
  type: ADD_ATTACHMENT_METADATA,
  payload: {
    metadata
  }
});

/**
 * Remove metadata for an attachment
 */
export const removeAttachmentMetadata = index => ({
  type: REMOVE_ATTACHMENT_METADATA,
  payload: {
    index
  }
});

/**
 * Update the "submitting" status 
 */
export const updateSubmittingStatus = submittingStatus => ({
  type: UPDATE_SUBMITTING_STATUS,
  payload: {
    submittingStatus
  }
});

/**
 * Submit form details to our dedicated "Contact Us" REST endpoint
 */
export const submitDetails = () => ({
  type: SUBMIT_DETAILS,
  payload: {}
});

/**
 * Report the results of the submission process
 */
export const finishRequest = (message, ok) => ({
  type: FINISH_REQUEST,
  payload: {
    message,
    ok
  }
})
