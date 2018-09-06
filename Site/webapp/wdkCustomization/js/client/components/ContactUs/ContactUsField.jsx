const ContactUsField = ({ label, inputElement }) => (
  <tr>
    <td style={{ verticalAlign: 'top' }}>
      <b>{label}</b>
    </td>
    <td>
      {inputElement}
    </td>
  </tr>
);

export default ContactUsField;
