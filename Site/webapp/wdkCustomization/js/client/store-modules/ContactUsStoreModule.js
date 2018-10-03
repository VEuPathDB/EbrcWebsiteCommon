import { merge } from 'rxjs';
import { filter, mergeMap, withLatestFrom } from 'rxjs/operators';

import { 
  CHANGE_SUBJECT,
  CHANGE_REPORTER_EMAIL,
  CHANGE_CC_EMAILS,
  CHANGE_MESSAGE,
  SUBMIT_DETAILS,
  FINISH_REQUEST
} from '../actioncreators/ContactUsActionCreators';

import { parsedFormFields } from '../selectors/ContactUsSelectors';

const CONTACT_US_ENDPOINT = '/contact-us';

export const SUBMISSION_PENDING = 'SUBMISSION_PENDING';
export const SUBMISSION_SUCCESSFUL = 'SUBMISSION_SUCCESSFUL';
export const SUBMISSION_FAILED = 'SUBMISSION_FAILED';

const initialState = {
  subject: '',
  reporterEmail: '',
  ccEmails: '',
  message: '',
  attachmentIds: [],
  submissionStatus: SUBMISSION_PENDING,
  responseMessage: ''
};

export function reduce(state = initialState, { type, payload }) {
  switch(type) {
    case CHANGE_SUBJECT:
      return {
        ...state,
        subject: payload.subject
      };

    case CHANGE_REPORTER_EMAIL:
      return {
        ...state,
        reporterEmail: payload.reporterEmail
      };

    case CHANGE_CC_EMAILS:
      return {
        ...state,
        ccEmails: payload.ccEmails
      };

    case CHANGE_MESSAGE:
      return {
        ...state,
        message: payload.message
      };

    case FINISH_REQUEST:
      return {
        ...state,
        submissionStatus: payload.ok 
          ? SUBMISSION_SUCCESSFUL 
          : SUBMISSION_FAILED,
        responseMessage: payload.message
      };

    default: 
      return state;
  }
}

export function observe(action$, state$, services) {
  return merge(
    observeSubmitDetails(action$, state$, services)
  );
}

const observeSubmitDetails = (action$, state$, services) =>
  action$.pipe(
    filter(({ type }) => type === SUBMIT_DETAILS),
    withLatestFrom(state$),
    mergeMap(async ([ , state]) => {
      const response = await jsonPostRequest(
        services.wdkService.serviceUrl,
        CONTACT_US_ENDPOINT,
        parsedFormFields(state)
      );

      return { 
        type: FINISH_REQUEST, 
        payload: { 
          message: await response.text(), 
          ok: response.ok 
        } 
      };
    })
  );

const jsonPostRequest = (serviceUrl, endpoint, body) => fetch(
  `${serviceUrl}${endpoint}`,
  {
    method: 'POST',
    headers: {
      'credentials': 'include',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
);
