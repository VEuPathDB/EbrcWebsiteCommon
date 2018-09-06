const ContactUsSubmittedBody = ({ responseMessage }) => (
  <div style={{ marginTop: '1em' }}>
    {
      responseMessage
        .split('\n')
        .map(line => <p key={line}>{line}</p>)
    }
  </div>
);

export default ContactUsSubmittedBody;
