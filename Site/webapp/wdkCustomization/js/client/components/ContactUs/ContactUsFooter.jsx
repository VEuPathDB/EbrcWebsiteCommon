import {
  ContactUsInstructions,
  ContactUsError
} from '../../components';

import {
  SUBMISSION_FAILED
} from '../../stores/ContactUsStore';

const ContactUsFooter = ({
  submissionStatus,
  responseMessage
}) => (
  <tr>
    <td align="center" colSpan={2}>
      <ContactUsInstructions />
      <input 
        value="Submit message" 
        type="submit" 
      />
      {
        submissionStatus === SUBMISSION_FAILED &&
        <ContactUsError 
          responseMessage={
            'An error occurred when we tried to submit your message. Please try to resubmit:\n' + responseMessage
          } 
        />
      }
    </td>
  </tr>
);

export default ContactUsFooter;
