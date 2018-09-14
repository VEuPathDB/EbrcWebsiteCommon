import {
  ContactUsInstructions,
  ContactUsError
} from '../../components';

const ContactUsFooter = ({
  submissionFailed,
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
        submissionFailed &&
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
