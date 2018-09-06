import {
  ContactUsSubmittedBody
} from '../../components';

const ContactUsError = ({ responseMessage }) => 
  <ContactUsSubmittedBody responseMessage={responseMessage} />;

export default ContactUsError;
