import {
  ContactUsSubmittedBody
} from '../../components';

const ContactUsError = ({ responseMessage }) => 
  <ContactUsSubmittedBody message={responseMessage} />;

export default ContactUsError;
