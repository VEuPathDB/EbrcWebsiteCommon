const ContactUsSubmittedBody = ({ message }) => (
  <div className="submitted-body">
    {
      message
        .split('\n')
        .map(line => <p key={line}>{line}</p>)
    }
  </div>
);

export default ContactUsSubmittedBody;
